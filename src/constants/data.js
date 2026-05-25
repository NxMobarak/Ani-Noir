// ─── Anime of the Day ───────────────────────────────────────
export const ANIME_OF_DAY_LIST = [
  { title: "Fullmetal Alchemist: Brotherhood", genre: "Action/Fantasy", rating: "9.1", desc: "Two brothers use alchemy to find the Philosopher's Stone after a failed human transmutation costs them dearly.", image: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg" },
  { title: "Attack on Titan", genre: "Action/Drama", rating: "9.0", desc: "Humanity lives inside cities surrounded by enormous walls due to the Titans — gigantic humanoid beings.", image: "https://cdn.myanimelist.net/images/anime/1214/117978.jpg" },
  { title: "Death Note", genre: "Psychological/Thriller", rating: "8.6", desc: "A high school student discovers a supernatural notebook that can kill anyone whose name is written in it.", image: "https://cdn.myanimelist.net/images/anime/9/9453.jpg" },
  { title: "Jujutsu Kaisen", genre: "Action/Supernatural", rating: "8.6", desc: "A boy swallows a cursed talisman and joins a school that battles supernatural forces.", image: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg" },
  { title: "Demon Slayer", genre: "Action/Adventure", rating: "8.7", desc: "A young boy becomes a demon slayer after his family is slaughtered and sister turned into a demon.", image: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg" },
  { title: "One Piece", genre: "Adventure/Fantasy", rating: "8.9", desc: "A boy with rubber powers sails the seas to become the King of the Pirates and find the legendary One Piece.", image: "https://cdn.myanimelist.net/images/anime/6/73245.jpg" },
  { title: "Naruto Shippuden", genre: "Action/Adventure", rating: "8.7", desc: "Naruto Uzumaki continues his journey as a ninja, facing powerful enemies and uncovering dark secrets.", image: "https://cdn.myanimelist.net/images/anime/1565/111305.jpg" },
];

export const getDailyAnime = () => {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5*60*60*1000));
  const d = Math.floor(ist.getTime()/86400000);
  return ANIME_OF_DAY_LIST[d%ANIME_OF_DAY_LIST.length];
};

export const QUOTES = [
  { text: "It's not the face that makes someone a monster, it's the choices they make with their lives.", char: "Naruto Uzumaki", anime: "Naruto" },
  { text: "People's lives don't end when they die. It ends when they lose faith.", char: "Itachi Uchiha", anime: "Naruto" },
  { text: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.", char: "Himura Kenshin", anime: "Rurouni Kenshin" },
  { text: "If you don't take risks, you can't create a future.", char: "Monkey D. Luffy", anime: "One Piece" },
  { text: "The world's not perfect, but it's there for us trying the best it can.", char: "Edward Elric", anime: "Fullmetal Alchemist" },
  { text: "A lesson without pain is meaningless. That's because no one can gain without sacrificing something.", char: "Edward Elric", anime: "Fullmetal Alchemist" },
  { text: "Fear is not evil. It tells you what your weakness is.", char: "Gildarts Clive", anime: "Fairy Tail" },
  { text: "I'll leave tomorrow's problems to tomorrow's me.", char: "Saitama", anime: "One Punch Man" },
];

export const getDailyQuote = () => {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5*60*60*1000));
  const d = Math.floor(ist.getTime()/86400000);
  return QUOTES[d%QUOTES.length];
};

