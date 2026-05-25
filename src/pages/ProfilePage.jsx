import { useState } from 'react';
import T from '../constants/theme';
import BackButton from '../components/BackButton';

const PROFILE_NAME_KEY = 'ani_profile_name';
const PROFILE_AVATAR_KEY = 'ani_profile_avatar';
const CONNECT_KEY = 'ani_connected_accounts';

const AVATARS = [
  { id: 'naruto', emoji: '🍥', label: 'Naruto' },
  { id: 'goku', emoji: '🐉', label: 'Goku' },
  { id: 'luffy', emoji: '🏴‍☠️', label: 'Luffy' },
  { id: 'light', emoji: '📓', label: 'Light' },
  { id: 'gojo', emoji: '👁️', label: 'Gojo' },
];

function getProfileName() {
  return localStorage.getItem(PROFILE_NAME_KEY) || '';
}

function getProfileAvatar() {
  return localStorage.getItem(PROFILE_AVATAR_KEY) || 'naruto';
}

function getConnected() {
  try {
    return JSON.parse(localStorage.getItem(CONNECT_KEY) || '{}');
  } catch { return {}; }
}

export default function ProfilePage({ spades, badges, showFeedback }) {
  const [name, setName] = useState(getProfileName);
  const [avatar, setAvatar] = useState(getProfileAvatar);
  const [connected] = useState(getConnected);
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(name);

  const totalGamesPlayed = (() => {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ani_progress_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          count += Object.keys(data).length;
        } catch {}
      }
    }
    return count;
  })();

  const bestSurvival = (() => {
    try {
      return parseInt(localStorage.getItem('ani_survival_best') || '0', 10);
    } catch { return 0; }
  })();

  const handleSaveName = () => {
    const trimmed = tempName.trim().slice(0, 20);
    setName(trimmed);
    localStorage.setItem(PROFILE_NAME_KEY, trimmed);
    setEditing(false);
    showFeedback(trimmed ? `Name saved: ${trimmed}` : 'Name cleared');
  };

  const handleSelectAvatar = (id) => {
    setAvatar(id);
    localStorage.setItem(PROFILE_AVATAR_KEY, id);
    showFeedback(`Avatar updated!`);
  };

  const currentAvatar = AVATARS.find(a => a.id === avatar) || AVATARS[0];
  const displayName = name || 'Otaku';

  return (
    <section style={{ padding: 16 }}>
      <BackButton />

      {/* Profile Header */}
      <div style={{ textAlign: 'center', marginBottom: 20, paddingTop: 10 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b1a2b, #c62839)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px', fontSize: 32, color: '#fff',
          boxShadow: '0 4px 16px rgba(139, 26, 43, 0.3)',
        }}>
          {currentAvatar.emoji}
        </div>

        {editing ? (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              maxLength={20}
              placeholder="Enter your name..."
              autoFocus
              style={{
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
                padding: '8px 12px', fontSize: 14, color: T.text, outline: 'none',
                width: 160, textAlign: 'center',
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
            />
            <button onClick={handleSaveName} style={{
              background: '#22c55e', border: 'none', borderRadius: 8,
              padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer',
            }}>Save</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <h2 style={{ color: T.text, fontSize: 18, fontWeight: 800, margin: 0 }}>{displayName}</h2>
            <button onClick={() => { setTempName(name); setEditing(true); }} style={{
              background: 'none', border: `1px solid ${T.border}`, borderRadius: 6,
              padding: '3px 8px', fontSize: 10, color: T.textMid, cursor: 'pointer',
            }}>✏️ Edit</button>
          </div>
        )}
        <p style={{ color: T.textMid, fontSize: 12 }}>Your anime quiz journey</p>
      </div>

      {/* Avatar Selection */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
        padding: 16, marginBottom: 16,
      }}>
        <h3 style={{ color: T.text, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
          Choose Avatar
        </h3>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {AVATARS.map((av) => (
            <button
              key={av.id}
              onClick={() => handleSelectAvatar(av.id)}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: avatar === av.id ? 'rgba(198, 40, 57, 0.15)' : T.surface,
                border: avatar === av.id ? '2px solid #c62839' : `2px solid ${T.border}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s', gap: 0,
              }}
              aria-label={`Select ${av.label} avatar`}
            >
              <span style={{ fontSize: 22 }}>{av.emoji}</span>
            </button>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: T.textMid }}>
          {currentAvatar.label}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
          padding: '14px 12px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>♠ {spades}</div>
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 4 }}>Spades</div>
        </div>
        <div style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
          padding: '14px 12px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#8b5cf6' }}>🏅 {badges.length}</div>
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 4 }}>Badges</div>
        </div>
        <div style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
          padding: '14px 12px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#14b8a6' }}>{totalGamesPlayed}</div>
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 4 }}>Stages Played</div>
        </div>
        <div style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
          padding: '14px 12px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f43f5e' }}>{bestSurvival}</div>
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 4 }}>Best Survival</div>
        </div>
      </div>

      {/* Connect Accounts */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
        padding: 16, marginBottom: 16,
      }}>
        <h3 style={{ color: T.text, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
          Save Progress
        </h3>
        <p style={{ color: T.textMid, fontSize: 11, marginBottom: 14 }}>
          Connect an account to sync progress across devices
        </p>

        {/* Google */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          width: '100%', padding: '12px 14px', marginBottom: 8,
          background: connected.google ? 'rgba(34,197,94,0.08)' : T.surface,
          border: `1px solid ${connected.google ? 'rgba(34,197,94,0.3)' : T.border}`,
          borderRadius: 12, fontSize: 13, fontWeight: 600, color: T.text,
        }}>
          <span style={{ fontSize: 20 }}>📧</span>
          <span style={{ flex: 1 }}>Gmail</span>
          {connected.google ? (
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, background: 'rgba(34,197,94,0.12)', padding: '3px 8px', borderRadius: 8 }}>Connected</span>
          ) : (
            <span style={{ fontSize: 10, color: T.textDim, background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 8 }}>Coming Soon</span>
          )}
        </div>

        {/* Facebook */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          width: '100%', padding: '12px 14px', marginBottom: 8,
          background: connected.facebook ? 'rgba(34,197,94,0.08)' : T.surface,
          border: `1px solid ${connected.facebook ? 'rgba(34,197,94,0.3)' : T.border}`,
          borderRadius: 12, fontSize: 13, fontWeight: 600, color: T.text,
        }}>
          <span style={{ fontSize: 20 }}>📘</span>
          <span style={{ flex: 1 }}>Facebook</span>
          {connected.facebook ? (
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, background: 'rgba(34,197,94,0.12)', padding: '3px 8px', borderRadius: 8 }}>Connected</span>
          ) : (
            <span style={{ fontSize: 10, color: T.textDim, background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 8 }}>Coming Soon</span>
          )}
        </div>

        {/* Twitter / X */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          width: '100%', padding: '12px 14px',
          background: connected.twitter ? 'rgba(34,197,94,0.08)' : T.surface,
          border: `1px solid ${connected.twitter ? 'rgba(34,197,94,0.3)' : T.border}`,
          borderRadius: 12, fontSize: 13, fontWeight: 600, color: T.text,
        }}>
          <span style={{ fontSize: 20 }}>🐦</span>
          <span style={{ flex: 1 }}>Twitter / X</span>
          {connected.twitter ? (
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, background: 'rgba(34,197,94,0.12)', padding: '3px 8px', borderRadius: 8 }}>Connected</span>
          ) : (
            <span style={{ fontSize: 10, color: T.textDim, background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 8 }}>Coming Soon</span>
          )}
        </div>
      </div>

      {/* Info Note */}
      <div style={{
        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 12, padding: '10px 14px', fontSize: 11, color: T.textMid, lineHeight: 1.6,
      }}>
        💡 Name and avatar are saved offline on your device. Cloud sync coming soon!
      </div>
    </section>
  );
}
