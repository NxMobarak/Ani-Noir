import { useEffect, useState } from 'react';
import T from '../constants/theme';

// Floating particle component
function FloatingParticles() {
  return (
    <div className="result-particles" aria-hidden="true">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="result-particle" style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${3 + Math.random() * 4}s`,
          width: `${2 + Math.random() * 4}px`,
          height: `${2 + Math.random() * 4}px`,
          opacity: 0.3 + Math.random() * 0.4,
        }} />
      ))}
    </div>
  );
}

// Confetti burst for passed/cleared
function ConfettiBurst() {
  return (
    <div className="result-confetti" aria-hidden="true">
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} className="confetti-piece" style={{
          left: `${20 + Math.random() * 60}%`,
          animationDelay: `${Math.random() * 0.5}s`,
          animationDuration: `${1.5 + Math.random() * 2}s`,
          background: ['#f43f5e', '#8b5cf6', '#f59e0b', '#22c55e', '#14b8a6', '#ec4899'][i % 6],
          width: `${4 + Math.random() * 6}px`,
          height: `${4 + Math.random() * 6}px`,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          transform: `rotate(${Math.random() * 360}deg)`,
        }} />
      ))}
    </div>
  );
}

/**
 * Premium Result Screen Component
 * Used across all game modes for a consistent, polished result experience.
 * 
 * Props:
 * - passed: boolean
 * - title: string
 * - subtitle: string
 * - stars: number (0-3)
 * - spadesEarned: number - spades earned this round
 * - xpEarned: number - XP earned this round
 * - timeTaken: string - e.g. "1:23" or "45s"
 * - accuracy: string - e.g. "100%" or "80%"
 * - stats: array of { icon, label, value } - additional custom stats
 * - buttons: array of { label, onClick, variant }
 * - onShare: function
 * - gameOver: boolean
 */
export default function ResultScreen({
  passed = true,
  title = 'Stage Cleared!',
  subtitle = '',
  stars = 0,
  spadesEarned = 0,
  xpEarned = 0,
  timeTaken = '',
  accuracy = '',
  stats = [],
  buttons = [],
  onShare,
  gameOver = false,
}) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const emoji = gameOver ? '💀' : passed ? '🏆' : '😓';

  // Build stats array with time/accuracy/rewards
  const allStats = [];
  if (timeTaken) {
    allStats.push({ icon: '⏱️', label: 'Time Taken', value: timeTaken });
  }
  if (accuracy) {
    allStats.push({ icon: '🎯', label: 'Accuracy', value: accuracy });
  }
  if (spadesEarned > 0) {
    allStats.push({ icon: '♠', label: 'Spades', value: `+${spadesEarned}` });
  }
  if (xpEarned > 0) {
    allStats.push({ icon: '⚡', label: 'XP', value: `+${xpEarned}` });
  }
  // Add any custom stats passed in
  allStats.push(...stats);

  return (
    <div className="result-screen-v2">
      {/* Background effects */}
      <div className="result-bg-gradient" aria-hidden="true" />
      <FloatingParticles />
      {passed && !gameOver && <ConfettiBurst />}

      {/* Anime silhouettes */}
      <div className="result-silhouette result-silhouette-left" aria-hidden="true" />
      <div className="result-silhouette result-silhouette-right" aria-hidden="true" />

      {/* Main glassmorphism card */}
      <div className={`result-glass-card ${showContent ? 'result-glass-card-enter' : ''}`}>
        {/* Trophy/Emoji section */}
        <div className="result-trophy-section">
          <div className="result-trophy-glow" aria-hidden="true" />
          <span className="result-trophy-emoji">{emoji}</span>
        </div>

        {/* Title */}
        <h2 className="result-title-v2">{title}</h2>
        <p className="result-subtitle-v2">{subtitle}</p>

        {/* Stars (only for stage modes with stars) */}
        {stars > 0 && (
          <div className="result-stars-section">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`result-star ${i < stars ? 'result-star-filled' : 'result-star-empty'}`}>
                {i < stars ? '\u2605' : '\u2606'}
              </span>
            ))}
          </div>
        )}

        {/* Stats section (Time, Accuracy, Spades, XP) */}
        {allStats.length > 0 && (
          <div className="result-stats-section">
            {allStats.map((stat, idx) => (
              <div key={idx} className="result-stat-item">
                <span className="result-stat-icon">{stat.icon}</span>
                <div className="result-stat-content">
                  <span className="result-stat-label">{stat.label}</span>
                  <span className="result-stat-value">{stat.value}</span>
                </div>
                {idx < allStats.length - 1 && <div className="result-stat-divider" />}
              </div>
            ))}
          </div>
        )}

        {/* Share button */}
        {onShare && (
          <button className="result-share-btn" onClick={onShare}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share Result
          </button>
        )}

        {/* Action buttons */}
        <div className="result-buttons-section">
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              className={`result-btn result-btn-${btn.variant || 'secondary'}`}
              onClick={btn.onClick}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
