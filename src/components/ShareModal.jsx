import { useState } from 'react';
import { copyToClipboard, getShareURLs } from '../utils/share';

const SHARE_TARGETS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#25D366' },
  { key: 'instagram', label: 'Instagram', icon: '📷', color: '#E4405F' },
  { key: 'facebook', label: 'Facebook', icon: '👤', color: '#1877F2' },
];

export default function ShareModal({ text, onClose, showFeedback }) {
  const [copied, setCopied] = useState(false);
  const urls = getShareURLs(text);

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      showFeedback('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareTarget = (key) => {
    if (key === 'instagram') {
      // Instagram doesn't support direct text share via URL — copy text and notify
      copyToClipboard(text);
      showFeedback('Text copied! Paste in Instagram Story/DM');
      return;
    }
    const url = urls[key];
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 340, padding: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Share Result</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Preview - compact, no scroll */}
        <div style={{
          background: '#0a0b0f',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '10px 12px',
          marginBottom: 14,
          fontSize: 11,
          lineHeight: 1.5,
          color: '#e2e8f0',
          whiteSpace: 'pre-line',
          fontFamily: 'system-ui, sans-serif',
        }}>
          {text}
        </div>

        {/* Share Targets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {SHARE_TARGETS.map(t => (
            <button
              key={t.key}
              onClick={() => handleShareTarget(t.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                padding: '10px 6px', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', color: '#f1f5f9', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.background = `${t.color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            >
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8' }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          style={{
            width: '100%',
            padding: '11px 16px',
            borderRadius: 12,
            border: copied ? '1.5px solid #22c55e' : '1.5px solid rgba(244,63,94,0.4)',
            background: copied ? 'rgba(34,197,94,0.12)' : 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(139,92,246,0.15))',
            color: copied ? '#22c55e' : '#f1f5f9',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
          }}
        >
          {copied ? (
            <><span>✓</span> Copied!</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy to Clipboard</>
          )}
        </button>
      </div>
    </div>
  );
}
