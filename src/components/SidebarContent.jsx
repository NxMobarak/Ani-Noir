import { useNavigate, useLocation } from 'react-router-dom';
import { memo } from 'react';
import T from '../constants/theme';
import NAV from '../constants/nav';
import { playClick } from '../utils/audio';

const SidebarContent = memo(function SidebarContent({ spades, onSpadesClick, onCloseSidebar, onRulesClick }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path) => {
    playClick();
    navigate(path);
    if (onCloseSidebar) onCloseSidebar();
  };

  const currentPath = location.pathname;

  const NavItem = ({ path, icon, label }) => (
    <button
      className={`nav-item ${currentPath === path ? 'active' : ''}`}
      onClick={() => handleNav(path)}
      aria-current={currentPath === path ? 'page' : undefined}
    >
      <span className="icon" aria-hidden="true">{icon}</span>
      {label}
    </button>
  );

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
        <NavItem path="/" icon="🏠" label="Home" />

        <div style={{ padding: '12px 14px 8px', fontSize: 10, fontWeight: 700, color: '#7d8ba0', letterSpacing: 1, textTransform: 'uppercase' }}>Explore</div>
        <NavItem path="/search" icon="🔍" label="Anime Search" />
        <NavItem path="/charsearch" icon="👤" label="Character Search" />
        <NavItem path="/watchlist" icon="📋" label="Watchlist" />
        <NavItem path="/news" icon="📰" label="News" />
        <NavItem path="/birthdays" icon="🎂" label="Birthdays" />

        <div style={{ padding: '12px 14px 8px', fontSize: 10, fontWeight: 700, color: '#7d8ba0', letterSpacing: 1, textTransform: 'uppercase' }}>Account</div>
        <NavItem path="/profile" icon="👤" label="Profile" />
        <NavItem path="/settings" icon="⚙️" label="Settings" />
        <NavItem path="/about" icon="ℹ️" label="About" />
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
