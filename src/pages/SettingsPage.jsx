import { useState } from 'react';
import { createPortal } from 'react-dom';
import T from '../constants/theme';
import { getSettings, saveSettings } from '../utils/storage';
import { playShatter } from '../utils/audio';
import { KILL_TEXTS } from '../constants/data';

export default function SettingsPage({ showFeedback }) {
  const [settings, setSettings] = useState(getSettings);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dead, setDead] = useState(false);
  const [shattering, setShattering] = useState(false);

  const toggleSetting = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveSettings(updated);
    showFeedback(`${key.charAt(0).toUpperCase() + key.slice(1)} ${updated[key] ? 'enabled' : 'disabled'}`, 'success');
  };

  const handleKillMe = () => {
    setShowConfirm(true);
  };

  const confirmKill = () => {
    setShowConfirm(false);
    setShattering(true);
    playShatter();

    setTimeout(() => {
      setShattering(false);
      setDead(true);
    }, 1500);
  };

  const killText = KILL_TEXTS[Math.floor(Math.random() * KILL_TEXTS.length)];

  // ─── Dead screen (portal) ─────────────────────────────────
  if (dead) {
    return createPortal(
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: '#000', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 30,
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>💀</div>
        <p style={{
          color: T.textMid, fontSize: 15, textAlign: 'center',
          lineHeight: 1.7, maxWidth: 300, fontStyle: 'italic',
        }}>
          {killText}
        </p>
        <button
          onClick={() => setDead(false)}
          style={{
            marginTop: 30, padding: '12px 24px', borderRadius: 10,
            background: T.card, border: `1px solid ${T.border}`,
            color: T.textMid, fontSize: 13, cursor: 'pointer',
          }}
        >
          Resurrect 🔄
        </button>
      </div>,
      document.body
    );
  }

  // ─── Shatter animation (portal) ───────────────────────────
  if (shattering) {
    return createPortal(
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: '#000', display: 'flex', alignItems: 'center',
        justifyContent: 'center', overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(12, 1fr)',
          width: '100%', height: '100%', gap: 2,
        }}>
          {Array.from({ length: 96 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                animation: `shatter-piece 1.5s ease-out forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
                opacity: 1,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes shatter-piece {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            100% {
              transform: translate(${() => ''}var(--tx, ${Math.random() * 200 - 100}px), var(--ty, ${Math.random() * 400 + 200}px)) rotate(${Math.random() * 720 - 360}deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>,
      document.body
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: T.text, fontSize: 18, marginBottom: 20 }}>Settings</h2>

      {/* Audio & Haptics */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: T.textDim, fontSize: 11, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>
          Audio & Haptics
        </div>

        {/* SFX Toggle */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px', borderRadius: 12, marginBottom: 8,
          background: T.card, border: `1px solid ${T.border}`
        }}>
          <div>
            <div style={{ color: T.text, fontSize: 14 }}>🔊 Sound Effects</div>
            <div style={{ color: T.textDim, fontSize: 11, marginTop: 2 }}>Quiz sounds & feedback</div>
          </div>
          <button
            onClick={() => toggleSetting('sfx')}
            style={{
              width: 48, height: 26, borderRadius: 13, padding: 2, border: 'none',
              background: settings.sfx ? T.teal : T.surface, cursor: 'pointer',
              transition: 'background 0.2s', position: 'relative',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: '#fff',
              transition: 'transform 0.2s',
              transform: settings.sfx ? 'translateX(22px)' : 'translateX(0)',
            }} />
          </button>
        </div>

        {/* Music Toggle */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px', borderRadius: 12, marginBottom: 8,
          background: T.card, border: `1px solid ${T.border}`
        }}>
          <div>
            <div style={{ color: T.text, fontSize: 14 }}>🎵 Music</div>
            <div style={{ color: T.textDim, fontSize: 11, marginTop: 2 }}>Background music</div>
          </div>
          <button
            onClick={() => toggleSetting('music')}
            style={{
              width: 48, height: 26, borderRadius: 13, padding: 2, border: 'none',
              background: settings.music ? T.teal : T.surface, cursor: 'pointer',
              transition: 'background 0.2s', position: 'relative',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: '#fff',
              transition: 'transform 0.2s',
              transform: settings.music ? 'translateX(22px)' : 'translateX(0)',
            }} />
          </button>
        </div>

        {/* Vibration Toggle */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px', borderRadius: 12,
          background: T.card, border: `1px solid ${T.border}`
        }}>
          <div>
            <div style={{ color: T.text, fontSize: 14 }}>📳 Vibration</div>
            <div style={{ color: T.textDim, fontSize: 11, marginTop: 2 }}>Haptic feedback</div>
          </div>
          <button
            onClick={() => toggleSetting('vibration')}
            style={{
              width: 48, height: 26, borderRadius: 13, padding: 2, border: 'none',
              background: settings.vibration ? T.teal : T.surface, cursor: 'pointer',
              transition: 'background 0.2s', position: 'relative',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: '#fff',
              transition: 'transform 0.2s',
              transform: settings.vibration ? 'translateX(22px)' : 'translateX(0)',
            }} />
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div>
        <div style={{ color: T.textDim, fontSize: 11, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>
          Danger Zone
        </div>
        <button
          onClick={handleKillMe}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 12,
            background: 'rgba(244,63,94,0.08)', border: `1px solid ${T.error}`,
            color: T.error, fontSize: 14, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          💀 Kill Me
        </button>
      </div>

      {/* Confirm Modal */}
      {showConfirm && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.8)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: T.card, borderRadius: 16, padding: 24,
            maxWidth: 300, width: '100%', textAlign: 'center',
            border: `1px solid ${T.error}`,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ color: T.text, marginBottom: 8 }}>Are you sure?</h3>
            <p style={{ color: T.textMid, fontSize: 13, marginBottom: 20 }}>
              This action cannot be undone... or can it?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowConfirm(false)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px 0' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmKill}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  background: T.error, border: 'none',
                  color: '#fff', fontSize: 14, cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Do It 💀
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