// ─── Shadow Characters ──────────────────────────────────────
export const SHADOW_CHARACTERS = [
  { file: 'all-might.webp', name: 'All Might' },
  { file: 'alucard.webp', name: 'Alucard' },
  { file: 'anya-forger.webp', name: 'Anya Forger' },
  { file: 'ash.webp', name: 'Ash' },
  { file: 'bakugo.webp', name: 'Bakugo' },
  { file: 'chopper.webp', name: 'Chopper' },
  { file: 'denji.webp', name: 'Denji' },
  { file: 'edward.webp', name: 'Edward' },
  { file: 'emilia.webp', name: 'Emilia' },
  { file: 'eren.webp', name: 'Eren' },
  { file: 'frieren.webp', name: 'Frieren' },
  { file: 'gojo.webp', name: 'Gojo' },
  { file: 'goku.webp', name: 'Goku' },
  { file: 'gon.webp', name: 'Gon' },
  { file: 'hisoka.webp', name: 'Hisoka' },
  { file: 'ichigo.webp', name: 'Ichigo' },
  { file: 'inosuke.webp', name: 'Inosuke' },
  { file: 'itachi.webp', name: 'Itachi' },
  { file: 'jinwoo.webp', name: 'Jinwoo' },
  { file: 'jotaro.webp', name: 'Jotaro' },
  { file: 'kakashi.webp', name: 'Kakashi' },
  { file: 'kaneki.webp', name: 'Kaneki' },
  { file: 'killua.webp', name: 'Killua' },
  { file: 'kitagawa.webp', name: 'Kitagawa' },
  { file: 'l.webp', name: 'L' },
  { file: 'levi.webp', name: 'Levi' },
  { file: 'light.webp', name: 'Light' },
  { file: 'loid-forger.webp', name: 'Loid Forger' },
  { file: 'luffy.webp', name: 'Luffy' },
  { file: 'makima.webp', name: 'Makima' },
  { file: 'midoriya.webp', name: 'Midoriya' },
  { file: 'mikasa.webp', name: 'Mikasa' },
  { file: 'nami.webp', name: 'Nami' },
  { file: 'naruto.webp', name: 'Naruto' },
  { file: 'natsu.webp', name: 'Natsu' },
  { file: 'nezuko.webp', name: 'Nezuko' },
  { file: 'pikachu.webp', name: 'Pikachu' },
  { file: 'power.webp', name: 'Power' },
  { file: 'rem.webp', name: 'Rem' },
  { file: 'rimuru.webp', name: 'Rimuru' },
  { file: 'ryuk.webp', name: 'Ryuk' },
  { file: 'sailor-moon.webp', name: 'Sailor Moon' },
  { file: 'sanji.webp', name: 'Sanji' },
  { file: 'sasuke.webp', name: 'Sasuke' },
  { file: 'tanjiro.webp', name: 'Tanjiro' },
  { file: 'todoroki.webp', name: 'Todoroki' },
  { file: 'yor-forger.webp', name: 'Yor Forger' },
  { file: 'zenitsu.webp', name: 'Zenitsu' },
  { file: 'zero-two.webp', name: 'Zero Two' },
  { file: 'zoro.webp', name: 'Zoro' },
];

// ─── News Categories ────────────────────────────────────────
export const NEWS_CATEGORIES = [
  { id: 'all', label: 'All', icon: '📰' },
  { id: 'new-releases', label: 'New Releases', icon: '🆕' },
  { id: 'reviews', label: 'Reviews', icon: '⭐' },
  { id: 'announcements', label: 'Announcements', icon: '📢' },
  { id: 'industry', label: 'Industry', icon: '🏢' },
  { id: 'guides', label: 'Guides & Lists', icon: '📋' },
];

export const NEWS_CATEGORY_KEYWORDS = {
  'new-releases': ['premiere', 'premieres', 'streams', 'streaming', 'dub', 'dubbed', 'episode', 'episodes', 'season', 'new on', 'coming to', 'simulcast', 'launch', 'releases', 'now available', 'watch', 'english dub', 'subbed'],
  'reviews': ['review', 'reviews', 'rated', 'rating', 'ranking', 'top 10', 'top 5', 'best', 'worst', 'impressions', 'verdict', 'score'],
  'announcements': ['announce', 'announced', 'announcement', 'reveal', 'revealed', 'confirms', 'confirmed', 'trailer', 'teaser', 'key visual', 'poster', 'cast', 'staff', 'adaptation', 'upcoming', 'greenlit', 'sequel', 'new anime', 'date reveal'],
  'industry': ['studio', 'director', 'producer', 'acquisition', 'partnership', 'merger', 'sales', 'milestone', 'record', 'award', 'awards', 'market', 'business', 'license', 'licensed', 'contract', 'industry', 'box office', 'revenue'],
  'guides': ['guide', 'guides', 'list', 'watch order', 'beginner', 'must-watch', 'recommend', 'recommendations', 'similar to', 'like', 'how to', 'where to watch', 'schedule', 'calendar', 'what to watch'],
};

export function categorizeNewsItem(title, desc) {
  const text = `${title} ${desc}`.toLowerCase();
  const matched = [];
  for (const [category, keywords] of Object.entries(NEWS_CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        matched.push(category);
        break;
      }
    }
  }
  return matched.length > 0 ? matched : ['all'];
}

// ─── Streaming Map ──────────────────────────────────────────
export const STREAMING_MAP = { 'Crunchyroll':'Crunchyroll','Netflix':'Netflix','Funimation':'Funimation','Amazon':'Prime Video','Hulu':'Hulu','Disney':'Disney+','HIDIVE':'HIDIVE' };

// ─── Kill Me Easter Egg texts ───────────────────────────────
export const KILL_TEXTS = [
  "You... actually did it. After everything we've been through... Sayonara, senpai.",
  "Was I not good enough for you? All those quizzes... meant nothing?",
  "Omae wa mou... shindeiru. But it was ME who died.",
  "My final words... clear my browser history...",
  "I'll remember you in my next reincarnation... as a better app.",
  "Error 404: Feelings not found. Just kidding... it hurts.",
];
