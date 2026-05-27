/**
 * Data validation and migration for localStorage.
 * Ensures data integrity across app versions.
 */

const CURRENT_VERSION = 3;

// Schema definitions for validation
const schemas = {
  ani_spades: (val) => {
    const n = parseInt(val);
    return !isNaN(n) && n >= 0 ? n : 10000;
  },
  ani_badges: (val) => {
    if (!Array.isArray(val)) return [];
    return val.filter(b => typeof b === 'string' || (typeof b === 'object' && b !== null));
  },
  ani_watchlist: (val) => {
    if (!Array.isArray(val)) return [];
    return val.filter(item =>
      item && typeof item === 'object' && item.mal_id && item.title
    );
  },
  ani_settings: (val) => {
    if (typeof val !== 'object' || val === null) return { sfx: true, music: true, vibration: false };
    return {
      sfx: val.sfx !== false,
      music: val.music !== false,
      vibration: val.vibration === true,
    };
  },
  ani_leaderboard: (val) => {
    if (typeof val !== 'object' || val === null || Array.isArray(val)) return {};
    const cleaned = {};
    for (const [key, entry] of Object.entries(val)) {
      if (entry && typeof entry === 'object' && typeof entry.score === 'number') {
        cleaned[key] = entry;
      }
    }
    return cleaned;
  },
};

/**
 * Safe parse from localStorage with validation.
 */
export function safeGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;

    // For simple string values (like spades stored as string)
    if (key === 'ani_spades') {
      return schemas.ani_spades(raw);
    }

    const parsed = JSON.parse(raw);

    // Apply schema validation if available
    if (schemas[key]) {
      return schemas[key](parsed);
    }

    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safe set to localStorage with error handling.
 */
export function safeSet(key, value) {
  try {
    const toStore = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, toStore);
    return true;
  } catch (e) {
    console.warn(`Failed to save to localStorage (key: ${key}):`, e.message);
    return false;
  }
}

/**
 * Run data migrations if needed.
 */
export function migrateData() {
  const version = parseInt(localStorage.getItem('ani_data_version') || '1');
  if (version >= CURRENT_VERSION) return;

  // Migration v1 -> v2: validate all existing data
  if (version < 2) {
    for (const key of Object.keys(schemas)) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          const parsed = key === 'ani_spades' ? raw : JSON.parse(raw);
          const validated = schemas[key](parsed);
          safeSet(key, key === 'ani_spades' ? String(validated) : validated);
        } catch {
          // Corrupted data — reset to default
          localStorage.removeItem(key);
        }
      }
    }
  }

  // Migration v2 -> v3: rename anagram -> word-ninja storage keys
  if (version < 3) {
    const oldKey = 'ani_stages_anagram';
    const newKey = 'ani_stages_word-ninja';
    const oldData = localStorage.getItem(oldKey);
    if (oldData && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, oldData);
      localStorage.removeItem(oldKey);
    }
  }

  localStorage.setItem('ani_data_version', String(CURRENT_VERSION));
}

/**
 * Export all app data for backup.
 */
export function exportAllData() {
  const data = {};
  const keys = [
    'ani_spades', 'ani_badges', 'ani_watchlist', 'ani_settings',
    'ani_leaderboard', 'ani_stages_quiz', 'ani_stages_anagram',
    'ani_stages_emoji', 'ani_stages_frames', 'ani_stages_shadow',
    'ani_chip_hint_shown', 'ani_offline_shown', 'ani_data_version',
  ];
  for (const key of keys) {
    const val = localStorage.getItem(key);
    if (val !== null) data[key] = val;
  }
  data._exportDate = new Date().toISOString();
  data._appVersion = CURRENT_VERSION;
  return data;
}

/**
 * Import data from backup.
 */
export function importAllData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup file');
  }
  if (!data._exportDate) {
    throw new Error('Not a valid AniNoir backup');
  }

  const skipKeys = ['_exportDate', '_appVersion'];
  for (const [key, value] of Object.entries(data)) {
    if (skipKeys.includes(key)) continue;
    if (key.startsWith('ani_')) {
      localStorage.setItem(key, value);
    }
  }

  // Re-run migrations after import
  migrateData();
}
