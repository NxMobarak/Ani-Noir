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
 * - passed: boolean - whether the player passed/cleared
 * - title: string - main title ("Stage Cleared!", "Level Cleared!", "Game Over")
 * - subtitle: string - score display ("You scored 5/5", "3/10 correct")
 * - stars: number (0-3) - optional star count for stage modes
 * - reward: string - optional reward text ("+5 earned!")
 * - rewardIcon: string - icon for reward (default: "♠")
 * - stats: array of { icon, label, value } - optional stats to display
 * - buttons: array of { label, onClick, variant } - action buttons
 * - onShare: function - optional share handler
 * - gameOver: boolean - if true, shows game over style (skull instead of trophy)
 */
export default function ResultScreen({
  passed = true,
  title = 'Stage Cleared!',
  subtitle = '',
  stars = 0,
  reward = '',
  rewardIcon = '♠',
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

        {/* Stars (only for stage modes) */}
        {stars > 0 || passed ? (
          <div className="result-stars-section">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`result-star ${i < stars ? 'result-star-filled' : 'result-star-empty'}`}>
                {i < stars ? '\u2605' : '\u2606'}
              </span>
            ))}
          </div>
        ) : null}

        {/* Reward pill */}
        {reward && (
          <div className="result-reward-pill">
            <span className="result-reward-text">+{reward}{rewardIcon} earned!</span>
          </div>
        )}

        {/* Stats section */}
        {stats.length > 0 && (
          <div className="result-stats-section">
            {stats.map((stat, idx) => (
              <div key={idx} className="result-stat-item">
                <span className="result-stat-icon">{stat.icon}</span>
                <div className="result-stat-content">
                  <span className="result-stat-label">{stat.label}</span>
                  <span className="result-stat-value">{stat.value}</span>
                </div>
                {idx < stats.length - 1 && <div className="result-stat-divider" />}
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
