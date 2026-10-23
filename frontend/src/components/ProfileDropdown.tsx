import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileDropdown({ isOpen, onClose }: ProfileDropdownProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: '0',
        width: '280px',
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 12px 36px -4px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        zIndex: 9999,
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      {/* Header Profile Info */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#f8fafc'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: '#059669',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '15px'
        }}>
          T
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Trading Desk Team</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>GB Power Utilities — London</div>
        </div>
      </div>

      {/* Desk Status Details */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
          <span style={{ color: '#64748b' }}>Active Gate Closure:</span>
          <span style={{ fontWeight: 700, color: '#059669' }}>09:20 EPEX SPOT</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
          <span style={{ color: '#64748b' }}>Data Source:</span>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Elexon BMRS Stream</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#64748b' }}>Evaluation Period:</span>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>January 2026 (744h)</span>
        </div>
      </div>

      {/* Quick Menu Options */}
      <div style={{ padding: '6px' }}>
        <button
          onClick={() => { onClose(); navigate('/settings'); }}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: '#334155',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          ⚙️ Market Cutoff Settings
        </button>

        <button
          onClick={() => { onClose(); navigate('/api-reference'); }}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: '#334155',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          📖 Developer API Reference
        </button>

        <button
          onClick={() => { onClose(); navigate('/data-explorer'); }}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: '#334155',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          📊 Export January 2026 CSV
        </button>
      </div>

      {/* Sign Out Simulation */}
      <div style={{ padding: '6px', borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={() => { onClose(); alert('Trading Desk session active. Refresh anytime to re-sync.'); }}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: '#dc2626',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fee2e2')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          ↻ Re-sync Trading Session
        </button>
      </div>
    </div>
  );
}
