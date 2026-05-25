import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import T from '../constants/theme';
import { getSettings, saveSettings } from '../utils/storage';
import { exportAllData, importAllData } from '../utils/dataValidator';
import { playShatter } from '../utils/audio';
import { KILL_TEXTS } from '../constants/data';
import BackButton from '../components/BackButton';

export default function SettingsPage({ showFeedback }) {
  const [settings, setSettings] = useState(getSettings);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dead, setDead] = useState(false);
  const [shattering, setShattering] = useState(false);
  const fileInputRef = useRef(null);

  const toggleSetting = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveSettings(updated);
    showFeedback(`${key.charAt(0).toUpperCase() + key.slice(1)} ${updated[key] ? 'enabled' : 'disabled'}`);
  };

  // ─── Export/Import Data ────────────────────────────────────
  const handleExport = () => {
    try {
      const data = exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aninoir-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showFeedback('Backup exported! 💾');
    } catch (err) {
      showFeedback('Export failed: ' + err.message);
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        importAllData(data);
        showFeedback('Data restored! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        showFeedback('Import failed: Invalid backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ─── Kill Me ───────────────────────────────────────────────
  const handleKillMe = () => { setShowConfirm(true); };

  const confirmKill = () => {
    setShowConfirm(false);
    setShattering(true);
    playShatter();
    setTimeout(() => { setShattering(false); setDead(true); }, 1500);
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
        <div style={{ fontSize: 64, marginBottom: 20 }} aria-hidden="true">💀</div>
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
            100% { transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 400 + 200}px) rotate(${Math.random() * 720 - 360}deg); opacity: 0; }
          }
        `}</style>
      </div>,
      document.body
    );
  }

  return (
    <section aria-label="Settings" style={{ padding: 16 }}>
      <BackButton />
      <h2 style={{ color: T.text, fontSize: 18, marginBottom: 20 }}>Settings</h2>

      {/* Audio & Haptics */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ color: T.textDim, fontSize: 11, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>
          Audio & Haptics
        </h3>

        {[
          { key: 'sfx', icon: '🔊', label: 'Sound Effects', desc: 'Quiz sounds & feedback' },
          { key: 'music', icon: '🎵', label: 'Music', desc: 'Background music' },
          { key: 'vibration', icon: '📳', label: 'Vibration', desc: 'Haptic feedback' },
        ].map(({ key, icon, label, desc }) => (
          <div key={key} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 16px', borderRadius: 12, marginBottom: 8,
            background: T.card, border: `1px solid ${T.border}`
          }}>
            <div>
              <div style={{ color: T.text, fontSize: 14 }}>{icon} {label}</div>
              <div style={{ color: T.textDim, fontSize: 11, marginTop: 2 }}>{desc}</div>
            </div>
            <button
              onClick={() => toggleSetting(key)}
              role="switch"
              aria-checked={settings[key]}
              aria-label={`${label} ${settings[key] ? 'on' : 'off'}`}
              style={{
                width: 48, height: 26, borderRadius: 13, padding: 2, border: 'none',
                background: settings[key] ? T.teal : T.surface, cursor: 'pointer',
                transition: 'background 0.2s', position: 'relative',
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: '#fff',
                transition: 'transform 0.2s',
                transform: settings[key] ? 'translateX(22px)' : 'translateX(0)',
              }} />
            </button>
          </div>
        ))}
      </div>

      {/* Data Management */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ color: T.textDim, fontSize: 11, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>
          Data & Backup
        </h3>
        <p style={{ color: T.textMid, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
          Export your progress, watchlist, and settings as a backup file. Import to restore on any device.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleExport}>
            💾 Export Data
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleImport}>
            📂 Import Data
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </div>

      {/* Danger Zone */}
      <div>
        <h3 style={{ color: T.textDim, fontSize: 11, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>
          Danger Zone
        </h3>
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
        }} role="dialog" aria-modal="true" aria-label="Confirmation">
          <div style={{
            background: T.card, borderRadius: 16, padding: 24,
            maxWidth: 300, width: '100%', textAlign: 'center',
            border: `1px solid ${T.error}`,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">⚠️</div>
            <h3 style={{ color: T.text, marginBottom: 8 }}>Are you sure?</h3>
            <p style={{ color: T.textMid, fontSize: 13, marginBottom: 20 }}>
              This action cannot be undone... or can it?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowConfirm(false)} className="btn btn-secondary" style={{ flex: 1, padding: '10px 0' }}>
                Cancel
              </button>
              <button
                onClick={confirmKill}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  background: T.error, border: 'none',
                  color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600,
                }}
              >
                Do It 💀
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
