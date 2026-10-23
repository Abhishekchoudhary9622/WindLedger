import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ForecastExplorer from './pages/ForecastExplorer';
import Analytics from './pages/Analytics';
import DataExplorer from './pages/DataExplorer';
import Settings from './pages/Settings';
import ApiReference from './pages/ApiReference';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 2 } },
});

/* ── Wind Turbine Logo Icon ────────────────────────────────────────────── */
function WindTurbineBrandLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
      <path d="M12 12c0-3.5 2.2-7 2.2-10-2.5 0-4.5 3.5-4.5 7 0 1.2.6 2.4 2.3 3z" fill="#10B981" fillOpacity="0.2" />
      <path d="M12 12c3 1.8 6.5 2.8 10 2.8 0-2.5-3.5-4.5-7-4.5-1.2 0-2.4.6-3 1.7z" fill="#10B981" fillOpacity="0.2" />
      <path d="M12 12c-.6 3.4-1.8 6.8-4 9.5-.7-2.3-.5-5.5 1.5-8.5.6-1 1.6-1.3 2.5-1z" fill="#10B981" fillOpacity="0.2" />
      <circle cx="12" cy="12" r="2" fill="#059669" />
      <path d="M12 14v8" stroke="#059669" strokeWidth="2" />
    </svg>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="app-container">
          {/* ── Top Navbar ────────────────────────────────────────────── */}
          <header className="top-navbar">
            {/* Left: Brand Identity */}
            <NavLink to="/" className="brand-section">
              <div className="brand-logo-icon">
                <WindTurbineBrandLogo />
              </div>
              <div>
                <div className="brand-name">WindLedger</div>
                <div className="brand-tagline">UK Wind Forecast & Market Analytics</div>
              </div>
            </NavLink>

            {/* Center: Pill Segmented Navigation */}
            <nav>
              <ul className="nav-pill-group">
                <li>
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) => `nav-pill-link ${isActive ? 'active' : ''}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/forecast-explorer"
                    className={({ isActive }) => `nav-pill-link ${isActive ? 'active' : ''}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    Forecast Explorer
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/analytics"
                    className={({ isActive }) => `nav-pill-link ${isActive ? 'active' : ''}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    Analytics
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/data-explorer"
                    className={({ isActive }) => `nav-pill-link ${isActive ? 'active' : ''}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    </svg>
                    Data Explorer
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) => `nav-pill-link ${isActive ? 'active' : ''}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Settings
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/api-reference"
                    className={({ isActive }) => `nav-pill-link ${isActive ? 'active' : ''}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                    API Docs
                  </NavLink>
                </li>
              </ul>
            </nav>

            {/* Right: User & Actions */}
            <div className="header-actions">
              <button className="icon-btn" title="Search platform" aria-label="Search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              <button className="icon-btn" title="Notifications" aria-label="Notifications">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="badge-dot" />
              </button>

              <div className="user-profile-btn">
                <span className="user-avatar-circle">T</span>
                <span>Trading Team</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </header>

          {/* ── Main Page Content ──────────────────────────────────────── */}
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/forecast-explorer" element={<ForecastExplorer />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/data-explorer" element={<DataExplorer />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/api-reference" element={<ApiReference />} />
              <Route path="/docs" element={<ApiReference />} />
              {/* Backward compatibility redirects */}
              <Route path="/decision" element={<Dashboard />} />
              <Route path="/accuracy" element={<Analytics />} />
              <Route path="/evolution" element={<ForecastExplorer />} />
              <Route path="/methodology" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
