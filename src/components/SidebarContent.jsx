import { useNavigate, useLocation } from 'react-router-dom';
import { memo } from 'react';
import T from '../constants/theme';
import NAV from '../constants/nav';
import { playClick } from '../utils/audio';

const SidebarContent = memo(function SidebarContent({ spades, onSpadesClick, onCloseSidebar, onRulesClick }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (item) => {
    if (item.comingSoon) return;
    playClick();
    navigate(item.path);
    if (onCloseSidebar) onCloseSidebar();
  };

  const currentPath = location.pathname;

  return (
    <>
      <div className="sidebar-header">
        <div className="sidebar-logo" aria-label="AniNoir">AniNoir</div>
        <div className="sidebar-tagline">Your Anime Universe</div>
        <button className="sidebar-spades" onClick={onSpadesClick} aria-label={`${spades} spades - tap for details`}>
          &#9824; {spades} Spades
        </button>
      </div>
      <div className="sidebar-nav" role="list">
        <div style={{ padding: '4px 14px 8px', fontSize: 10, fontWeight: 700, color: '#7d8ba0', letterSpacing: 1, textTransform: 'uppercase' }}>Games</div>
        {NAV.filter(n => ['quiz','anagram','emoji','shadow','frames','opening','ending','sceneguess','dialogue','survival','daily'].includes(n.id)).map(n => (
          <button
            key={n.id}
            className={`nav-item ${currentPath === n.path ? 'active' : ''}`}
            onClick={() => handleNav(n)}
            aria-current={currentPath === n.path ? 'page' : undefined}
            aria-disabled={n.comingSoon}
            style={n.comingSoon ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            tabIndex={n.comingSoon ? -1 : 0}
          >
            <span className="icon" aria-hidden="true">{n.icon}</span>
            {n.label}
            {n.comingSoon && <span className="lock-badge" aria-label="Coming soon">SOON</span>}
          </button>
        ))}
        <div style={{ padding: '12px 14px 8px', fontSize: 10, fontWeight: 700, color: '#7d8ba0', letterSpacing: 1, textTransform: 'uppercase' }}>Tools</div>
        {NAV.filter(n => ['search','charsearch','watchlist','news','birthdays'].includes(n.id)).map(n => (
          <button
            key={n.id}
            className={`nav-item ${currentPath === n.path ? 'active' : ''}`}
            onClick={() => handleNav(n)}
            aria-current={currentPath === n.path ? 'page' : undefined}
          >
            <span className="icon" aria-hidden="true">{n.icon}</span>
            {n.label}
          </button>
        ))}
        <div style={{ padding: '12px 14px 8px', fontSize: 10, fontWeight: 700, color: '#7d8ba0', letterSpacing: 1, textTransform: 'uppercase' }}>Account</div>
        {NAV.filter(n => ['profile','settings','about'].includes(n.id)).map(n => (
          <button
            key={n.id}
            className={`nav-item ${currentPath === n.path ? 'active' : ''}`}
            onClick={() => handleNav(n)}
            aria-current={currentPath === n.path ? 'page' : undefined}
          >
            <span className="icon" aria-hidden="true">{n.icon}</span>
            {n.label}
          </button>
        ))}
        {onRulesClick && (
          <button className="nav-item" onClick={() => { onRulesClick(); if (onCloseSidebar) onCloseSidebar(); }}>
            <span className="icon" aria-hidden="true">📜</span>
            Game Rules
          </button>
        )}
      </div>
      <div className="sidebar-footer" />
    </>
  );
});

export default SidebarContent;
