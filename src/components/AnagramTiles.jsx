import { useState, useEffect } from 'react';
import T from '../constants/theme';
import { playClick } from '../utils/audio';

export default function AnagramTiles({ scrambled, onSolve, hintRevealed, hint, answered, correctAnswer }) {
  const [tiles, setTiles] = useState(() => scrambled.map((l, i) => ({ id: i, letter: l, used: false })));
  const [answer, setAnswer] = useState([]);

  useEffect(() => {
    setTiles(scrambled.map((l, i) => ({ id: i, letter: l, used: false })));
    setAnswer([]);
  }, [scrambled.join('')]);

  const tapTile = (tile) => {
    if (tile.used || answered) return;
    playClick();
    setTiles(t => t.map(x => x.id === tile.id ? { ...x, used: true } : x));
    setAnswer(a => [...a, { tileId: tile.id, letter: tile.letter }]);
  };

  const removeLast = () => {
    if (!answer.length || answered) return;
    const last = answer[answer.length - 1];
    setTiles(t => t.map(x => x.id === last.tileId ? { ...x, used: false } : x));
    setAnswer(a => a.slice(0, -1));
  };

  const clearAll = () => {
    if (answered) return;
    setTiles(t => t.map(x => ({ ...x, used: false })));
    setAnswer([]);
  };

  const submit = () => {
    if (!answer.length || answered) return;
    onSolve(answer.map(a => a.letter).join(''));
  };

  return (
    <div className="anagram-display">
      <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Your Answer</div>
      <div className="answer-slots">
        {answer.length === 0
          ? <div style={{ color: T.textDim, fontSize: 13, alignSelf: 'center' }}>Tap letters below to build the word</div>
          : answer.map((a, i) => (
              <div key={i} className="answer-slot filled" onClick={removeLast} title="Tap to remove last">
                {a.letter}
              </div>
            ))
        }
      </div>
      <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Available Letters</div>
      <div className="tile-pool">
        {tiles.map(tile => (
          <div key={tile.id} className={`letter-tile ${tile.used ? 'used' : ''}`} onClick={() => tapTile(tile)}>
            {tile.letter}
          </div>
        ))}
      </div>
      {hintRevealed && hint && (
        <div style={{ marginBottom: 10, fontSize: 13, color: T.gold }}>Hint: {hint}</div>
      )}
      {answered && (
        <div style={{ fontSize: 13, color: T.textMid }}>
          Answer: <span style={{ color: T.success, fontWeight: 700 }}>{correctAnswer}</span>
        </div>
      )}
      <div className="anagram-actions">
        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '8px 12px' }} onClick={removeLast} disabled={!answer.length || answered}>&#9003;</button>
        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '8px 12px' }} onClick={clearAll} disabled={!answer.length || answered}>Clear</button>
        <button className="btn btn-primary" style={{ flex: 1, fontSize: 13 }} onClick={submit} disabled={!answer.length || answered}>Submit &#10003;</button>
      </div>
    </div>
  );
}
