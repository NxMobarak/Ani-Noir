import T from '../constants/theme';
import { MAIN_LEVELS, STAGES_PER_LEVEL, STARS_TO_UNLOCK_LEVEL } from '../questions/index';

export default function RulesModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div className="modal-title" style={{ color: T.rose }}>Game Rules</div>
          <button className="modal-close" onClick={onClose}>&#10005;</button>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.teal, marginBottom:8 }}>Star System</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>2 correct answers = 1&#9733;</li>
            <li>4 correct answers = 2&#9733;</li>
            <li>5 correct answers = 3&#9733; (perfect!)</li>
          </ul>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.violet, marginBottom:8 }}>Unlock Rules</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>Need <strong style={{color:T.text}}>2&#9733;</strong> on a stage to unlock the next stage</li>
            <li>Need <strong style={{color:T.text}}>{STARS_TO_UNLOCK_LEVEL}&#9733;</strong> total in a level to unlock the next level</li>
            <li>Max possible stars per level: {STAGES_PER_LEVEL * 3}&#9733; (3&#9733; x 10 stages)</li>
          </ul>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.gold, marginBottom:8 }}>Levels</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            {MAIN_LEVELS.map((ml, i) => (
              <li key={i}>{ml.icon} <strong style={{color:T.text}}>{ml.name}</strong> — {ml.timeSeconds}s per question</li>
            ))}
          </ul>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.success, marginBottom:8 }}>Earning Spades</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>+5&#9824; per stage passed (need 2&#9733;)</li>
            <li>+100&#9824; when you earn {STARS_TO_UNLOCK_LEVEL}&#9733; in a level</li>
            <li>+1000&#9824; for mastering all 5 levels</li>
            <li>+5&#9824; bonus per 3x combo streak</li>
            <li>+30&#9824; for daily challenge</li>
            <li>+100&#9824; per 5 correct in Survival Mode</li>
          </ul>
        </div>

        <div>
          <div style={{ fontSize:14, fontWeight:700, color:T.rose, marginBottom:8 }}>Power-ups (cost spades)</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>Hint: 30&#9824;</li>
            <li>Skip: 50&#9824;</li>
            <li>Shuffle (word ninja): 20&#9824;</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
