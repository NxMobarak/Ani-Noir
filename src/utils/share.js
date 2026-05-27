/**
 * Share utility for AniNoir game results.
 * Provides rich formatted text and multiple share targets.
 */

/**
 * Generate a visually formatted share text for game results.
 */
export function formatShareText({ mode, level, score, total, stars, streak, time }) {
  const starEmoji = Array(3).fill(0).map((_, i) => i < stars ? '\u2B50' : '\u2606').join('');
  const bar = '\u2588'.repeat(Math.round((score / total) * 10)) + '\u2591'.repeat(10 - Math.round((score / total) * 10));

  let lines = [];
  lines.push(`\u{1F3AE} AniNoir \u2014 ${mode}`);
  lines.push(`\u{1F3AF} ${level}`);
  lines.push('');
  lines.push(`${starEmoji}  ${score}/${total}`);
  lines.push(`[${bar}] ${Math.round((score / total) * 100)}%`);
  if (streak && streak >= 3) lines.push(`\u{1F525} Best Streak: ${streak}x`);
  if (time) lines.push(`\u{23F1}\uFE0F ${time}`);
  lines.push('');
  lines.push(`Can you beat my score? \u{1F4AA}`);
  lines.push('#AniNoir #AnimeQuiz');

  return lines.join('\n');
}

/**
 * Try native share, return true if successful.
 */
export async function tryNativeShare(text) {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'AniNoir Result', text });
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

/**
 * Copy text to clipboard with multiple fallbacks.
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}

  // Fallback: textarea trick
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Generate share URLs for different platforms.
 */
export function getShareURLs(text) {
  const encoded = encodeURIComponent(text);
  return {
    whatsapp: `https://wa.me/?text=${encoded}`,
    twitter: `https://twitter.com/intent/tweet?text=${encoded}`,
    telegram: `https://t.me/share/url?text=${encoded}`,
  };
}
