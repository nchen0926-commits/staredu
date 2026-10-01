/**
 * Everything on the site that the admin can edit (besides courses/banners).
 * Shared by the frontend (to render) and the API (to validate what gets
 * saved). Keep this file free of Node/browser-only imports.
 *
 * Defaults are the text that was hardcoded in the pages before this
 * existed, so an empty database renders the site exactly as it was.
 *
 * IMPORTANT for anyone renaming/restructuring a field here: resolveSiteContent()
 * merges saved data onto these defaults key-by-key. A field that KEEPS its key
 * name keeps whatever the admin already saved (safe for things like real
 * testimonials/contact info). A field whose key is removed/renamed loses
 * whatever was saved under the old key and falls back to the new default —
 * fine for brand-new sections, but never do this to a field that might
 * already hold real admin-entered data.
 */

export interface TitledItem {
  title: string;
  description: string;
}

export interface SectionHeading {
  eyebrow: string;
  title: string;
  linkText: string;
}

export interface MenuItem {
  label: string;
  url: string;
}

export interface LegalLink {
  label: string;
  url: string;
}

/** A parent/employer review, or a class/event record — shown on Home, 小管家兒童理財 and 大人的理財. */
export interface TestimonialItem {
  imageUrl: string;
  name: string;
  quote: string;
  activityName: string;
  date: string;
  /** Which page this shows on. '' (old entries) behaves like 'kids' — that is what this site had before. */
  segment: 'kids' | 'adult' | 'enterprise' | '';
}

export interface ContentPage {
  title: string;
  body: string;
}

export interface EntryCard {
  title: string;
  description: string;
  ctaText: string;
  url: string;
}

export interface NeedSection {
  id: string;
  title: string;
  question: string;
  body: string;
}

export interface ServiceItem {
  title: string;
  description: string;
}

export interface SiteContent {
  brand: {
    name: string;
    tagline: string;
    logoUrl: string;
  };
  nav: {
    menu: MenuItem[];
    memberLabel: string;
    memberUrl: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    heroCtaAdult: string;
    heroCtaKids: string;
    insightTitle: string;
    insightBody: string;
    entryAdult: EntryCard;
    entryKids: EntryCard;
    entryEnterprise: EntryCard;
    coursesSection: SectionHeading;
    articlesSection: SectionHeading;
    enterpriseBanner: {
      title: string;
      subtitle: string;
      description: string;
      ctaText: string;
    };
    aboutTitle: string;
    aboutBody: string;
    storiesTitle: string;
    storiesSubtitle: string;
  };
  kidsPage: {
    heroTitle: string;
    heroSubtitle: string;
    philosophyTitle: string;
    philosophyBody: string;
    whyTitle: string;
    whyBody: string;
    featuresTitle: string;
    featuresBody: string;
    coursesTitle: string;
    storiesTitle: string;
    storiesSubtitle: string;
    ctaText: string;
  };
  adultPage: {
    heroTitle: string;
    heroSubtitle: string;
    needsIntro: string;
    needs: NeedSection[];
    articlesTitle: string;
    courseName: string;
    courseSubtitle: string;
    courseBody: string;
    courseStatus: string;
    storiesTitle: string;
    storiesSubtitle: string;
    endingTitle: string;
    endingCtaText: string;
  };
  enterprisePage: {
    heroTitle: string;
    heroSubtitle: string;
    heroCtaText: string;
    services: ServiceItem[];
    whyUsTitle: string;
    whyUs: ServiceItem[];
    outcomesTitle: string;
    outcomesBody: string;
    outcomesList: string[];
    esgTitle: string;
    esgBody: string;
    esgCtaText: string;
  };
  footer: {
    description: string;
    email: string;
    phone: string;
    address: string;
    lineId: string;
    companyName: string;
    facebookUrl: string;
    instagramUrl: string;
    youtubeUrl: string;
    legalLinks: LegalLink[];
  };
  testimonials: {
    items: TestimonialItem[];
  };
  pages: {
    terms: ContentPage;
    privacy: ContentPage;
    faq: ContentPage;
  };
  leadCapture: {
    enabled: boolean;
    title: string;
    subtitle: string;
    placeholder: string;
    buttonText: string;
    successTitle: string;
    successMessage: string;
    disclaimer: string;
  };
}

