import { useState } from 'react';
import { copyToClipboard, getShareURLs } from '../utils/share';

const WhatsAppIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80"/>
        <stop offset="25%" stopColor="#F77737"/>
        <stop offset="50%" stopColor="#E1306C"/>
        <stop offset="75%" stopColor="#C13584"/>
        <stop offset="100%" stopColor="#833AB4"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig-grad)" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4.5" stroke="url(#ig-grad)" strokeWidth="2"/>
    <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig-grad)"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const SHARE_TARGETS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: <WhatsAppIcon />, color: '#25D366' },
  { key: 'instagram', label: 'Instagram', icon: <InstagramIcon />, color: '#E4405F' },
  { key: 'facebook', label: 'Facebook', icon: <FacebookIcon />, color: '#1877F2' },
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
              <span style={{ fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.icon}</span>
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
