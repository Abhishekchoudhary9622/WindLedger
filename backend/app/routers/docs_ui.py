"""Custom modern API Reference documentation UI matching the enterprise design."""

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(include_in_schema=False)

DOCS_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Reference — WindLedger Enterprise</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-main: #f8fafc;
      --bg-card: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
      --primary-blue: #3b82f6;
      --primary-blue-hover: #2563eb;
      --emerald: #10b981;
      --emerald-bg: #ecfdf5;
      --emerald-text: #065f46;
      --amber: #f59e0b;
      --amber-bg: #fffbeb;
      --amber-text: #92400e;
      --rose: #ef4444;
      --rose-bg: #fef2f2;
      --rose-text: #991b1b;
      --code-bg: #0b132b;
      --code-border: #1e293b;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
      --shadow-md: 0 4px 16px -2px rgba(15,23,42,0.06);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-main);
      color: var(--text-main);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    /* Top Banner / Navbar */
    .top-nav {
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      padding: 12px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--text-main);
    }
    .brand-badge {
      background: var(--emerald-bg);
      color: var(--emerald);
      padding: 6px 10px;
      border-radius: var(--radius-md);
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #334155;
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      border: 1px solid #cbd5e1;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-secondary:hover { background: #e2e8f0; color: #0f172a; }

    /* Page Layout Container */
    .container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 36px 32px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: 32px;
      align-items: start;
    }

    /* Left Content Column */
    .content-col {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .page-header h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: var(--text-main);
      margin-bottom: 6px;
    }
    .page-header p {
      font-size: 15px;
      color: var(--text-muted);
      max-width: 760px;
    }

    /* API Section Cards */
    .api-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      transition: border-color 0.2s ease;
    }
    .api-card-header {
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
      background: #ffffff;
      transition: background 0.15s ease;
    }
    .api-card-header:hover { background: #fafafa; }
    .api-title-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .api-icon-box {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eff6ff;
      color: var(--primary-blue);
      font-size: 20px;
    }
    .api-card-header h2 {
      font-size: 17px;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    .api-card-header h2 span {
      font-size: 13px;
      font-weight: 400;
      color: var(--text-muted);
    }
    .chevron-icon {
      width: 20px;
      height: 20px;
      color: #94a3b8;
      transition: transform 0.2s ease;
    }
    .api-card.open .chevron-icon {
      transform: rotate(180deg);
    }
    .api-card-body {
      display: none;
      border-top: 1px solid var(--border-color);
      padding: 24px;
      background: #fafbfc;
    }
    .api-card.open .api-card-body {
      display: block;
    }

    /* Endpoint Accordion */
    .endpoint-block {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      margin-bottom: 20px;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .endpoint-block:last-child { margin-bottom: 0; }
    .endpoint-summary-bar {
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      background: #ffffff;
    }
    .endpoint-summary-bar:hover { background: #f8fafc; }
    .endpoint-tag-path {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .method-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .method-get { background: var(--primary-blue); color: #ffffff; }
    .method-post { background: var(--emerald); color: #ffffff; }

    .path-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-main);
    }
    .endpoint-desc-short {
      font-size: 13px;
      color: var(--text-muted);
      margin-left: 8px;
    }
    .endpoint-detail-pane {
      display: block;
      border-top: 1px solid #f1f5f9;
      padding: 20px 24px;
      background: #ffffff;
    }

    .endpoint-full-desc {
      font-size: 14px;
      color: #475569;
      margin-bottom: 20px;
      line-height: 1.6;
    }

    /* Subheadings */
    .section-subtitle {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Query Parameters Table */
    .params-table-wrap {
      overflow-x: auto;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      margin-bottom: 24px;
    }
    .params-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    .params-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border-color);
    }
    .params-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .params-table tr:last-child td { border-bottom: none; }
    .param-name {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      color: var(--text-main);
    }
    .param-type {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #64748b;
    }
    .badge-req-yes {
      background: #ecfdf5;
      color: #059669;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-block;
    }
    .badge-req-no {
      background: #f1f5f9;
      color: #64748b;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-block;
    }
    .param-example {
      font-family: 'JetBrains Mono', monospace;
      background: #f8fafc;
      padding: 2px 6px;
      border-radius: 4px;
      color: #0f172a;
      border: 1px solid #e2e8f0;
    }

    /* Response Example Box */
    .response-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .status-tabs {
      display: flex;
      gap: 8px;
    }
    .status-tab {
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }
    .status-tab.active-200 {
      background: var(--emerald-bg);
      color: var(--emerald-text);
      border-color: #a7f3d0;
    }
    .status-tab.inactive {
      background: #f1f5f9;
      color: var(--text-muted);
    }
    .response-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-copy-code {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      padding: 5px 10px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .btn-copy-code:hover { background: #e2e8f0; color: #0f172a; }

    /* Code Blocks */
    .code-container {
      background: var(--code-bg);
      border-radius: var(--radius-md);
      padding: 16px;
      overflow-x: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #f8fafc;
      box-shadow: inset 0 2px 6px rgba(0,0,0,0.25);
    }
    .code-line {
      display: flex;
    }
    .line-num {
      width: 32px;
      color: #475569;
      user-select: none;
      text-align: right;
      padding-right: 14px;
    }
    .code-content { flex: 1; }
    .k { color: #38bdf8; }   /* Key */
    .s { color: #34d399; }   /* String */
    .n { color: #fbbf24; }   /* Number */
    .b { color: #f472b6; }   /* Boolean */
    .p { color: #94a3b8; }   /* Punctuation */

    /* Live Interactive Console Box */
    .live-tester {
      margin-top: 16px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: var(--radius-md);
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .live-btn {
      background: var(--primary-blue);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s ease;
    }
    .live-btn:hover { background: var(--primary-blue-hover); }
    .live-status-pill {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
    }

    /* Right Sidebar */
    .sidebar-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
      position: sticky;
      top: 80px;
    }
    .side-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: var(--shadow-sm);
    }
    .side-card h3 {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* API Status Card */
    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .operational-pill {
      background: var(--emerald-bg);
      color: var(--emerald-text);
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 14px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .dot-pulse {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--emerald);
      box-shadow: 0 0 0 2px rgba(16,185,129,0.25);
    }
    .uptime-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }
    .status-sub {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 12px;
    }
    /* Animated mini sparkline */
    .sparkline-row {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 24px;
      padding-top: 4px;
    }
    .spark-bar {
      flex: 1;
      background: #10b981;
      border-radius: 2px;
      opacity: 0.85;
      transition: height 0.3s ease;
    }
    .spark-bar:hover { opacity: 1; background: #059669; }

    /* Base URL Card */
    .base-url-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--text-main);
    }
    .btn-icon-copy {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 4px;
    }
    .btn-icon-copy:hover { color: var(--text-main); background: #e2e8f0; }

    /* Quick Start Card */
    .lang-tabs {
      display: flex;
      gap: 6px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
    }
    .lang-tab {
      background: transparent;
      border: none;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .lang-tab.active {
      background: #ecfdf5;
      color: #059669;
    }
    .snippet-box {
      background: var(--code-bg);
      border-radius: var(--radius-md);
      padding: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      line-height: 1.5;
      color: #f8fafc;
      position: relative;
    }
    .snippet-copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(255,255,255,0.1);
      border: none;
      color: #94a3b8;
      border-radius: 4px;
      padding: 4px;
      cursor: pointer;
    }
    .snippet-copy-btn:hover { background: rgba(255,255,255,0.2); color: #fff; }

    /* Response Codes */
    .resp-code-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .resp-code-row:last-child { border-bottom: none; }
    .resp-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      width: 44px;
      text-align: center;
    }
    .resp-200 { background: #d1fae5; color: #065f46; }
    .resp-401 { background: #fef3c7; color: #92400e; }
    .resp-422 { background: #fee2e2; color: #991b1b; }
    .resp-desc-wrap h4 {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-main);
    }
    .resp-desc-wrap p {
      font-size: 11px;
      color: var(--text-muted);
    }

    /* Related Links */
    .links-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .links-list a {
      font-size: 13px;
      font-weight: 500;
      color: var(--primary-blue);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .links-list a:hover { text-decoration: underline; }

    /* Toast notification */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      color: #fff;
      padding: 10px 18px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 600;
      box-shadow: var(--shadow-md);
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.2s ease;
      pointer-events: none;
      z-index: 999;
    }
    .toast.show { opacity: 1; transform: translateY(0); }

    @media (max-width: 1024px) {
      .container { grid-template-columns: 1fr; }
      .sidebar-col { position: static; }
    }
  </style>
</head>
<body>

  <!-- Top Navigation Bar -->
  <header class="top-nav">
    <a href="/" class="brand-wrap">
      <div class="brand-badge">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        WindLedger
      </div>
      <span style="font-weight: 700; font-size: 15px; color: #1e293b;">Enterprise API</span>
    </a>
    <div class="nav-actions">
      <a href="http://localhost:5173" class="btn-secondary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        Web Portal
      </a>
      <a href="/swagger" class="btn-secondary" title="View standard Swagger UI">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Classic Swagger
      </a>
    </div>
  </header>

  <!-- Main Container -->
  <main class="container">
    
    <!-- Left Column: API Reference Documentation -->
    <div class="content-col">
      <div class="page-header">
        <h1>API Reference</h1>
        <p>Explore all available endpoints for wind power forecasting, accuracy evaluation, trading decision support and market analytics.</p>
      </div>

      <!-- 1. Forecast API -->
      <section class="api-card open">
        <div class="api-card-header" onclick="toggleCard(this)">
          <div class="api-title-wrap">
            <div class="api-icon-box">📈</div>
            <div>
              <h2>Forecast API <span>Day-Ahead Decision & Evolution Engine</span></h2>
            </div>
          </div>
          <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="api-card-body">
          
          <!-- Endpoint: GET /api/decision -->
          <div class="endpoint-block">
            <div class="endpoint-summary-bar">
              <div class="endpoint-tag-path">
                <span class="method-badge method-get">GET</span>
                <span class="path-label">/api/decision</span>
                <span class="endpoint-desc-short">Decision Forecast — Retrieve day-ahead point forecasts and uncertainty bands.</span>
              </div>
            </div>
            <div class="endpoint-detail-pane">
              <p class="endpoint-full-desc">
                Retrieves day-ahead wind generation forecasts with P10/P90 uncertainty bands, conservative bidding baselines, and delivery metrics strictly respecting the day-ahead gate closure cutoff time on Day D-1.
              </p>

              <!-- Query Parameters -->
              <div class="section-subtitle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="m12 8 4 4-4 4M8 12h8"/></svg>
                Query Parameters
              </div>
              <div class="params-table-wrap">
                <table class="params-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Required</th>
                      <th>Description</th>
                      <th>Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="param-name">date</td>
                      <td class="param-type">string</td>
                      <td><span class="badge-req-yes">Yes</span></td>
                      <td>Delivery target date (YYYY-MM-DD) in January 2026</td>
                      <td><span class="param-example">2026-01-14</span></td>
                    </tr>
                    <tr>
                      <td class="param-name">cutoff</td>
                      <td class="param-type">string</td>
                      <td><span class="badge-req-no">No</span></td>
                      <td>Decision cutoff on D-1: <code>09:20</code> (EPEX SPOT), <code>09:50</code> (Nord Pool gate closure), or <code>10:00</code> (Nord Pool results benchmark)</td>
                      <td><span class="param-example">09:20</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Response Example -->
              <div class="section-subtitle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Response Example
              </div>
              <div class="response-header">
                <div class="status-tabs">
                  <span class="status-tab active-200">200 Success</span>
                  <span class="status-tab inactive">401 Unauthorized</span>
                  <span class="status-tab inactive">422 Validation Error</span>
                </div>
                <div class="response-actions">
                  <button class="btn-copy-code" onclick="copySnippet('resp-decision')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy
                  </button>
                </div>
              </div>

              <div class="code-container" id="resp-decision">
                <div class="code-line"><span class="line-num">1</span><span class="code-content"><span class="p">{</span></span></div>
                <div class="code-line"><span class="line-num">2</span><span class="code-content">  <span class="k">"deliveryDate"</span><span class="p">:</span> <span class="s">"2026-01-14"</span><span class="p">,</span></span></div>
                <div class="code-line"><span class="line-num">3</span><span class="code-content">  <span class="k">"cutoff"</span><span class="p">:</span> <span class="s">"09:20"</span><span class="p">,</span></span></div>
                <div class="code-line"><span class="line-num">4</span><span class="code-content">  <span class="k">"points"</span><span class="p">:</span> <span class="p">[</span></span></div>
                <div class="code-line"><span class="line-num">5</span><span class="code-content">    <span class="p">{</span></span></div>
                <div class="code-line"><span class="line-num">6</span><span class="code-content">      <span class="k">"startTime"</span><span class="p">:</span> <span class="s">"2026-01-14T00:00:00Z"</span><span class="p">,</span></span></div>
                <div class="code-line"><span class="line-num">7</span><span class="code-content">      <span class="k">"forecastMW"</span><span class="p">:</span> <span class="n">6821</span><span class="p">,</span></span></div>
                <div class="code-line"><span class="line-num">8</span><span class="code-content">      <span class="k">"actualMW"</span><span class="p">:</span> <span class="n">7114</span><span class="p">,</span></span></div>
                <div class="code-line"><span class="line-num">9</span><span class="code-content">      <span class="k">"bandP10"</span><span class="p">:</span> <span class="n">5540</span><span class="p">,</span></span></div>
                <div class="code-line"><span class="line-num">10</span><span class="code-content">      <span class="k">"bandP90"</span><span class="p">:</span> <span class="n">8230</span><span class="p">,</span></span></div>
                <div class="code-line"><span class="line-num">11</span><span class="code-content">      <span class="k">"conservativeMW"</span><span class="p">:</span> <span class="n">6120</span></span></div>
                <div class="code-line"><span class="line-num">12</span><span class="code-content">    <span class="p">}</span></span></div>
                <div class="code-line"><span class="line-num">13</span><span class="code-content">  <span class="p">],</span></span></div>
                <div class="code-line"><span class="line-num">14</span><span class="code-content">  <span class="k">"summary"</span><span class="p">:</span> <span class="p">{</span></span></div>
                <div class="code-line"><span class="line-num">15</span><span class="code-content">    <span class="k">"meanMW"</span><span class="p">:</span> <span class="n">6864</span><span class="p">,</span> <span class="k">"totalMWh"</span><span class="p">:</span> <span class="n">164736</span><span class="p">,</span> <span class="k">"peakMW"</span><span class="p">:</span> <span class="n">8840</span><span class="p">,</span> <span class="k">"troughMW"</span><span class="p">:</span> <span class="n">4210</span></span></div>
                <div class="code-line"><span class="line-num">16</span><span class="code-content">  <span class="p">}</span></span></div>
                <div class="code-line"><span class="line-num">17</span><span class="code-content"><span class="p">}</span></span></div>
              </div>

              <!-- Live Interactive Test Trigger -->
              <div class="live-tester">
                <span class="live-status-pill">Interactive Live Request</span>
                <button class="live-btn" onclick="executeLiveQuery('/api/decision?date=2026-01-14&cutoff=09:20', 'live-out-decision')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Execute Query
                </button>
              </div>
              <div id="live-out-decision" style="display:none; margin-top:12px;" class="code-container"></div>

            </div>
          </div>

          <!-- Endpoint: GET /api/evolution -->
          <div class="endpoint-block">
            <div class="endpoint-summary-bar">
              <div class="endpoint-tag-path">
                <span class="method-badge method-get">GET</span>
                <span class="path-label">/api/evolution</span>
                <span class="endpoint-desc-short">Forecast Evolution — Multi-vintage forecast trajectory tracking across lead times.</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- 2. Accuracy API -->
      <section class="api-card open">
        <div class="api-card-header" onclick="toggleCard(this)">
          <div class="api-title-wrap">
            <div class="api-icon-box">🎯</div>
            <div>
              <h2>Accuracy API <span>Forecast Error & Statistical Benchmarking</span></h2>
            </div>
          </div>
          <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="api-card-body">
          <div class="endpoint-block">
            <div class="endpoint-summary-bar">
              <div class="endpoint-tag-path">
                <span class="method-badge method-get">GET</span>
                <span class="path-label">/api/accuracy/summary</span>
                <span class="endpoint-desc-short">KPI Summary — MAE, RMSE, Bias, and normalized percentage errors.</span>
              </div>
            </div>
          </div>
          <div class="endpoint-block">
            <div class="endpoint-summary-bar">
              <div class="endpoint-tag-path">
                <span class="method-badge method-get">GET</span>
                <span class="path-label">/api/accuracy/horizon</span>
                <span class="endpoint-desc-short">Horizon Decay — Error progression from 14h to 38h lead times.</span>
              </div>
            </div>
          </div>
          <div class="endpoint-block">
            <div class="endpoint-summary-bar">
              <div class="endpoint-tag-path">
                <span class="method-badge method-get">GET</span>
                <span class="path-label">/api/accuracy/heatmap</span>
                <span class="endpoint-desc-short">Accuracy Heatmap — 31x24 grid of hourly mean absolute errors.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Trading API -->
      <section class="api-card open">
        <div class="api-card-header" onclick="toggleCard(this)">
          <div class="api-title-wrap">
            <div class="api-icon-box">🪙</div>
            <div>
              <h2>Trading API <span>Financial Imbalance & Bidding Strategies</span></h2>
            </div>
          </div>
          <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="api-card-body">
          <div class="endpoint-block">
            <div class="endpoint-summary-bar">
              <div class="endpoint-tag-path">
                <span class="method-badge method-get">GET</span>
                <span class="path-label">/api/trading/imbalance-risk</span>
                <span class="endpoint-desc-short">Cashout Exposure — Physical short/long volumes and SBP/SSP balancing penalties.</span>
              </div>
            </div>
          </div>
          <div class="endpoint-block">
            <div class="endpoint-summary-bar">
              <div class="endpoint-tag-path">
                <span class="method-badge method-get">GET</span>
                <span class="path-label">/api/trading/bid-recommendation</span>
                <span class="endpoint-desc-short">Bidding Strategy — Optimal 24h auction schedules (Conservative vs Aggressive).</span>
              </div>
            </div>
          </div>
          <div class="endpoint-block">
            <div class="endpoint-summary-bar">
              <div class="endpoint-tag-path">
                <span class="method-badge method-post">POST</span>
                <span class="path-label">/api/trading/simulate</span>
                <span class="endpoint-desc-short">Stress-Test Simulator — Test forecast degradation and cashout spread shifts.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Ramps & Volatility API -->
      <section class="api-card open">
        <div class="api-card-header" onclick="toggleCard(this)">
          <div class="api-title-wrap">
            <div class="api-icon-box">🌪️</div>
            <div>
              <h2>Ramps API <span>Wind Ramp Events & Rapid Swing Analytics</span></h2>
            </div>
          </div>
          <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="api-card-body">
          <div class="endpoint-block">
            <div class="endpoint-summary-bar">
              <div class="endpoint-tag-path">
                <span class="method-badge method-get">GET</span>
                <span class="path-label">/api/ramps/events</span>
                <span class="endpoint-desc-short">Ramp Events — Detect steep generation swings (>800 MW) and forecast tracking rate.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 5. Data & System APIs -->
      <section class="api-card open">
        <div class="api-card-header" onclick="toggleCard(this)">
          <div class="api-title-wrap">
            <div class="api-icon-box">⚡</div>
            <div>
              <h2>Operations & Data API <span>Parquet Store, CSV Streaming & Observability</span></h2>
            </div>
          </div>
          <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="api-card-body">
          <div class="endpoint-block">
            <div class="endpoint-summary-bar">
              <div class="endpoint-tag-path">
                <span class="method-badge method-get">GET</span>
                <span class="path-label">/api/data/summary</span>
                <span class="endpoint-desc-short">Elexon Parquet Store — Record counts, disk size, and value ranges.</span>
              </div>
            </div>
          </div>
          <div class="endpoint-block">
            <div class="endpoint-summary-bar">
              <div class="endpoint-tag-path">
                <span class="method-badge method-get">GET</span>
                <span class="path-label">/api/data/export/csv</span>
                <span class="endpoint-desc-short">Direct CSV Export — Stream joined decisions and actuals for January 2026.</span>
              </div>
            </div>
          </div>
          <div class="endpoint-block">
            <div class="endpoint-summary-bar">
              <div class="endpoint-tag-path">
                <span class="method-badge method-get">GET</span>
                <span class="path-label">/api/system/health</span>
                <span class="endpoint-desc-short">System Health — Process uptime, memory footprint, and cache statistics.</span>
              </div>
            </div>
          </div>
          <div class="endpoint-block">
            <div class="endpoint-summary-bar">
              <div class="endpoint-tag-path">
                <span class="method-badge method-get">GET</span>
                <span class="path-label">/api/system/benchmarks</span>
                <span class="endpoint-desc-short">Live Benchmarks — Real-time sub-millisecond compute latency verification.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>

    <!-- Right Column: Sidebar (Status, Base URL, Quick Start, Codes, Links) -->
    <aside class="sidebar-col">
      
      <!-- API Status Card -->
      <div class="side-card">
        <div class="status-row">
          <div class="operational-pill">
            <span class="dot-pulse"></span>
            Operational
          </div>
          <span class="uptime-label">Engine <strong>FastAPI</strong></span>
        </div>
        <div class="status-sub">In-memory columnar Parquet data engine active.</div>
      </div>

      <!-- Base URL Card -->
      <div class="side-card">
        <h3>Base URL</h3>
        <div class="base-url-box">
          <span id="base-url-val">/</span>
          <button class="btn-icon-copy" id="btn-copy-base" onclick="copyCurrentBaseUrl()" title="Copy Base URL">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      </div>

      <!-- Quick Start Card -->
      <div class="side-card">
        <h3>⚡ Quick Start</h3>
        <div class="lang-tabs">
          <button class="lang-tab active" onclick="switchSnippet('python', this)">Python</button>
          <button class="lang-tab" onclick="switchSnippet('curl', this)">cURL</button>
          <button class="lang-tab" onclick="switchSnippet('javascript', this)">JavaScript</button>
        </div>

        <div class="snippet-box">
          <button class="snippet-copy-btn" onclick="copySnippet('active-snippet')" title="Copy snippet">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <pre id="active-snippet" style="margin:0; overflow-x:auto;"><code># pip install requests
import requests

BASE_URL = "http://127.0.0.1:8000"
params = {
    "date": "2026-01-14",
    "cutoff": "09:20"
}
res = requests.get(
    f"{BASE_URL}/api/decision", 
    params=params
)
print(res.json())</code></pre>
        </div>
      </div>

      <!-- Response Codes Card -->
      <div class="side-card">
        <h3>🗄️ Response Codes</h3>
        <div class="resp-code-row">
          <span class="resp-badge resp-200">200</span>
          <div class="resp-desc-wrap">
            <h4>Success</h4>
            <p>Request completed successfully.</p>
          </div>
        </div>
        <div class="resp-code-row">
          <span class="resp-badge resp-401">401</span>
          <div class="resp-desc-wrap">
            <h4>Unauthorized</h4>
            <p>Invalid or missing API key.</p>
          </div>
        </div>
        <div class="resp-code-row">
          <span class="resp-badge resp-422">422</span>
          <div class="resp-desc-wrap">
            <h4>Validation Error</h4>
            <p>Invalid request parameters.</p>
          </div>
        </div>
      </div>

      <!-- Related Links Card -->
      <div class="side-card">
        <h3>🔗 Related Links</h3>
        <ul class="links-list">
          <li><a href="/swagger" target="_blank">📑 Classic Swagger UI (/swagger)</a></li>
          <li><a href="/redoc" target="_blank">📖 ReDoc Specification (/redoc)</a></li>
          <li><a href="/openapi.json" target="_blank">📦 OpenAPI 3.1 JSON Schema</a></li>
          <li><a href="https://bmrs.elexon.co.uk/api-documentation" target="_blank">⚡ Elexon BMRS Official API</a></li>
        </ul>
      </div>

    </aside>

  </main>

  <!-- Notification Toast -->
  <div class="toast" id="toast">Copied to clipboard!</div>

  <script>
    // Toggle accordion categories
    function toggleCard(header) {
      const card = header.closest('.api-card');
      card.classList.toggle('open');
    }

    const origin = window.location.origin;
    const baseBox = document.getElementById('base-url-val');
    if (baseBox) baseBox.innerText = origin;

    function copyCurrentBaseUrl() {
      copyText(window.location.origin);
    }

    // Switch Quick Start code snippets
    const snippets = {
      python: `# pip install requests
import requests

BASE_URL = "${window.location.origin}"
params = {
    "date": "2026-01-14",
    "cutoff": "09:20"
}
res = requests.get(
    f"{BASE_URL}/api/decision", 
    params=params
)
print(res.json())`,
      curl: `curl -X GET "${window.location.origin}/api/decision?date=2026-01-14&cutoff=09:20" \\
  -H "Accept: application/json"`,
      javascript: `const BASE_URL = "${window.location.origin}";
const res = await fetch(\`\${BASE_URL}/api/decision?date=2026-01-14&cutoff=09:20\`);
const data = await res.json();
console.log(data);`
    };

    function switchSnippet(lang, btn) {
      document.querySelectorAll('.lang-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('active-snippet').innerText = snippets[lang];
    }

    // Toast notification
    function showToast(msg) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2000);
    }

    function copyText(txt) {
      navigator.clipboard.writeText(txt).then(() => showToast('Copied to clipboard!'));
    }

    function copySnippet(id) {
      const el = document.getElementById(id);
      if (el) {
        copyText(el.innerText);
      }
    }

    // Execute live query from documentation
    async function executeLiveQuery(url, targetId) {
      const out = document.getElementById(targetId);
      out.style.display = 'block';
      out.innerHTML = '<span style="color:#38bdf8;">Executing live request to ' + url + '...</span>';
      const t0 = performance.now();
      try {
        const res = await fetch(url);
        const data = await res.json();
        const duration = Math.round(performance.now() - t0);
        out.innerHTML = '<div style="color:#10b981; margin-bottom:8px; font-weight:600;">HTTP ' + res.status + ' OK (' + duration + ' ms latency):</div>' +
          '<pre style="margin:0; overflow-x:auto;">' + JSON.stringify(data, null, 2) + '</pre>';
      } catch (err) {
        out.innerHTML = '<div style="color:#ef4444;">Error executing request: ' + err.message + '</div>';
      }
    }
  </script>
</body>
</html>
"""


@router.get("/docs", response_class=HTMLResponse)
async def custom_docs():
    """Serve custom modern API Reference documentation portal."""
    return HTMLResponse(content=DOCS_HTML)
