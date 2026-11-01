import 'dotenv/config';
import bcrypt from 'bcryptjs';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { randomBytes, randomUUID } from 'node:crypto';

const app = express();
const port = Number(process.env.API_PORT || 3001);
const isProduction = process.env.NODE_ENV === 'production';
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 1);
const jwtSecret = process.env.JWT_SECRET || (!isProduction ? randomBytes(32).toString('hex') : '');
const adminUsername = (process.env.ADMIN_USERNAME || 'YOUTUBE').trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || '';
const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const validGoogleClientId = /^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(googleClientId);
const googleClient = validGoogleClientId ? new OAuth2Client(googleClientId) : null;
const accounts = new Map();
const sessions = new Map();
const bookings = [];
const pricing = { baseFare: 50, perKm: 18, loadingCharge: 120, commissionRate: 0.1 };
const materials = new Set(['Sand', 'Bricks', 'Cement', 'Gravel', 'Tiles', 'Steel']);
const paymentMethods = new Set(['UPI', 'Card', 'Cash']);
const sessionCookie = 'jtd_session';
const sessionDurationSeconds = 8 * 60 * 60;
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const bookingLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

if (!jwtSecret) throw new Error('JWT_SECRET must be set in production.');
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) throw new Error('TRUST_PROXY_HOPS must be a non-negative integer.');
if (isProduction && adminPassword.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters in production.');
if (isProduction && !process.env.APP_ORIGIN) throw new Error('APP_ORIGIN must be set in production.');

const adminPasswordHash = adminPassword.length >= 12 ? await bcrypt.hash(adminPassword, 12) : null;
app.set('trust proxy', trustProxyHops);
app.use(helmet());
app.use(express.json({ limit: '16kb' }));

app.use('/api', (request, response, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method) || !request.get('origin')) return next();

  const allowedOrigins = new Set([
    process.env.APP_ORIGIN || 'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]);

  if (!allowedOrigins.has(request.get('origin'))) {
    return response.status(403).json({ error: 'Request origin is not allowed.' });
  }
  return next();
});

function sendSessionCookie(response, token) {
  response.cookie(sessionCookie, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: sessionDurationSeconds * 1000,
  });
}

function clearSessionCookie(response) {
  response.clearCookie(sessionCookie, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  });
}

function readCookie(request, name) {
  const cookies = request.headers.cookie?.split(';') ?? [];
  const entry = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.trim().slice(name.length + 1)) : null;
}

function publicUser(account) {
  return { id: account.id, name: account.name, email: account.email, role: account.role };
}

function createSession(account, response) {
  const tokenId = randomUUID();
  const token = jwt.sign({ sub: account.id, role: account.role, jti: tokenId }, jwtSecret, {
    expiresIn: sessionDurationSeconds,
    issuer: 'jtd',
  });
  sessions.set(tokenId, Date.now() + sessionDurationSeconds * 1000);
  sendSessionCookie(response, token);
  return publicUser(account);
}

function requireAuthentication(request, response, next) {
  const token = readCookie(request, sessionCookie);
  if (!token) return response.status(401).json({ error: 'Please sign in to continue.' });

  try {
    const claims = jwt.verify(token, jwtSecret, { issuer: 'jtd' });
    const expiresAt = sessions.get(claims.jti);
    const account = claims.role === 'admin'
      ? { id: 'admin', name: 'JTD Administrator', email: '', role: 'admin' }
      : accounts.get(claims.sub);

    if (!expiresAt || expiresAt <= Date.now() || !account || account.role !== claims.role) {
      return response.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    }

    request.account = account;
    request.tokenId = claims.jti;
    return next();
  } catch {
    return response.status(401).json({ error: 'Your session is invalid. Please sign in again.' });
  }
}

function requireRole(...roles) {
  return (request, response, next) => {
    if (!roles.includes(request.account.role)) {
      return response.status(403).json({ error: 'You do not have permission to access this resource.' });
    }
    return next();
  };
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', storage: 'in-memory demo' });
});

app.get('/api/auth/config', (_request, response) => {
  response.json({ adminEnabled: Boolean(adminPasswordHash), googleEnabled: Boolean(googleClient) });
});

app.get('/api/auth/me', requireAuthentication, (request, response) => {
  response.json({ user: publicUser(request.account) });
});

