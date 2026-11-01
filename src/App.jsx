import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Bell,
  Box,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Construction,
  CreditCard,
  Fuel,
  LayoutDashboard,
  LocateFixed,
  LogOut,
  MapPin,
  Menu,
  MessageSquareText,
  PackageCheck,
  Plus,
  Route,
  Settings2,
  ShieldCheck,
  ShoppingBasket,
  Star,
  Truck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from 'react-leaflet';

const roleNavigation = {
  Customer: [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'My deliveries', icon: Truck, count: '2' },
    { label: 'Payments', icon: Wallet },
  ],
  Driver: [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Requests', icon: Bell, count: '3' },
    { label: 'My trips', icon: Route },
    { label: 'Earnings', icon: Banknote },
  ],
  Admin: [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Bookings', icon: Truck },
    { label: 'Drivers', icon: Users, count: '4' },
    { label: 'Pricing', icon: Settings2 },
    { label: 'Reports', icon: Banknote },
  ],
};

const materials = [
  { name: 'Sand', detail: 'River & M-sand', icon: '▰' },
  { name: 'Bricks', detail: 'Clay & blocks', icon: '▤' },
  { name: 'Cement', detail: 'Bagged goods', icon: '◫' },
  { name: 'Gravel', detail: 'Aggregate', icon: '▪' },
  { name: 'Tiles', detail: 'Floor & wall', icon: '▦' },
  { name: 'Steel', detail: 'Rods & sheets', icon: '⫶' },
];

const initialRequests = [
  { id: 'JTD-2084', material: 'M-sand', amount: '2.5 tons', from: 'Whitefield Material Market', to: 'Kundalahalli Gate', distance: '6.8 km', fare: 510, time: 'Pickup now' },
  { id: 'JTD-2081', material: 'Red bricks', amount: '1,200 pcs', from: 'Sri Balaji Bricks, Hoodi', to: 'Brookefield Layout', distance: '9.2 km', fare: 684, time: 'Today, 2:30 PM' },
  { id: 'JTD-2077', material: '20 mm gravel', amount: '3 tons', from: 'KR Puram Aggregate Yard', to: 'Varthur Main Road', distance: '11.4 km', fare: 810, time: 'Today, 4:00 PM' },
];

const money = (amount) => `₹${Math.round(amount).toLocaleString('en-IN')}`;

