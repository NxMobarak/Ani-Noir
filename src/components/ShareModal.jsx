import { useState } from 'react';
import { copyToClipboard, getShareURLs } from '../utils/share';

const SHARE_TARGETS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: '\uD83D\uDCAC', color: '#25D366' },
  { key: 'twitter', label: 'X / Twitter', icon: '\uD83D\uDC26', color: '#1DA1F2' },
  { key: 'telegram', label: 'Telegram', icon: '\u2708\uFE0F', color: '#0088cc' },
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
    const url = urls[key];
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 340 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Share Result</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Preview */}
        <div style={{
          background: '#0a0b0f',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          fontSize: 12,
          lineHeight: 1.6,
          color: '#94a3b8',
          whiteSpace: 'pre-line',
          fontFamily: 'monospace',
          maxHeight: 160,
          overflowY: 'auto',
        }}>
          {text}
        </div>

        {/* Share Targets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          {SHARE_TARGETS.map(t => (
            <button
              key={t.key}
              onClick={() => handleShareTarget(t.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '12px 8px', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', color: '#f1f5f9', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.background = `${t.color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            >
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          style={{
            width: '100%',
            padding: '12px 16px',
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
