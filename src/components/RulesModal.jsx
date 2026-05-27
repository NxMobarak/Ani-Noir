import T from '../constants/theme';

export default function RulesModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div className="modal-title" style={{ color: T.rose }}>Game Rules</div>
          <button className="modal-close" onClick={onClose}>&#10005;</button>
        </div>

        {/* Star System */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.teal, marginBottom:8 }}>&#9733; Star System (All Games)</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>5 correct = 1&#9733;</li>
            <li>8 correct = 2&#9733;</li>
            <li>10 correct (all) = 3&#9733; (perfect!)</li>
          </ul>
        </div>

        {/* Spades & XP */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.gold, marginBottom:8 }}>&#9824; Spades & XP (All Games)</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:1.9 }}>
            <li>+5&#9824; per correct answer</li>
            <li>+10&#9824; for 3x streak</li>
            <li>+20&#9824; for 5x streak</li>
            <li>+50&#9824; bonus for clearing a stage/level</li>
            <li>-5&#9824; per wrong answer</li>
            <li style={{marginTop:6}}>1&#9733; = +10 XP | 2&#9733; = +20 XP | 3&#9733; = +30 XP</li>
          </ul>
        </div>

        {/* Power-ups */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#8b5cf6', marginBottom:8 }}>Power-ups</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>Hint: 100&#9824; — Removes 1 wrong option or reveals 1 letter</li>
            <li>Shuffle (Word Ninja): 50&#9824;</li>
          </ul>
        </div>

        {/* Stage Games */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.rose, marginBottom:8 }}>Stage Games (5 Levels, 10 Stages each)</div>
          <div style={{ fontSize:12, color:T.textMid, marginBottom:6 }}>Anime Quiz, Word Ninja, Emoji Wars, Anime Moments, Dialogue Clash</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>10 questions per stage</li>
            <li>Need 2&#9733; on a stage to unlock the next</li>
            <li>Need 25&#9733; total in a level to unlock the next level</li>
            <li>No skipping — wait for next question</li>
          </ul>
        </div>

        {/* Level Games */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.teal, marginBottom:8 }}>Level Games (5 Levels, no stages)</div>
          <div style={{ fontSize:12, color:T.textMid, marginBottom:6 }}>Anime Shadow, Frame Guess, Anime Theme</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>10 questions per level</li>
            <li>Need 2&#9733; to unlock the next level</li>
            <li>No skipping — wait for next question</li>
          </ul>
        </div>

        {/* Survival Mode */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#f97316', marginBottom:8 }}>Survival Mode</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>3 lives, no timer</li>
            <li>Build streaks for combo bonus</li>
            <li>How far can you go?</li>
            <li>+50&#9824; for 10x streak</li>
            <li>+100&#9824; for 15x streak</li>
            <li>+150&#9824; per correct after 15x streak</li>
            <li>10 correct = 1&#9733; +10 XP</li>
            <li>15 correct = 2&#9733; +20 XP</li>
            <li>20 correct = 3&#9733; +30 XP</li>
            <li>After 20: +10 XP per correct</li>
            <li>Questions from Level 4 & 5 of all games</li>
          </ul>
        </div>

        {/* Daily Challenge */}
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:T.success, marginBottom:8 }}>Daily Challenge</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>1 question per day from Level 5 of all games</li>
            <li>+300&#9824; & +300 XP on correct answer</li>
            <li>Resets daily at midnight IST</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