const pickupIcon = L.divIcon({
  className: 'map-pin map-pin-pickup',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const dropoffIcon = L.divIcon({
  className: 'map-pin map-pin-dropoff',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function Sidebar({ role, user, activePage, setActivePage, open, onClose }) {
  const displayRole = role === 'driver' ? 'Driver' : role === 'admin' ? 'Admin' : 'Customer';
  const nav = roleNavigation[displayRole];

  return (
    <>
      {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><Construction size={21} strokeWidth={2.5} /></div>
          <div className="brand-name">jtd<span>.</span><small>JUST TRACTOR DELIVERY</small></div>
          <button className="icon-button sidebar-close" aria-label="Close navigation" onClick={onClose}><X size={19} /></button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label={`${role} navigation`}>
          {nav.map(({ label, icon: Icon, count }) => (
            <button
              className={`nav-item ${activePage === label ? 'nav-item-active' : ''}`}
              key={label}
              onClick={() => { setActivePage(label); onClose(); }}
              aria-current={activePage === label ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {count && <span className="nav-count">{count}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="support-tile">
            <div className="support-icon"><CircleHelp size={17} /></div>
            <div><strong>Need a hand?</strong><span>Our team is here 24/7</span></div>
            <ArrowUpRight size={15} />
          </div>
          <div className="profile-row">
            <div className="avatar avatar-customer">{user.name.slice(0, 2).toUpperCase()}</div>
            <div className="profile-copy"><strong>{user.name}</strong><span>{user.email || 'Administrator'}</span></div>
            <BadgeCheck size={16} />
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ role, title, onMenuClick, onLogout }) {
  const displayRole = role === 'driver' ? 'Driver' : role === 'admin' ? 'Admin' : 'Customer';
  return (
    <header className="topbar">
      <div className="topbar-title-wrap">
        <button className="icon-button mobile-menu" onClick={onMenuClick} aria-label="Open navigation"><Menu size={20} /></button>
        <div><div className="eyebrow">{role} workspace</div><h1>{title}</h1></div>
      </div>
      <div className="topbar-actions">
        <span className="account-role-badge"><ShieldCheck size={14} /> {displayRole}</span>
        <button className="notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
        <button className="logout-button" onClick={onLogout} aria-label="Sign out"><LogOut size={16} /><span>Sign out</span></button>
      </div>
    </header>
  );
}

function RouteMap({ distance }) {
  const route = [
    [12.9718, 77.7499],
    [12.9711, 77.743],
    [12.9696, 77.7375],
    [12.9693, 77.731],
    [12.9691, 77.725],
    [12.971, 77.719],
    [12.9752, 77.716],
  ];

  return (
    <section className="map-panel" aria-label="Delivery route preview">
      <MapContainer center={[12.9702, 77.733]} zoom={14} scrollWheelZoom={false} zoomControl={false} className="route-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={route} pathOptions={{ color: '#22231f', weight: 4, opacity: 0.82, dashArray: '7 8' }} />
        <Marker position={route[0]} icon={pickupIcon}><Tooltip direction="top">Pickup · Whitefield</Tooltip></Marker>
        <Marker position={route[route.length - 1]} icon={dropoffIcon}><Tooltip direction="top">Drop-off · Brookefield</Tooltip></Marker>
      </MapContainer>
      <div className="map-label"><span className="map-live-dot" /> ROUTE PREVIEW <span className="map-label-divider" /> WHITEFIELD, BENGALURU</div>
      <div className="map-distance"><Route size={14} /> {distance} km <span>estimated</span></div>
      <div className="map-legend"><span><i className="legend-dot legend-pickup" /> Pickup</span><span><i className="legend-dot legend-dropoff" /> Drop-off</span></div>
    </section>
  );
}

function FareBreakdown({ distance, loading }) {
  const base = 50;
  const transport = Math.max(0, Number(distance) || 0) * 18;
  const handling = loading ? 120 : 0;
  const total = base + transport + handling;
  const commission = total * 0.1;

  return (
    <>
      <div className="fare-rows">
        <div><span>Base fare</span><strong>{money(base)}</strong></div>
        <div><span>Distance · {Number(distance || 0).toFixed(1)} km × ₹18</span><strong>{money(transport)}</strong></div>
        {loading && <div><span>Loading assistance</span><strong>{money(handling)}</strong></div>}
      </div>
      <div className="fare-total"><span>Estimated total</span><strong>{money(total)}</strong></div>
      <div className="fare-footnote"><ShieldCheck size={14} /><span>Includes taxes · No hidden fees</span></div>
      <div className="fare-split"><span>Driver gets <b>{money(total - commission)}</b></span><i /><span>JTD fee <b>{money(commission)}</b></span></div>
      <span className="fare-data" aria-hidden="true">{total}</span>
    </>
  );
}

function CustomerDashboard({ activePage }) {
  const [pickup, setPickup] = useState('Whitefield Material Market, Bengaluru');
  const [destination, setDestination] = useState('Brookefield Layout, Bengaluru');
  const [material, setMaterial] = useState('Sand');
  const [weight, setWeight] = useState('2.5');
  const [distance, setDistance] = useState('8.4');
  const [loading, setLoading] = useState(true);
  const [scheduled, setScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [payment, setPayment] = useState('UPI');
  const [booked, setBooked] = useState(false);
  const [bookingPending, setBookingPending] = useState(false);
  const [toast, setToast] = useState('');

  const swapLocations = () => {
    setPickup(destination);
    setDestination(pickup);
  };

  const bookDelivery = async () => {
    if (scheduled && (!scheduledFor || new Date(scheduledFor).getTime() <= Date.now())) {
      setToast('Choose a future delivery date and time first.');
      window.setTimeout(() => setToast(''), 4000);
      return;
    }
    setBookingPending(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup,
          destination,
          material,
          weight: Number(weight),
          distance: Number(distance),
          loading,
          paymentMethod: payment,
          scheduled,
          scheduledFor: scheduled ? new Date(scheduledFor).toISOString() : null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create your delivery request.');
      setBooked(true);
      setToast(`Request ${result.booking.id} is on its way to nearby drivers.`);
    } catch (error) {
      setToast(error.message || 'Could not reach JTD. Please try again.');
    } finally {
      setBookingPending(false);
      window.setTimeout(() => setToast(''), 5000);
    }
  };

  if (activePage !== 'Overview') {
    const pageCopy = {
      'My deliveries': ['Your deliveries', 'Every material run, all in one place.'],
      Payments: ['Payments & invoices', 'Your payment methods and delivery receipts.'],
    };
    const [heading, subheading] = pageCopy[activePage] ?? pageCopy['My deliveries'];
    return <EmptyState heading={heading} subheading={subheading} icon={activePage === 'Payments' ? Wallet : Truck} action="Book a delivery" onAction={() => window.dispatchEvent(new CustomEvent('jtd-navigate', { detail: 'Overview' }))} />;
  }

  return (
    <div className="customer-layout">
      <div className="customer-main-column">
        <section className="welcome-row">
          <div><div className="eyebrow">SATURDAY, 24 MAY</div><h2>Let's move something.</h2><p>Your next build starts with a delivery.</p></div>
          <div className="trust-note"><span><BadgeCheck size={17} /></span><div><strong>Verified tractor owners</strong><small>Ready when your site is</small></div></div>
        </section>

        <RouteMap distance={distance || '0'} />

        <section className="booking-panel" aria-labelledby="booking-heading">
          <div className="section-heading"><div><div className="eyebrow">NEW DELIVERY</div><h2 id="booking-heading">Where are we hauling?</h2></div><span className="step-label">01 <i /> 02 <i /> 03</span></div>

          <div className="route-fields">
            <div className="location-rail"><i className="location-dot location-start" /><span /><i className="location-dot location-end" /></div>
            <label className="field location-field"><span>Pickup from</span><input value={pickup} onChange={(event) => setPickup(event.target.value)} aria-label="Pickup address" /></label>
            <button className="swap-button" onClick={swapLocations} aria-label="Swap pickup and drop-off"><ArrowDownUp size={16} /></button>
            <label className="field location-field"><span>Drop off at</span><input value={destination} onChange={(event) => setDestination(event.target.value)} aria-label="Drop-off address" /></label>
          </div>

          <div className="form-divider" />
          <div className="form-section-title"><span>What are we moving?</span><small>Choose a material</small></div>
          <div className="material-grid">
            {materials.map((item) => (
              <button className={`material-option ${material === item.name ? 'material-selected' : ''}`} key={item.name} onClick={() => setMaterial(item.name)} aria-pressed={material === item.name}>
                <span className="material-symbol" aria-hidden="true">{item.icon}</span><strong>{item.name}</strong><small>{item.detail}</small>
              </button>
            ))}
          </div>

          <div className="booking-inputs">
            <label className="field"><span>Estimated weight</span><div className="input-with-suffix"><input type="number" min="0.1" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} /><span>tons</span></div></label>
            <label className="field"><span>Route distance</span><div className="input-with-suffix"><input type="number" min="0" step="0.1" value={distance} onChange={(event) => setDistance(event.target.value)} /><span>km</span></div></label>
          </div>

          <div className="form-divider" />
          <div className="booking-options">
            <div className="form-section-title"><span>When do you need it?</span></div>
            <div className="segmented-control" role="group" aria-label="Choose delivery time">
              <button className={!scheduled ? 'segment-selected' : ''} onClick={() => setScheduled(false)}><Clock3 size={15} /> Now</button>
              <button className={scheduled ? 'segment-selected' : ''} onClick={() => setScheduled(true)}><CalendarDays size={15} /> Schedule</button>
            </div>
            {scheduled && <label className="field schedule-field"><span>Delivery date and time</span><input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} required /></label>}
          </div>

          <button className={`loading-option ${loading ? 'loading-checked' : ''}`} onClick={() => setLoading(!loading)} aria-pressed={loading}>
            <span className="checkbox-custom">{loading && <Check size={13} />}</span><span className="loading-copy"><strong>Add loading help</strong><small>Driver helps load and unload · ₹120</small></span><span className="loading-price">+₹120</span>
          </button>
        </section>

        <section className="recent-section">
          <div className="section-heading"><div><div className="eyebrow">ON THE MOVE</div><h2>Recent deliveries</h2></div><button className="text-button" onClick={() => window.dispatchEvent(new CustomEvent('jtd-navigate', { detail: 'My deliveries' }))}>View all <ArrowRight size={15} /></button></div>
          <div className="recent-delivery"><div className="recent-icon"><Box size={18} /></div><div className="recent-copy"><strong>Red bricks <span>· 1,200 pcs</span></strong><small>Yesterday · Hoodi to Whitefield</small></div><span className="status-pill status-delivered"><CheckCircle2 size={13} /> Delivered</span><strong className="recent-price">₹684</strong><button className="icon-button recent-arrow" aria-label="View delivery"><ArrowRight size={17} /></button></div>
        </section>
      </div>

      <aside className="booking-sidebar">
        <section className="estimate-card">
          <div className="estimate-header"><div><div className="eyebrow">YOUR ESTIMATE</div><h2>A fair price.<br />Every time.</h2></div><div className="estimate-stamp"><span>JTD</span><small>FAIR FARE</small></div></div>
          <FareBreakdown distance={distance} loading={loading} />
          <div className="payment-section"><div className="payment-title"><span>Payment method</span><button aria-label="Add payment method"><Plus size={15} /></button></div>
            <div className="payment-options" role="group" aria-label="Payment method">
              {[['UPI', 'upi'], ['Card', 'card'], ['Cash', 'cash']].map(([label, type]) => {
                const Icon = type === 'UPI' ? Wallet : type === 'Card' ? CreditCard : Banknote;
                return <button className={`payment-option ${payment === label ? 'payment-selected' : ''}`} key={label} onClick={() => setPayment(label)} aria-pressed={payment === label}><Icon size={15} />{label}</button>;
              })}
            </div>
          </div>
          <button className="book-button" onClick={bookDelivery} disabled={bookingPending || booked}>{bookingPending ? <>Sending request...</> : booked ? <><CheckCircle2 size={18} /> Request sent</> : <>Find my tractor <ArrowRight size={18} /></>}</button>
          <div className="secure-note"><ShieldCheck size={13} /> Secure checkout <i /> Free cancellation before pickup</div>
        </section>

        {booked ? <BookingProgress material={material} pickup={pickup} destination={destination} /> : <section className="driver-preview"><div className="driver-preview-top"><div><div className="eyebrow">NEAR YOUR SITE</div><h3>Good hands, close by.</h3></div><span className="online-indicator"><i /> 4 online</span></div><div className="driver-preview-row"><div className="driver-photo driver-photo-one">RK</div><div className="driver-details"><strong>Ravi Kumar <BadgeCheck size={14} /></strong><span>Mahindra 475 DI · 2.5 ton</span><div className="driver-rating"><Star size={12} fill="currentColor" /> 4.9 <i /> 128 deliveries</div></div><span className="driver-distance">1.2 km</span></div><div className="driver-preview-footer"><span><ShieldCheck size={14} /> Background checked</span><span>Usually responds in 2 min</span></div></section>}

        <div className="help-banner"><div className="help-banner-icon"><MessageSquareText size={17} /></div><span>Something special to haul?</span><button aria-label="Contact support"><ArrowUpRight size={16} /></button></div>
      </aside>
      {toast && <div className="toast-message" role="status"><CheckCircle2 size={18} />{toast}<button aria-label="Dismiss message" onClick={() => setToast('')}><X size={16} /></button></div>}
    </div>
  );
}

function BookingProgress({ material, pickup, destination }) {
  return (
    <section className="progress-card"><div className="progress-title"><span className="progress-icon"><PackageCheck size={17} /></span><div><strong>Finding your tractor</strong><small>Request sent to nearby drivers</small></div><span className="searching-pulse" /></div><div className="progress-route"><span className="progress-dot" /><div><b>{pickup}</b><small>{material} pickup</small></div></div><div className="progress-route"><span className="progress-dot progress-dot-end" /><div><b>{destination}</b><small>Delivery destination</small></div></div><div className="progress-bottom"><Clock3 size={14} /> Looking for a match <span>Usually under 2 min</span></div></section>
  );
}

function EmptyState({ heading, subheading, icon: Icon, action, onAction }) {
  return <section className="empty-page"><div className="empty-icon"><Icon size={25} /></div><div className="eyebrow">JTD DELIVERY DESK</div><h2>{heading}</h2><p>{subheading}</p><div className="empty-table"><div className="empty-table-head"><span>DELIVERY</span><span>ROUTE</span><span>STATUS</span><span>FARE</span></div><div className="recent-delivery"><div className="recent-icon"><Box size={18} /></div><div className="recent-copy"><strong>Red bricks <span>· 1,200 pcs</span></strong><small>JTD-1926 · Yesterday</small></div><span className="route-summary">Hoodi <ArrowRight size={13} /> Whitefield</span><span className="status-pill status-delivered"><CheckCircle2 size={13} /> Delivered</span><strong className="recent-price">₹684</strong></div><div className="recent-delivery"><div className="recent-icon recent-icon-sand"><Box size={18} /></div><div className="recent-copy"><strong>M-sand <span>· 2.5 tons</span></strong><small>JTD-1884 · 22 May</small></div><span className="route-summary">Whitefield <ArrowRight size={13} /> Varthur</span><span className="status-pill status-progress">In transit</span><strong className="recent-price">₹510</strong></div></div><button className="book-button empty-action" onClick={onAction}>{action} <ArrowRight size={17} /></button></section>;
}

function DriverDashboard({ activePage }) {
  const [available, setAvailable] = useState(true);
  const [requests, setRequests] = useState(initialRequests);
  const [notice, setNotice] = useState('');
  const [earningsTab, setEarningsTab] = useState('This week');
  const acceptRequest = (request) => {
    setRequests((current) => current.filter((item) => item.id !== request.id));
    setNotice(`${request.id} accepted. Pickup details are ready.`);
    window.setTimeout(() => setNotice(''), 4000);
  };

  if (activePage === 'Earnings') return <EarningsDashboard earningsTab={earningsTab} setEarningsTab={setEarningsTab} />;
  if (activePage === 'My trips') return <EmptyState heading="Your trips" subheading="A clear view of every delivery you've completed." icon={Route} action="Back to overview" onAction={() => window.dispatchEvent(new CustomEvent('jtd-navigate', { detail: 'Overview' }))} />;

  return (
    <div className="driver-dashboard">
      <section className="driver-welcome"><div><div className="eyebrow">SATURDAY, 24 MAY · WHITEFIELD</div><h2>Good morning, Ravi.</h2><p>Your tractor is ready. Here’s what’s moving today.</p></div><button className={`availability-toggle ${available ? 'availability-online' : ''}`} onClick={() => setAvailable(!available)} aria-pressed={available}><i /> {available ? 'You’re online' : 'You’re offline'} <ChevronDown size={15} /></button></section>
      <section className="driver-stats"><StatCard label="Today’s earnings" value="₹1,840" detail="+12% from yesterday" icon={Banknote} accent="green" /><StatCard label="Trips completed" value="6" detail="Across 3 delivery zones" icon={Truck} accent="yellow" /><StatCard label="Your rating" value="4.9" detail="From 128 customers" icon={Star} accent="coral" /></section>

      {activePage === 'Requests' ? <section className="requests-panel"><div className="section-heading"><div><div className="eyebrow">MATCHED TO YOUR TRACTOR</div><h2>Delivery requests</h2></div><span className="requests-count">{requests.length} nearby</span></div><RequestList requests={requests} onAccept={acceptRequest} /></section> : <>
        <div className="driver-content-grid"><section className="requests-panel"><div className="section-heading"><div><div className="eyebrow">MATCHED TO YOUR TRACTOR</div><h2>New requests</h2></div><button className="text-button" onClick={() => window.dispatchEvent(new CustomEvent('jtd-navigate', { detail: 'Requests' }))}>See all <ArrowRight size={15} /></button></div><RequestList requests={requests.slice(0, 2)} onAccept={acceptRequest} /></section><section className="earnings-card"><div className="section-heading"><div><div className="eyebrow">YOUR HARD WORK, PAID</div><h2>This week</h2></div><button className="icon-button" aria-label="Earnings options"><ArrowUpRight size={17} /></button></div><strong className="earnings-total">₹12,460</strong><span className="earnings-caption"><span>+8.2%</span> vs last week</span><EarningsChart /><div className="chart-days"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div><div className="payout-note"><div className="payout-icon"><Wallet size={16} /></div><span>Next payout<strong>Monday, 26 May</strong></span><span className="payout-amount">₹8,350</span></div></section></div>
        <section className="driver-safety"><ShieldCheck size={19} /><div><strong>Good to go, Ravi.</strong><span>Your RC, driving licence and Aadhaar are verified. Stay safe out there.</span></div><BadgeCheck size={18} /></section>
      </>}
      {notice && <div className="toast-message" role="status"><CheckCircle2 size={18} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button></div>}
    </div>
  );
}

function RequestList({ requests, onAccept }) {
  if (!requests.length) return <div className="no-requests"><CheckCircle2 size={20} /> All caught up. New requests will show up here.</div>;
  return <div className="request-list">{requests.map((request) => <article className="request-card" key={request.id}><div className="request-card-head"><span className="request-material-icon"><ShoppingBasket size={17} /></span><div><strong>{request.material} <span>· {request.amount}</span></strong><small>{request.id} <i /> {request.time}</small></div><strong className="request-fare">{money(request.fare)}</strong></div><div className="request-route"><div><i className="location-dot location-start" /><span><b>Pickup</b>{request.from}</span></div><div><i className="location-dot location-end" /><span><b>Drop-off</b>{request.to}</span></div></div><div className="request-footer"><span><Route size={14} /> {request.distance}</span><span><Fuel size={14} /> Approx. 25 min</span><button onClick={() => onAccept(request)}>Accept job <ArrowRight size={15} /></button></div></article>)}</div>;
}

function StatCard({ label, value, detail, icon: Icon, accent }) {
  return <article className="stat-card"><span className={`stat-icon stat-icon-${accent}`}><Icon size={18} /></span><div className="eyebrow">{label}</div><strong>{value}</strong><span className="stat-detail">{detail}</span></article>;
}

function EarningsChart() {
  return <div className="earnings-chart" role="img" aria-label="Weekly earnings chart, highest on Saturday"><div className="chart-grid"><i /><i /><i /></div><svg viewBox="0 0 360 110" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#acd4a7" stopOpacity="0.45" /><stop offset="100%" stopColor="#acd4a7" stopOpacity="0.02" /></linearGradient></defs><path d="M0 79 C20 74 28 82 48 68 S82 75 102 53 S137 62 156 44 S190 56 210 38 S245 48 262 24 S293 40 310 20 S339 38 360 8 V110 H0 Z" fill="url(#chartFill)" /><path d="M0 79 C20 74 28 82 48 68 S82 75 102 53 S137 62 156 44 S190 56 210 38 S245 48 262 24 S293 40 310 20 S339 38 360 8" fill="none" stroke="#3e7853" strokeWidth="2.5" /></svg></div>;
}

function EarningsDashboard({ earningsTab, setEarningsTab }) {
  return <div className="earnings-page"><div className="page-intro"><div><div className="eyebrow">YOUR WORK, YOUR WORTH</div><h2>Earnings</h2><p>Every delivery adds up. Here’s the picture.</p></div><select value={earningsTab} onChange={(event) => setEarningsTab(event.target.value)} aria-label="Earnings period"><option>This week</option><option>This month</option><option>This year</option></select></div><section className="earnings-card earnings-wide"><div className="eyebrow">TOTAL EARNED · {earningsTab.toUpperCase()}</div><strong className="earnings-total">₹12,460</strong><span className="earnings-caption"><span>+8.2%</span> compared with the previous period</span><EarningsChart /><div className="chart-days"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div></section><section className="payout-history"><div className="section-heading"><div><div className="eyebrow">PAID TO YOUR BANK</div><h2>Recent payouts</h2></div></div><div className="payout-row"><div className="payout-icon"><Wallet size={16} /></div><span>19 May 2025<strong>Weekly settlement · HDFC •••• 2841</strong></span><b>₹8,350</b><CheckCircle2 size={16} /></div><div className="payout-row"><div className="payout-icon"><Wallet size={16} /></div><span>12 May 2025<strong>Weekly settlement · HDFC •••• 2841</strong></span><b>₹7,920</b><CheckCircle2 size={16} /></div></section></div>;
}

function AdminDashboard({ activePage }) {
  const [verified, setVerified] = useState([]);
  const [commissionRate, setCommissionRate] = useState('10');
  const [notice, setNotice] = useState('');

  if (activePage === 'Drivers') return <section className="admin-table-section"><div className="section-heading"><div><div className="eyebrow">PEOPLE ON THE ROAD</div><h2>Driver verification</h2></div><span className="requests-count">4 need review</span></div><DriverReviewTable verified={verified} setVerified={setVerified} /></section>;
  if (activePage === 'Pricing') return <section className="pricing-page"><div className="eyebrow">FARE CONFIGURATION</div><h2>Keep every fare fair.</h2><p>Rates apply to new bookings across all active delivery zones.</p><div className="pricing-form"><label className="field"><span>Base fare</span><div className="input-with-suffix"><input type="number" defaultValue="50" min="0" /><span>INR</span></div></label><label className="field"><span>Per kilometre</span><div className="input-with-suffix"><input type="number" defaultValue="18" min="0" /><span>INR / km</span></div></label><label className="field"><span>Loading assistance</span><div className="input-with-suffix"><input type="number" defaultValue="120" min="0" /><span>INR</span></div></label><label className="field"><span>Platform commission</span><div className="input-with-suffix"><input type="number" value={commissionRate} onChange={(event) => setCommissionRate(event.target.value)} min="0" max="100" /><span>%</span></div></label><div className="commission-preview"><div className="commission-icon"><Banknote size={18} /></div><span>On a ₹500 delivery<strong>Driver receives {money(500 - 500 * Number(commissionRate || 0) / 100)}</strong></span><span>JTD {money(500 * Number(commissionRate || 0) / 100)}</span></div><button className="book-button" onClick={() => { setNotice('Pricing settings saved for new bookings.'); window.setTimeout(() => setNotice(''), 3500); }}><Check size={17} /> Save pricing</button></div>{notice && <div className="inline-notice" role="status"><CheckCircle2 size={16} /> {notice}</div>}</section>;
  if (activePage === 'Bookings') return <EmptyState heading="Bookings in motion" subheading="A live view of deliveries across every zone." icon={Truck} action="Back to overview" onAction={() => window.dispatchEvent(new CustomEvent('jtd-navigate', { detail: 'Overview' }))} />;
  if (activePage === 'Reports') return <section className="admin-report"><div className="eyebrow">PLATFORM PERFORMANCE</div><h2>Growth, in good motion.</h2><p>Delivery volume and earnings over the last seven days.</p><EarningsChart /><div className="report-stats"><div><span>Gross delivery value</span><strong>₹2,48,650</strong></div><div><span>JTD commission · 10%</span><strong>₹24,865</strong></div><div><span>Driver earnings · 90%</span><strong>₹2,23,785</strong></div></div></section>;

  return (
    <div className="admin-dashboard"><section className="admin-welcome"><div><div className="eyebrow">SATURDAY, 24 MAY · PLATFORM OVERVIEW</div><h2>Things are moving.</h2><p>Here’s the JTD network at a glance.</p></div><button className="outline-button"><CalendarDays size={15} /> This month <ChevronDown size={14} /></button></section><section className="admin-stats"><StatCard label="Total deliveries" value="1,284" detail="+14.2% this month" icon={Truck} accent="yellow" /><StatCard label="Active drivers" value="86" detail="4 documents to review" icon={Users} accent="green" /><StatCard label="Platform revenue" value="₹2.48L" detail="10% commission · +8.4%" icon={Banknote} accent="coral" /><StatCard label="In progress" value="18" detail="Across 6 delivery zones" icon={Route} accent="blue" /></section><section className="admin-overview-grid"><section className="admin-report"><div className="section-heading"><div><div className="eyebrow">DELIVERY VOLUME</div><h2>Busy roads, growing reach.</h2></div><button className="icon-button" aria-label="Open report"><ArrowUpRight size={17} /></button></div><EarningsChart /><div className="chart-days"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div></section><section className="commission-card"><div className="eyebrow">THIS MONTH</div><h3>A fair share<br />of every trip.</h3><div className="commission-number">₹24,865</div><span className="stat-detail">JTD platform commission</span><div className="commission-bar"><i /></div><div className="commission-split"><span><i className="split-platform" /> JTD <b>10%</b></span><span><i className="split-driver" /> Drivers <b>90%</b></span></div><button className="commission-link" onClick={() => window.dispatchEvent(new CustomEvent('jtd-navigate', { detail: 'Pricing' }))}>Review pricing <ArrowRight size={15} /></button></section></section><section className="admin-table-section"><div className="section-heading"><div><div className="eyebrow">NEEDS YOUR EYES</div><h2>Driver documents</h2></div><button className="text-button" onClick={() => window.dispatchEvent(new CustomEvent('jtd-navigate', { detail: 'Drivers' }))}>Review all 4 <ArrowRight size={15} /></button></div><DriverReviewTable verified={verified} setVerified={setVerified} compact /></section></div>
  );
}

function DriverReviewTable({ verified, setVerified, compact = false }) {
  const drivers = [
    { id: 'D-0841', name: 'Suresh Reddy', initials: 'SR', vehicle: 'Mahindra 475 DI', submitted: 'Today, 9:42 AM', docs: 'RC, licence, Aadhaar' },
    { id: 'D-0838', name: 'Mohammed Imran', initials: 'MI', vehicle: 'Sonalika DI 35', submitted: 'Today, 8:16 AM', docs: 'RC, licence, Aadhaar' },
    { id: 'D-0835', name: 'Arjun Patil', initials: 'AP', vehicle: 'Swaraj 744 FE', submitted: 'Yesterday', docs: 'RC, licence, Aadhaar' },
    { id: 'D-0831', name: 'Lakshmi Narayan', initials: 'LN', vehicle: 'John Deere 5036', submitted: 'Yesterday', docs: 'RC, licence, Aadhaar' },
  ];
  return <div className={`review-table ${compact ? 'review-table-compact' : ''}`}><div className="review-table-head"><span>DRIVER</span><span>DOCUMENTS</span><span>SUBMITTED</span><span>STATUS</span><span>ACTION</span></div>{drivers.slice(0, compact ? 3 : 4).map((driver) => { const approved = verified.includes(driver.id); return <div className="review-table-row" key={driver.id}><div className="review-person"><span className="review-avatar">{driver.initials}</span><span><strong>{driver.name}</strong><small>{driver.vehicle} · {driver.id}</small></span></div><span className="doc-copy"><ShieldCheck size={14} /> {driver.docs}</span><span className="submitted-copy">{driver.submitted}</span><span className={`review-status ${approved ? 'review-status-approved' : ''}`}><i /> {approved ? 'Verified' : 'Pending'}</span><button className={`review-action ${approved ? 'review-action-approved' : ''}`} onClick={() => setVerified((current) => approved ? current.filter((id) => id !== driver.id) : [...current, driver.id])}>{approved ? <><Check size={14} /> Approved</> : 'Review'}</button></div>; })}</div>;
}

function AuthScreen({ onAuthenticated, googleEnabled, adminEnabled }) {
  const [mode, setMode] = useState('login');
  const [accountType, setAccountType] = useState('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const googleButton = useRef(null);
  const viteGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const googleConfigured = googleEnabled && /^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(viteGoogleClientId);

  useEffect(() => {
    if (!googleConfigured || !googleButton.current) return undefined;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButton.current) return;
      googleButton.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: viteGoogleClientId,
        callback: async ({ credential }) => {
          setPending(true);
          setError('');
          try {
            const response = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Google sign-in failed.');
            onAuthenticated(result.user);
          } catch (googleError) {
            setError(googleError.message || 'Google sign-in failed.');
          } finally {
            setPending(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButton.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        width: Math.min(360, googleButton.current.clientWidth),
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return undefined;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setError('Google sign-in could not be loaded.');
    document.head.append(script);
    return () => script.remove();
  }, [googleConfigured, onAuthenticated]);

  const submitCredentials = async (event) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const registering = mode === 'register';
      const response = await fetch(registering ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registering
          ? { name, email, password, role: accountType }
          : accountType === 'admin'
            ? { username, password, role: accountType }
            : { email, password, role: accountType }),
      });
      const result = response.status === 204 ? {} : await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
      onAuthenticated(result.user);
    } catch (authError) {
      setError(authError.message || 'Unable to reach JTD. Please try again.');
    } finally {
      setPending(false);
    }
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'register' && accountType === 'admin') setAccountType('customer');
    setError('');
  };

  return (
    <main className="auth-screen">
      <section className="auth-story">
        <div className="auth-brand"><span className="auth-brand-mark"><Construction size={21} /></span><span>jtd<span>.</span></span></div>
        <div className="auth-story-content"><div className="auth-story-tag"><span /> BUILT FOR THE PEOPLE WHO BUILD</div><h1>Materials move.<br /><span>Projects move.</span></h1><p>Reliable tractor deliveries for every kind of build. Connect with verified local drivers and keep your site moving.</p><div className="auth-story-note"><Route size={16} /><span>One delivery at a time, right on site.</span></div></div>
        <div className="auth-story-footer"><span>JTD · JUST TRACTOR DELIVERY</span><span>BUILT FOR THE GROUND UP</span></div>
      </section>
      <section className="auth-form-side">
        <div className="auth-card">
          <div className="auth-mobile-brand"><span className="auth-brand-mark"><Construction size={20} /></span><strong>jtd<span>.</span></strong></div>
          <div className="auth-heading"><div className="eyebrow">YOUR DELIVERY DESK</div><h2>{mode === 'register' ? 'Create your account.' : 'Good to have you back.'}</h2><p>{mode === 'register' ? 'A better way to get materials to your site.' : 'Sign in to pick up where you left off.'}</p></div>
          <div className="auth-type-control" role="group" aria-label="Account type">
            {(mode === 'register' ? [['customer', 'Customer'], ['driver', 'Driver']] : [['customer', 'Customer'], ['driver', 'Driver'], ['admin', 'Admin']]).map(([value, label]) => <button key={value} className={accountType === value ? 'auth-type-active' : ''} onClick={() => { setAccountType(value); setError(''); }} type="button">{label}</button>)}
          </div>
          {accountType === 'admin' && mode === 'login' && <div className={`auth-setup-notice ${adminEnabled ? 'auth-setup-ready' : ''}`} role="status"><ShieldCheck size={16} /><span><strong>{adminEnabled ? 'Admin access is enabled.' : 'Admin access is not configured.'}</strong>{!adminEnabled && ' Set ADMIN_PASSWORD (12+ characters) in your private .env file, then restart the server.'}</span></div>}
          <form className="auth-form" onSubmit={submitCredentials}>
            {mode === 'register' && <label className="auth-field"><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" minLength={2} maxLength={80} placeholder="Your name" required /></label>}
            {accountType === 'admin' && mode === 'login'
              ? <label className="auth-field"><span>Admin username</span><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="YOUTUBE" required /></label>
              : <label className="auth-field"><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} placeholder="you@example.com" required /></label>}
            <label className="auth-field"><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 12 : undefined} maxLength={128} placeholder={mode === 'register' ? 'At least 12 characters' : 'Enter your password'} required /></label>
            {mode === 'register' && <p className="password-hint"><ShieldCheck size={13} /> Use a unique password with at least 12 characters.</p>}
            {error && <div className="auth-error" role="alert"><CircleHelp size={15} />{error}</div>}
            <button className="auth-submit" type="submit" disabled={pending || (accountType === 'admin' && !adminEnabled)}>{pending ? 'Please wait...' : mode === 'register' ? 'Create account' : accountType === 'admin' ? 'Sign in to admin' : 'Sign in'}<ArrowRight size={17} /></button>
          </form>
          {accountType !== 'admin' && <>
            <div className="auth-divider"><span /> OR CONTINUE WITH <span /></div>
            {googleConfigured ? <div className="google-button-wrap" ref={googleButton} /> : <button className="google-disabled" type="button" disabled><span className="google-g">G</span> Continue with Google</button>}
            {!googleConfigured && <p className="google-note">Google sign-in becomes available when an OAuth client ID is configured.</p>}
          </>}
          <div className="auth-switch">{mode === 'register' ? 'Already have an account?' : 'New to JTD?'} <button onClick={() => changeMode(mode === 'register' ? 'login' : 'register')} type="button">{mode === 'register' ? 'Sign in' : 'Create an account'}</button></div>
          <div className="auth-privacy"><ShieldCheck size={14} /> Your account is protected with encrypted sessions.</div>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [adminEnabled, setAdminEnabled] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [activePage, setActivePage] = useState('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/config')
      .then((response) => response.json())
      .then((config) => {
        if (active) {
          setAdminEnabled(config.adminEnabled);
          setGoogleEnabled(config.googleEnabled);
        }
      })
      .catch(() => {});
    fetch('/api/auth/me')
      .then((response) => response.ok ? response.json() : null)
      .then((result) => { if (active && result?.user) setUser(result.user); })
      .catch(() => {})
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleNavigation = (event) => setActivePage(event.detail);
    window.addEventListener('jtd-navigate', handleNavigation);
    return () => window.removeEventListener('jtd-navigate', handleNavigation);
  }, []);

  const acceptAuthenticatedUser = (authenticatedUser) => {
    setUser(authenticatedUser);
    setActivePage('Overview');
  };

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setActivePage('Overview');
  };

  if (checkingSession) return <main className="auth-loading"><div className="brand-mark"><Construction size={21} /></div><span>Preparing your JTD workspace...</span></main>;
  if (!user) return <AuthScreen onAuthenticated={acceptAuthenticatedUser} adminEnabled={adminEnabled} googleEnabled={googleEnabled} />;

  const role = user.role;
  const title = role === 'customer' ? (activePage === 'Overview' ? 'Your delivery desk' : activePage) : role === 'driver' ? (activePage === 'Overview' ? 'Driver dashboard' : activePage) : (activePage === 'Overview' ? 'Platform overview' : activePage);

  return <div className="app-shell"><Sidebar role={role} user={user} activePage={activePage} setActivePage={setActivePage} open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="app-main"><Topbar role={role} title={title} onMenuClick={() => setSidebarOpen(true)} onLogout={signOut} /><main className="workspace">{role === 'customer' ? <CustomerDashboard activePage={activePage} /> : role === 'driver' ? <DriverDashboard activePage={activePage} /> : <AdminDashboard activePage={activePage} />}</main><footer className="app-footer"><span>© 2025 JTD · Just Tractor Delivery</span><span><ShieldCheck size={13} /> Built for the people who build</span></footer></div></div>;
}

export default App;
