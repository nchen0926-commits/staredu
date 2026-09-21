/**
 * Everything on the site that the admin can edit (besides courses/banners).
 * Shared by the frontend (to render) and the API (to validate what gets
 * saved). Keep this file free of Node/browser-only imports.
 *
 * Defaults are the text that was hardcoded in the pages before this
 * existed, so an empty database renders the site exactly as it was.
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

export interface TestimonialItem {
  imageUrl: string;
  name: string;
  quote: string;
}

export interface ContentPage {
  title: string;
  body: string;
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
    advantages: TitledItem[];
    physicalSection: SectionHeading;
    onlineSection: SectionHeading;
  };
  physicalPage: {
    title: string;
  };
  onlinePage: {
    title: string;
    valueEyebrow: string;
    valueTitle: string;
    points: string[];
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
    title: string;
    subtitle: string;
    items: TestimonialItem[];
  };
  pages: {
    terms: ContentPage;
    privacy: ContentPage;
    faq: ContentPage;
  };
}

export const defaultSiteContent: SiteContent = {
  brand: {
    name: '小管家兒童理財',
    tagline: '兒童理財教育 × 實體營隊與線上課程',
    logoUrl: '',
  },
  nav: {
    // Items with an empty link are hidden until a link is filled in.
    menu: [
      { label: '關於我們', url: '/' },
      { label: '我想上實體課', url: '/physical-courses' },
      { label: '我需要線上課', url: '/online-courses' },
      { label: '學員回饋', url: '/#testimonials' },
      { label: '文章', url: '/articles' },
    ],
    // The orange button at the far right (planned: 會員中心). Hidden until both are filled in.
    memberLabel: '',
    memberUrl: '',
  },
  home: {
    advantages: [
      {
        title: '生活化理財教學',
        description: '從日常生活情境出發，讓孩子學會分辨想要與需要，建立自律金錢觀念。',
      },
      {
        title: '實戰作品與成果產出',
        description: '每堂課程皆能產出專屬手作帳本、創意商業提案或理財桌遊實踐體驗。',
      },
      {
        title: '雙師小班制度',
        description: '實體營隊每班配置專業講師與助教，全程細心關照學員進度。',
      },
      {
        title: '安心安全環境',
        description: '高規格教學場地，配有專屬數位平台與家長課後學習反饋。',
      },
    ],
    physicalSection: {
      eyebrow: '實體互動體驗',
      title: '熱門實體營隊與週末工作坊',
      linkText: '查看全部實體課程',
    },
    onlineSection: {
      eyebrow: '在家隨選隨學',
      title: '線上訂閱暢學專區',
      linkText: '查看全部線上課程',
    },
  },
  physicalPage: {
    title: '實體營隊 / 課程',
  },
  onlinePage: {
    title: '線上訂閱課程',
    valueEyebrow: '為什麼選擇小管家兒童理財線上訂閱？',
    valueTitle: '每月自動續約，隨時可取消，享受無負擔的高品質科技教育',
    points: [
      '每週解鎖全新原創實作單元',
      '助教線上一對一作業批改與指導',
      '隨時隨地可登入電腦或平板學習',
    ],
  },
  footer: {
    description:
      '引領孩子開啟智慧理財與數位素養的第一步。透過生活化情境、趣味實作營隊與互動學習體驗，建立正確金錢觀念與未來競爭力。',
    email: 'contact@e-staredu.com',
    phone: '02-2345-6789',
    address: '台北市大安區教育科技創新園區',
    lineId: '',
    // Shown after © at the very bottom; falls back to the site name when empty.
    companyName: '',
    facebookUrl: 'https://www.facebook.com/groups/963798131355327',
    instagramUrl: '',
    youtubeUrl: 'https://www.youtube.com/@richfromthestart',
    legalLinks: [],
  },
  testimonials: {
    title: '家長口碑',
    subtitle: '來自家長與孩子的真實回饋',
    items: [],
  },
  pages: {
    terms: { title: '服務條款', body: '' },
    privacy: { title: '隱私權政策', body: '' },
    faq: { title: '常見問題', body: '' },
  },
};

const MAX_ITEMS = 20;
const MAX_TEXT = 5000;
const MAX_BODY = 30000;

/** Item shape for list fields that start out empty (so there is no default item to copy). */
const EMPTY_LIST_TEMPLATES: Record<string, unknown> = {
  legalLinks: { label: '', url: '' },
  items: { imageUrl: '', name: '', quote: '' },
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
