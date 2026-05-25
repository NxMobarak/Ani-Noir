import T from '../constants/theme';
import { STARS_TO_UNLOCK_LEVEL } from '../questions/index';

export default function SpadesModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div className="modal-title" style={{ color: T.gold }}>&#9824; Spades Guide</div>
          <button className="modal-close" onClick={onClose}>&#10005;</button>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.success, marginBottom:8 }}>Earn Spades:</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>+5&#9824; per stage passed (2&#9733;+)</li>
            <li>+100&#9824; for earning {STARS_TO_UNLOCK_LEVEL}&#9733; in a level</li>
            <li>+1000&#9824; for mastering ALL 5 levels</li>
            <li>Combo streaks: +5&#9824; per 3x combo</li>
            <li>Daily challenges: +30&#9824;</li>
            <li>Survival mode: +100&#9824; per 5 correct</li>
          </ul>
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:T.rose, marginBottom:8 }}>Spend Spades:</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>Hints: 30&#9824;</li>
            <li>Skips: 50&#9824;</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