export const defaultSiteContent: SiteContent = {
  brand: {
    name: '星育學苑',
    tagline: '大人的理財 × 小管家兒童理財 × 企業永續合作',
    logoUrl: '',
  },
  nav: {
    menu: [
      { label: '首頁', url: '/' },
      { label: '大人的理財', url: '/adult-finance' },
      { label: '小管家兒童理財', url: '/kids-finance' },
      { label: '企業永續合作', url: '/enterprise' },
      { label: '理財文章', url: '/articles' },
    ],
    memberLabel: '',
    memberUrl: '',
  },
  home: {
    heroTitle: '先把自己的錢搞懂，\n再陪孩子學會用錢。',
    heroSubtitle: '給這一代家庭的理財學習平台\n從大人的理財與人生選擇，到孩子的第一堂金錢教育。',
    heroCtaAdult: '大人的理財',
    heroCtaKids: '孩子的理財',
    insightTitle: '我們長大了，才發現沒有人真正教過我們怎麼用錢。',
    insightBody:
      '開始工作、成家、有了孩子，\n錢突然不只是「夠不夠花」。\n\n要存多少？\n怎麼開始投資？\n風險怎麼管理？\n有了家庭以後，錢又該怎麼安排？\n又該怎麼跟孩子談錢？\n\n這些都是長大以後，才開始面對的問題。',
    entryAdult: {
      title: '先把自己的錢搞懂',
      description: '從現金流、風險、投資到家庭財務，\n建立自己的金錢判斷力。',
      ctaText: '開始學理財 →',
      url: '/adult-finance',
    },
    entryKids: {
      title: '讓孩子從生活開始認識金錢',
      description: '用原創故事、遊戲與生活任務，\n讓孩子理解錢從哪裡來、怎麼使用，以及如何做選擇。',
      ctaText: '陪孩子開始 →',
      url: '/kids-finance',
    },
    entryEnterprise: {
      title: '讓金融素養成為企業照顧員工的一部分',
      description: '提供企業員工財務素養講座、系列課程與客製化內容，\n協助企業推動員工福祉與金融素養教育。',
      ctaText: '企業合作 →',
      url: '/enterprise',
    },
    coursesSection: {
      eyebrow: '熱門課程',
      title: '近期開課與熱門課程',
      linkText: '查看全部課程',
    },
    articlesSection: {
      eyebrow: '理財文章',
      title: '大人與孩子都適合讀的理財文章',
      linkText: '閱讀更多理財文章 →',
    },
    enterpriseBanner: {
      title: '讓金融素養，成為企業照顧員工的一部分',
      subtitle: '企業永續 × 員工金融素養 × 員工福祉',
      description: '從單場講座到系列課程，\n提供貼近生活、容易理解並能實際應用的金融素養教育。',
      ctaText: '了解企業合作 →',
    },
    aboutTitle: '關於星育學苑',
    aboutBody:
      '星育學苑由 Nancy 陳亮君創辦，具備金融資產管理實務背景，並長期投入兒童財商教育與教材創作。\n\n透過原創兒童財商繪本、故事與遊戲內容，將金融知識轉譯成一般人與孩子都能理解的語言，陪伴大人重新認識理財，也陪伴孩子建立人生第一堂金錢教育。',
    storiesTitle: '學員與活動成果',
    storiesSubtitle: '來自大人、孩子與合作夥伴的真實回饋',
  },
  kidsPage: {
    heroTitle: '讓孩子從生活開始認識金錢',
    heroSubtitle: '用原創故事、遊戲與生活任務，陪孩子建立受用一生的金錢觀念。',
    philosophyTitle: '生活化理財教學',
    philosophyBody: '從日常生活情境出發，讓孩子學會分辨想要與需要，建立自律金錢觀念，透過實際操作累積屬於自己的理財經驗。',
    whyTitle: '為什麼孩子需要金融素養',
    whyBody:
      '金錢觀念越早建立，孩子越能學會做選擇、承擔後果、規劃未來。小管家兒童理財相信，理財教育不是背誦知識，而是透過生活情境，讓孩子自然而然學會用錢的智慧。',
    featuresTitle: '原創故事、繪本與遊戲式學習',
    featuresBody: '每堂課程結合原創理財故事、桌遊與手作任務，讓孩子在玩樂中理解金錢的價值，並產出專屬的手作帳本或創意提案。',
    coursesTitle: '現有課程',
    storiesTitle: '學員回饋與活動紀錄',
    storiesSubtitle: '來自家長與孩子的真實回饋',
    ctaText: '立即報名 →',
  },
  adultPage: {
    heroTitle: '錢賺了這麼多年，\n是時候真正搞懂它了。',
    heroSubtitle: '不追明牌，不預測漲跌。\n從現金流、風險、投資到家庭財務，\n建立自己的金錢判斷力。',
    needsIntro: '你現在，最想解決哪一種錢的問題？',
    needs: [
      {
        id: 'cashflow',
        title: '錢到底去哪了？',
        question: '有收入，卻一直存不下來',
        body: '內容方向：現金流、支出、儲蓄、財務目標',
      },
      {
        id: 'invest',
        title: '我想開始投資',
        question: 'ETF、股票很多，但不知道自己到底在買什麼',
        body: '內容方向：投資基礎、風險、複利、長期投資、資產配置',
      },
      {
        id: 'security',
        title: '我想讓自己更安心',
        question: '如果收入突然中斷，我的財務準備好了嗎？',
        body: '內容方向：緊急預備金、風險管理、保險基本觀念',
      },
      {
        id: 'family',
        title: '有了家庭，錢怎麼安排？',
        question: '房子、孩子、父母、退休，開始同時出現在人生裡',
        body: '內容方向：家庭財務、人生階段、教育金、長期規劃',
      },
    ],
    articlesTitle: '大人的理財文章',
    courseName: '《大人的第一堂理財課》',
    courseSubtitle: '以前沒人教的理財，現在重新學起。',
    courseBody: '內容方向：錢怎麼留、風險怎麼管理、投資怎麼開始、有家庭後怎麼安排',
    courseStatus: '課程籌備中',
    storiesTitle: '學員回饋',
    storiesSubtitle: '',
    endingTitle: '自己學會理財，\n也讓下一代更早開始。',
    endingCtaText: '帶孩子一起學理財 →',
  },
  enterprisePage: {
    heroTitle: '讓員工的財務健康，\n也成為企業照顧的一部分。',
    heroSubtitle:
      '員工金融素養 × 財務健康 × 永續人才\n\n從日常金錢管理、投資觀念到人生不同階段的財務選擇，\n用一場真正聽得懂、能實際應用的課程，\n協助員工建立更好的金錢判斷力。',
    heroCtaText: '索取企業講座方案',
    services: [
      {
        title: '員工財務素養講座',
        description:
          '60–90 分鐘，適合午間講座、Learning Day、員工福利、教育訓練。\n\n主題範例：\n《30歲以後，重新學一次理財》——從一個人的理財，到一個家庭的財務選擇\n《錢都去哪了？大人的財務整理術》——現金流、預備金、財務目標\n《投資以前，先建立自己的判斷力》——風險、複利、ETF與長期投資基本觀念',
      },
      {
        title: '系列式員工財務素養課',
        description: '第一堂｜把自己的錢搞懂\n第二堂｜開始累積資產\n第三堂｜家庭與人生的財務規劃',
      },
      {
        title: '客製化金融素養內容',
        description: '依企業需求規劃：金融素養主題、內訓教材、數位學習內容、系列課程',
      },
    ],
    whyUsTitle: '為什麼是星育',
    whyUs: [
      { title: '金融專業', description: '具金融資產管理實務背景，不以明牌與市場預測作為金融教育核心。' },
      { title: '容易理解的金融教育', description: '把複雜金融概念，轉化成一般員工能理解、能應用在生活中的內容。' },
      { title: '從個人延伸到家庭', description: '不只談投資，也談不同人生階段真正會遇到的金錢選擇。' },
    ],
    outcomesTitle: '一場簡單的課，也可以留下具體的學習成果。',
    outcomesBody: '依企業需求可提供：',
    outcomesList: ['參與人次', '課程滿意度', '學習回饋', '活動紀錄', '課後問卷', '成果摘要'],
    esgTitle: '與企業一起推動金融素養與員工福祉',
    esgBody: '可依企業人才發展、員工福祉及永續相關需求，規劃單場講座、系列課程或客製化金融素養內容，並依專案需求提供參與人次、滿意度及課程回饋等成果資料。',
    esgCtaText: '洽談企業合作',
  },
  footer: {
    description:
      '引領孩子開啟智慧理財與數位素養的第一步。透過生活化情境、趣味實作營隊與互動學習體驗，建立正確金錢觀念與未來競爭力。',
    email: 'contact@e-staredu.com',
    phone: '02-2345-6789',
    address: '台北市大安區教育科技創新園區',
    lineId: '',
    companyName: '',
    facebookUrl: 'https://www.facebook.com/groups/963798131355327',
    instagramUrl: '',
    youtubeUrl: 'https://www.youtube.com/@richfromthestart',
    legalLinks: [],
  },
  testimonials: {
    items: [],
  },
  pages: {
    terms: { title: '服務條款', body: '' },
    privacy: { title: '隱私權政策', body: '' },
    faq: { title: '常見問題', body: '' },
  },
  leadCapture: {
    enabled: true,
    title: '加入我們的訂閱名單',
    subtitle: '掌握最新營隊資訊與理財教育文章',
    placeholder: '請輸入你的 Email',
    buttonText: '訂閱',
    successTitle: '訂閱成功！',
    successMessage: '謝謝你，我們有新消息會通知你。',
    disclaimer: '我們僅用於通知課程與活動最新消息，不會有其他用途。',
  },
};

