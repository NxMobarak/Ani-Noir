import { useNavigate, useLocation } from 'react-router-dom';
import { memo } from 'react';

const BackButton = memo(function BackButton({ label = 'Back' }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on home page
  if (location.pathname === '/') return null;

  // Always go to home — simple, predictable behavior
  const handleBack = () => {
    navigate('/', { replace: true });
  };

  return (
    <button
      className="btn btn-secondary"
      onClick={handleBack}
      aria-label="Go back to home"
      style={{ marginBottom: 12, fontSize: 13 }}
    >
      ← {label}
    </button>
  );
});

export default BackButton;
