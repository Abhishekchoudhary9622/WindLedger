import { useState } from 'react';

export default function ApiReference() {
  const [copied, setCopied] = useState(false);
  const backendBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const docsUrl = `${backendBase.replace(/\/$/, '')}/docs`;

  const handleCopy = () => {
    navigator.clipboard.writeText(docsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: '0 0 24px 0', minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Banner with quick actions */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '12px 12px 0 0',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: '#ecfdf5',
            color: '#10b981',
            padding: '6px 12px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            API v2.0.0 Live
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>WindLedger API Reference</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Direct endpoint access: {docsUrl}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleCopy}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {copied ? '✓ URL Copied' : '📋 Copy Docs URL'}
          </button>

          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              background: '#3b82f6',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Open Standalone Window ↗
          </a>
        </div>
      </div>

      {/* Embedded High-Resolution API Portal */}
      <div style={{
        flex: 1,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px -2px rgba(15,23,42,0.06)'
      }}>
        <iframe
          src={docsUrl}
          title="WindLedger Enterprise API Reference"
          style={{ width: '100%', height: 'calc(100vh - 180px)', border: 'none' }}
        />
      </div>
    </div>
  );
}
