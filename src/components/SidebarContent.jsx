import { useNavigate, useLocation } from 'react-router-dom';
import { memo } from 'react';
import T from '../constants/theme';
import NAV from '../constants/nav';
import { playClick } from '../utils/audio';

const SidebarContent = memo(function SidebarContent({ spades, onSpadesClick, onCloseSidebar }) {
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
        {NAV.map(n => (
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
      </div>
      <div className="sidebar-footer" />
    </>
  );
});

export default SidebarContent;
