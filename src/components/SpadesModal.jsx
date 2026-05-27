import T from '../constants/theme';

export default function SpadesModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div className="modal-title" style={{ color: T.gold }}>&#9824; Spades & XP Guide</div>
          <button className="modal-close" onClick={onClose}>&#10005;</button>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.success, marginBottom:8 }}>Earn Spades:</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>+5&#9824; per correct answer</li>
            <li>+10&#9824; for 3x streak (3 back-to-back correct)</li>
            <li>+20&#9824; for 5x streak (5 back-to-back correct)</li>
            <li>+50&#9824; bonus for clearing a stage/level</li>
            <li>+300&#9824; Daily Challenge reward</li>
          </ul>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#8b5cf6', marginBottom:8 }}>Earn XP:</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>+10 XP — Clear with 1&#9733;</li>
            <li>+20 XP — Clear with 2&#9733;</li>
            <li>+30 XP — Clear with 3&#9733;</li>
            <li>+300 XP — Daily Challenge reward</li>
          </ul>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.rose, marginBottom:8 }}>Spend Spades:</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>Hint: 100&#9824; (removes 1 wrong option or reveals 1 letter)</li>
            <li>Shuffle (Word Ninja): 50&#9824;</li>
          </ul>
        </div>

        <div>
          <div style={{ fontSize:14, fontWeight:700, color:T.error, marginBottom:8 }}>Penalties:</div>
          <ul style={{ listStyle:'none', fontSize:13, color:T.textMid, lineHeight:2 }}>
            <li>-5&#9824; per wrong answer</li>
          </ul>
        </div>

        <div style={{ marginTop:16, padding:'10px 12px', background:T.surface, borderRadius:10, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:12, color:T.textMid }}>Everyone starts with <strong style={{color:T.gold}}>1000&#9824;</strong>. Earn more by playing games and building streaks!</div>
        </div>
      </div>
    </div>
  );
}