app.post('/api/auth/register', authLimiter, async (request, response) => {
  const { name, email, password, role } = request.body ?? {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    return response.status(400).json({ error: 'Enter a name between 2 and 80 characters.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    return response.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    return response.status(400).json({ error: 'Use a password between 12 and 128 characters.' });
  }
  if (!['customer', 'driver'].includes(role)) {
    return response.status(400).json({ error: 'Choose a customer or driver account.' });
  }
  if ([...accounts.values()].some((account) => account.email === normalizedEmail)) {
    return response.status(409).json({ error: 'An account with that email already exists.' });
  }

  const account = {
    id: randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12),
    role,
  };
  accounts.set(account.id, account);
  return response.status(201).json({ user: createSession(account, response) });
});

app.post('/api/auth/login', authLimiter, async (request, response) => {
  const { email, username, password, role } = request.body ?? {};
  if (typeof password !== 'string' || password.length > 128) {
    return response.status(400).json({ error: 'Enter your password.' });
  }

  if (role === 'admin') {
    if (!adminPasswordHash) {
      return response.status(503).json({ error: 'Admin sign-in is not configured on this server.' });
    }
    const usernameMatches = typeof username === 'string' && username.trim().toLowerCase() === adminUsername;
    const passwordMatches = await bcrypt.compare(password, adminPasswordHash);
    if (!usernameMatches || !passwordMatches) {
      return response.status(401).json({ error: 'The admin username or password is incorrect.' });
    }
    const account = { id: 'admin', name: 'JTD Administrator', email: '', role: 'admin' };
    return response.json({ user: createSession(account, response) });
  }

  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const account = [...accounts.values()].find((candidate) => candidate.email === normalizedEmail && candidate.role === role);
  const passwordMatches = account ? await bcrypt.compare(password, account.passwordHash) : false;
  if (!passwordMatches) return response.status(401).json({ error: 'Email or password is incorrect.' });

  return response.json({ user: createSession(account, response) });
});

app.post('/api/auth/google', authLimiter, async (request, response) => {
  if (!googleClient) return response.status(503).json({ error: 'Google sign-in is not configured on this server.' });

  const { credential } = request.body ?? {};
  if (typeof credential !== 'string' || credential.length > 10000) {
    return response.status(400).json({ error: 'Google sign-in could not be verified.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified || !payload.sub) {
      return response.status(401).json({ error: 'Google did not provide a verified email address.' });
    }

    const email = payload.email.toLowerCase();
    let account = [...accounts.values()].find((candidate) => candidate.email === email);
    if (!account) {
      account = {
        id: randomUUID(),
        name: payload.name?.slice(0, 80) || email,
        email,
        googleSubject: payload.sub,
        role: 'customer',
      };
      accounts.set(account.id, account);
    }
    return response.json({ user: createSession(account, response) });
  } catch {
    return response.status(401).json({ error: 'Google sign-in could not be verified.' });
  }
});

app.post('/api/auth/logout', requireAuthentication, (request, response) => {
  sessions.delete(request.tokenId);
  clearSessionCookie(response);
  return response.status(204).end();
});

app.get('/api/bookings', requireAuthentication, (request, response) => {
  const visibleBookings = request.account.role === 'admin'
    ? bookings
    : bookings.filter((booking) => booking.customerId === request.account.id);
  response.json({ bookings: visibleBookings });
});

app.post('/api/bookings', requireAuthentication, requireRole('customer'), bookingLimiter, (request, response) => {
  const { pickup, destination, material, weight, distance, loading, paymentMethod, scheduled, scheduledFor } = request.body ?? {};
  const validText = (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 200;

  if (!validText(pickup) || !validText(destination)) {
    return response.status(400).json({ error: 'Enter a pickup and drop-off address.' });
  }
  if (!materials.has(material)) {
    return response.status(400).json({ error: 'Choose a supported construction material.' });
  }
  if (!Number.isFinite(weight) || weight <= 0 || weight > 40 || !Number.isFinite(distance) || distance <= 0 || distance > 300) {
    return response.status(400).json({ error: 'Enter a valid weight and route distance.' });
  }
  if (!paymentMethods.has(paymentMethod)) {
    return response.status(400).json({ error: 'Choose a supported payment method.' });
  }
  if (scheduled && (!Number.isFinite(Date.parse(scheduledFor)) || Date.parse(scheduledFor) <= Date.now())) {
    return response.status(400).json({ error: 'Choose a future delivery date and time.' });
  }

  const total = Math.round(pricing.baseFare + distance * pricing.perKm + (loading ? pricing.loadingCharge : 0));
  const booking = {
    id: `JTD-${randomUUID().slice(0, 8).toUpperCase()}`,
    customerId: request.account.id,
    pickup: pickup.trim(),
    destination: destination.trim(),
    material,
    weight,
    distance,
    loading: Boolean(loading),
    paymentMethod,
    scheduled: Boolean(scheduled),
    scheduledFor: scheduled ? new Date(scheduledFor).toISOString() : null,
    fare: {
      total,
      driverEarnings: Math.round(total * (1 - pricing.commissionRate)),
      platformCommission: Math.round(total * pricing.commissionRate),
    },
    status: 'finding_driver',
    createdAt: new Date().toISOString(),
  };

  bookings.unshift(booking);
  return response.status(201).json({ booking });
});

app.get('/api/admin/summary', requireAuthentication, requireRole('admin'), (_request, response) => {
  response.json({
    totalBookings: bookings.length,
    platformCommission: bookings.reduce((total, booking) => total + booking.fare.platformCommission, 0),
    pendingBookings: bookings.filter((booking) => booking.status === 'finding_driver').length,
  });
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  return response.status(500).json({ error: 'Something went wrong while processing the request.' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`JTD API listening on http://localhost:${port}`);
  if (!adminPasswordHash) console.warn('Admin sign-in is disabled. Configure an ADMIN_PASSWORD with at least 12 characters.');
  if (!googleClient) console.warn('Google sign-in is disabled. Configure a valid GOOGLE_CLIENT_ID to enable it.');
});