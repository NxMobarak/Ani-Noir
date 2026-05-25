import { useNavigate, useLocation } from 'react-router-dom';
import T from '../constants/theme';
import NAV from '../constants/nav';
import { playClick } from '../utils/audio';

export default function SidebarContent({ spades, onSpadesClick, onCloseSidebar }) {
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
        <div className="sidebar-logo">AniNoir</div>
        <div className="sidebar-tagline">Your Anime Universe</div>
        <div className="sidebar-spades" onClick={onSpadesClick}>&#9824; {spades} Spades</div>
      </div>
      <div className="sidebar-nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`nav-item ${currentPath === n.path ? 'active' : ''}`}
            onClick={() => handleNav(n)}
            style={n.comingSoon ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <span className="icon">{n.icon}</span>
            {n.label}
            {n.comingSoon && <span className="lock-badge">SOON</span>}
          </button>
        ))}
      </div>
      <div className="sidebar-footer"></div>
    </>
  );
}
