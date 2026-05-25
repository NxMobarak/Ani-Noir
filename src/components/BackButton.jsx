import { useNavigate, useLocation } from 'react-router-dom';
import { memo } from 'react';
import T from '../constants/theme';

const BackButton = memo(function BackButton({ label = 'Back' }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on home page
  if (location.pathname === '/') return null;

  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="Go back"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', color: T.textMid,
        fontSize: 13, cursor: 'pointer', padding: '4px 0',
        marginBottom: 12, transition: 'color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = T.text}
      onMouseLeave={e => e.currentTarget.style.color = T.textMid}
    >
      <span aria-hidden="true">←</span> {label}
    </button>
  );
});

export default BackButton;
