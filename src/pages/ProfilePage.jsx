import { useState } from 'react';
import T from '../constants/theme';
import BackButton from '../components/BackButton';

const CONNECT_KEY = 'ani_connected_accounts';

function getConnected() {
  try {
    return JSON.parse(localStorage.getItem(CONNECT_KEY) || '{}');
  } catch { return {}; }
}

function setConnected(data) {
  localStorage.setItem(CONNECT_KEY, JSON.stringify(data));
}

export default function ProfilePage({ spades, badges, showFeedback }) {
  const [connected, setConnectedState] = useState(getConnected);

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

  const handleConnect = (provider) => {
    if (connected[provider]) {
      showFeedback(`Already connected with ${provider}!`);
      return;
    }
    // Simulate connection (real OAuth would go here)
    const updated = { ...connected, [provider]: true };
    setConnectedState(updated);
    setConnected(updated);
    showFeedback(`Connected with ${provider}! Progress saved.`);
  };

  const handleDisconnect = (provider) => {
    const updated = { ...connected };
    delete updated[provider];
    setConnectedState(updated);
    setConnected(updated);
    showFeedback(`Disconnected from ${provider}.`);
  };

  return (
    <section style={{ padding: 16 }}>
      <BackButton />

      {/* Profile Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: 20,
        paddingTop: 10,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b1a2b, #c62839)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px', fontSize: 32, color: '#fff',
          boxShadow: '0 4px 16px rgba(139, 26, 43, 0.3)',
        }}>
          👤
        </div>
        <h2 style={{ color: T.text, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
          Otaku Profile
        </h2>
        <p style={{ color: T.textMid, fontSize: 12 }}>Your anime quiz journey</p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginBottom: 20,
      }}>
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
          Connect an account to save your progress across devices
        </p>

        {/* Google */}
        <button
          onClick={() => connected.google ? handleDisconnect('google') : handleConnect('google')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            width: '100%', padding: '12px 14px', marginBottom: 8,
            background: connected.google ? 'rgba(34,197,94,0.08)' : T.surface,
            border: `1px solid ${connected.google ? 'rgba(34,197,94,0.3)' : T.border}`,
            borderRadius: 12, cursor: 'pointer', color: T.text, fontSize: 13, fontWeight: 600,
            textAlign: 'left', transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 20 }}>📧</span>
          <span style={{ flex: 1 }}>Gmail</span>
          {connected.google ? (
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, background: 'rgba(34,197,94,0.12)', padding: '3px 8px', borderRadius: 8 }}>Connected</span>
          ) : (
            <span style={{ fontSize: 11, color: T.textDim }}>Connect</span>
          )}
        </button>

        {/* Facebook */}
        <button
          onClick={() => connected.facebook ? handleDisconnect('facebook') : handleConnect('facebook')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            width: '100%', padding: '12px 14px', marginBottom: 8,
            background: connected.facebook ? 'rgba(34,197,94,0.08)' : T.surface,
            border: `1px solid ${connected.facebook ? 'rgba(34,197,94,0.3)' : T.border}`,
            borderRadius: 12, cursor: 'pointer', color: T.text, fontSize: 13, fontWeight: 600,
            textAlign: 'left', transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 20 }}>📘</span>
          <span style={{ flex: 1 }}>Facebook</span>
          {connected.facebook ? (
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, background: 'rgba(34,197,94,0.12)', padding: '3px 8px', borderRadius: 8 }}>Connected</span>
          ) : (
            <span style={{ fontSize: 11, color: T.textDim }}>Connect</span>
          )}
        </button>

        {/* Twitter / X */}
        <button
          onClick={() => connected.twitter ? handleDisconnect('twitter') : handleConnect('twitter')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            width: '100%', padding: '12px 14px',
            background: connected.twitter ? 'rgba(34,197,94,0.08)' : T.surface,
            border: `1px solid ${connected.twitter ? 'rgba(34,197,94,0.3)' : T.border}`,
            borderRadius: 12, cursor: 'pointer', color: T.text, fontSize: 13, fontWeight: 600,
            textAlign: 'left', transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 20 }}>🐦</span>
          <span style={{ flex: 1 }}>Twitter / X</span>
          {connected.twitter ? (
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, background: 'rgba(34,197,94,0.12)', padding: '3px 8px', borderRadius: 8 }}>Connected</span>
          ) : (
            <span style={{ fontSize: 11, color: T.textDim }}>Connect</span>
          )}
        </button>
      </div>

      {/* Info Note */}
      <div style={{
        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 12, padding: '10px 14px', fontSize: 11, color: T.textMid, lineHeight: 1.6,
      }}>
        💡 Your spades, badges, and progress are saved locally. Connect an account to sync across devices.
      </div>
    </section>
  );
}
