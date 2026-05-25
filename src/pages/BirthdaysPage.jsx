import { useState, useEffect } from 'react';
import T from '../constants/theme';
import CHARACTER_BIRTHDAYS from '../birthdays_data';

// ─── Helper: Get week boundaries ─────────────────────────────
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(weekStart) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d;
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── CharAvatar: Fetches character image from Jikan with caching ─
function CharAvatar({ name }) {
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    const cacheKey = `char_img_${name.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setImgUrl(cached);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(name)}&limit=1`);
        const data = await res.json();
        const url = data.data?.[0]?.images?.jpg?.image_url;
        if (url) {
          setImgUrl(url);
          localStorage.setItem(cacheKey, url);
        }
      } catch {}
    }, Math.random() * 1000); // stagger requests

    return () => clearTimeout(timer);
  }, [name]);

  return (
    <div style={{
      width: 42, height: 42, borderRadius: '50%', overflow: 'hidden',
      background: T.surface, border: `2px solid ${T.border}`, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {imgUrl ? (
        <img src={imgUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: 18 }}>🎂</span>
      )}
    </div>
  );
}

// ─── Month quick-jump options ────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function BirthdaysPage() {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const baseWeekStart = getWeekStart(today);
  const currentWeekStart = new Date(baseWeekStart);
  currentWeekStart.setDate(currentWeekStart.getDate() + weekOffset * 7);
  const currentWeekEnd = getWeekEnd(currentWeekStart);

  // Get birthdays for current week
  const weekBirthdays = CHARACTER_BIRTHDAYS.filter(char => {
    const month = currentWeekStart.getMonth() + 1;
    const endMonth = currentWeekEnd.getMonth() + 1;

    // Handle same month
    if (month === endMonth) {
      return char.month === month && char.day >= currentWeekStart.getDate() && char.day <= currentWeekEnd.getDate();
    }
    // Handle month crossing
    return (
      (char.month === month && char.day >= currentWeekStart.getDate()) ||
      (char.month === endMonth && char.day <= currentWeekEnd.getDate())
    );
  });

  // Group by day
  const grouped = {};
  weekBirthdays.forEach(char => {
    const key = `${char.month}-${char.day}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(char);
  });

  // Sort days
  const sortedDays = Object.keys(grouped).sort((a, b) => {
    const [am, ad] = a.split('-').map(Number);
    const [bm, bd] = b.split('-').map(Number);
    return am !== bm ? am - bm : ad - bd;
  });

  // Today's birthdays highlight
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const todayBirthdays = CHARACTER_BIRTHDAYS.filter(c => c.month === todayMonth && c.day === todayDay);

  // Month quick-jump
  const jumpToMonth = (monthIdx) => {
    const target = new Date(today.getFullYear(), monthIdx, 1);
    const targetWeekStart = getWeekStart(target);
    const diffMs = targetWeekStart.getTime() - baseWeekStart.getTime();
    const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
    setWeekOffset(diffWeeks);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: T.text, fontSize: 18, marginBottom: 12 }}>🎂 Birthdays</h2>

      {/* Today's birthdays */}
      {todayBirthdays.length > 0 && weekOffset === 0 && (
        <div style={{
          background: `linear-gradient(135deg, ${T.roseGlow}, ${T.goldGlow})`,
          borderRadius: 12, padding: 14, marginBottom: 16,
          border: `1px solid ${T.rose}`,
        }}>
          <div style={{ color: T.gold, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            🎉 TODAY'S BIRTHDAYS
          </div>
          {todayBirthdays.map((char, i) => (
            <div key={i} style={{ color: T.text, fontSize: 13 }}>
              {char.name} <span style={{ color: T.textDim }}>({char.anime})</span>
            </div>
          ))}
        </div>
      )}

      {/* Month quick-jump */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, justifyContent: 'center'
      }}>
        {MONTHS.map((m, i) => (
          <button
            key={m}
            onClick={() => jumpToMonth(i)}
            style={{
              padding: '4px 10px', borderRadius: 12, fontSize: 11,
              background: (currentWeekStart.getMonth() === i) ? T.teal : T.card,
              border: `1px solid ${(currentWeekStart.getMonth() === i) ? T.teal : T.border}`,
              color: (currentWeekStart.getMonth() === i) ? '#fff' : T.textMid,
              cursor: 'pointer',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Week navigation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16
      }}>
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: '8px 12px', color: T.text,
            cursor: 'pointer', fontSize: 14,
          }}
        >
          ← Prev
        </button>
        <div style={{ color: T.textMid, fontSize: 13, textAlign: 'center' }}>
          {formatDate(currentWeekStart)} – {formatDate(currentWeekEnd)}
        </div>
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: '8px 12px', color: T.text,
            cursor: 'pointer', fontSize: 14,
          }}
        >
          Next →
        </button>
      </div>

      {/* Birthday list */}
      {sortedDays.length === 0 ? (
        <div style={{ textAlign: 'center', color: T.textDim, padding: 30 }}>
          No birthdays this week.
        </div>
      ) : (
        sortedDays.map(dayKey => {
          const [m, d] = dayKey.split('-').map(Number);
          const isToday = m === todayMonth && d === todayDay;
          return (
            <div key={dayKey} style={{ marginBottom: 16 }}>
              <div style={{
                color: isToday ? T.gold : T.textMid, fontSize: 12, fontWeight: 700,
                marginBottom: 8, textTransform: 'uppercase',
              }}>
                {isToday && '🎉 '}{MONTHS[m - 1]} {d}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grouped[dayKey].map((char, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: 10, borderRadius: 10,
                      background: T.card, border: `1px solid ${isToday ? T.gold : T.border}`,
                    }}
                  >
                    <CharAvatar name={char.name} />
                    <div>
                      <div style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>
                        {char.name}
                      </div>
                      <div style={{ color: T.textDim, fontSize: 11 }}>
                        {char.anime}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