const MAX_ITEMS = 20;
const MAX_TEXT = 5000;
const MAX_BODY = 30000;

/** Item shape for list fields that start out empty (so there is no default item to copy). */
const EMPTY_LIST_TEMPLATES: Record<string, unknown> = {
  legalLinks: { label: '', url: '' },
  items: { imageUrl: '', name: '', quote: '', activityName: '', date: '', segment: '' },
};

/** Only allow links a visitor's browser can safely follow (no javascript: etc.). */
export function safeUrl(value: string): string {
  const v = value.trim();
  if (v === '') return '';
  if (v.startsWith('/') && !v.startsWith('//')) return v;
  if (v.startsWith('#')) return v;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v;
  return '';
}

/** Turns a LINE ID (@official-account or personal ID) — or a pasted link — into a chat link. */
export function lineLink(lineId: string): string {
  const id = lineId.trim();
  if (!id) return '';
  if (/^https?:\/\//i.test(id)) return safeUrl(id);
  if (id.startsWith('@')) return `https://line.me/R/ti/p/${encodeURIComponent(id)}`;
  return `https://line.me/ti/p/~${encodeURIComponent(id)}`;
}

function isUrlKey(key: string): boolean {
  return key === 'url' || key.endsWith('Url');
}

function merge(def: unknown, input: unknown, key = ''): unknown {
  if (typeof def === 'boolean') {
    return typeof input === 'boolean' ? input : def;
  }
  if (typeof def === 'string') {
    if (typeof input !== 'string') return def;
    const text = input.trim().slice(0, key === 'body' ? MAX_BODY : MAX_TEXT);
    return isUrlKey(key) ? safeUrl(text) : text;
  }
  if (Array.isArray(def)) {
    if (!Array.isArray(input)) return def;
    const template = def.length > 0 ? def[0] : EMPTY_LIST_TEMPLATES[key];
    if (template === undefined) return [];
    return input.slice(0, MAX_ITEMS).map((item) => merge(template, item, key));
  }
  if (def && typeof def === 'object') {
    const source =
      input && typeof input === 'object' && !Array.isArray(input)
        ? (input as Record<string, unknown>)
        : {};
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(def)) {
      out[k] = merge((def as Record<string, unknown>)[k], source[k], k);
    }
    return out;
  }
  return def;
}

/**
 * Turns whatever is stored (or submitted) into a complete, well-formed
 * SiteContent: unknown keys are dropped, missing ones fall back to the
 * defaults, lengths are capped and links are sanitized.
 */
export function resolveSiteContent(input: unknown): SiteContent {
  return merge(defaultSiteContent, input) as SiteContent;
}
