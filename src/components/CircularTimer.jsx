import T from '../constants/theme';

export default function CircularTimer({ timeLeft, maxTime }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, timeLeft / maxTime);
  const offset = circ * (1 - pct);
  const urgent = timeLeft <= 5;
  const stroke = urgent ? T.rose : timeLeft <= 10 ? T.gold : T.teal;
  return (
    <div className="timer-circle">
      <svg className="timer-svg" viewBox="0 0 48 48">
        <circle className="timer-track" cx="24" cy="24" r={r} />
        <circle className="timer-fill" cx="24" cy="24" r={r}
          strokeDasharray={circ} strokeDashoffset={offset} style={{ stroke }} />
      </svg>
      <div className={`timer-text ${urgent ? 'urgent' : ''}`}>{timeLeft}</div>
    </div>
  );
}
