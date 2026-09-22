import { createClient } from "@supabase/supabase-js";

export interface Course {
  id: string;
  type: "physical" | "online";
  title: string;
  category: string;
  price: number;
  priceUnit: string;
  paymentUrl: string;
  description: string;
  image: string;
  tags: string[];
  location: string;
  duration: string;
  details: string;
  startDate: string;
  endDate: string;
}

export interface BannerItem {
  image: string;
  linkUrl?: string;
}

export interface SiteConfig {
  homeBanners: BannerItem[];
  physicalBanner: string;
  onlineBanner: string;
}

function getClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Configure them as environment variables."
    );
  }
  // Service role key bypasses RLS — this client must only ever run server-side.
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

type CourseRow = {
  id: string;
  type: "physical" | "online";
  title: string;
  category: string;
  price: number;
  price_unit?: string | null;
  payment_url?: string | null;
  description: string;
  image: string;
  tags: string[];
  location: string;
  duration: string;
  details: string;
  start_date: string;
  end_date: string;
};

function rowToCourse(row: CourseRow): Course {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    category: row.category,
    price: row.price,
    // Rows created before price_unit existed: online courses were always billed per month.
    priceUnit: row.price_unit ?? (row.type === "online" ? "月" : ""),
    paymentUrl: row.payment_url ?? "",
    description: row.description,
    image: row.image,
    tags: Array.isArray(row.tags) ? row.tags : [],
    location: row.location,
    duration: row.duration,
    details: row.details,
    startDate: row.start_date,
    endDate: row.end_date,
  };
}

function courseError(message: string): Error {
  if (/price_unit/i.test(message)) {
    return new Error("尚未在 Supabase 加上「費用單位」欄位，請先執行 supabase/course_price_unit.sql");
  }
  if (/payment_url/i.test(message)) {
    return new Error("尚未在 Supabase 加上「付款連結」欄位，請先執行 supabase/course_payment_url.sql");
  }
  return new Error(message);
}

export async function listCourses(type?: string): Promise<Course[]> {
  const client = getClient();
  let query = client.from("courses").select("*").order("created_at", { ascending: true });
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as CourseRow[]).map(rowToCourse);
}

export async function getCourse(id: string): Promise<Course | null> {
  const client = getClient();
  const { data, error } = await client.from("courses").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToCourse(data as CourseRow) : null;
}

export async function createCourse(input: Omit<Course, "id"> & { id?: string }): Promise<Course> {
  const client = getClient();
  const id = input.id || `${input.type === "physical" ? "phy" : "on"}-${Date.now()}`;
  const { data, error } = await client
    .from("courses")
    .insert({
      id,
      type: input.type,
      title: input.title,
      category: input.category,
      price: input.price,
      price_unit: input.priceUnit,
      payment_url: input.paymentUrl,
      description: input.description,
      image: input.image,
      tags: input.tags,
      location: input.location,
      duration: input.duration,
      details: input.details,
      start_date: input.startDate,
      end_date: input.endDate,
    })
    .select("*")
    .single();
  if (error) throw courseError(error.message);
  return rowToCourse(data as CourseRow);
}

export async function updateCourse(id: string, patch: Partial<Course>): Promise<Course | null> {
  const client = getClient();
  const dbPatch: Partial<CourseRow> = {};
  if (patch.type !== undefined) dbPatch.type = patch.type;
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.category !== undefined) dbPatch.category = patch.category;
  if (patch.price !== undefined) dbPatch.price = patch.price;
  if (patch.priceUnit !== undefined) dbPatch.price_unit = patch.priceUnit;
  if (patch.paymentUrl !== undefined) dbPatch.payment_url = patch.paymentUrl;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.image !== undefined) dbPatch.image = patch.image;
  if (patch.tags !== undefined) dbPatch.tags = patch.tags;
  if (patch.location !== undefined) dbPatch.location = patch.location;
  if (patch.duration !== undefined) dbPatch.duration = patch.duration;
  if (patch.details !== undefined) dbPatch.details = patch.details;
  if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate;
  if (patch.endDate !== undefined) dbPatch.end_date = patch.endDate;

  const { data, error } = await client
    .from("courses")
    .update(dbPatch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw courseError(error.message);
  return data ? rowToCourse(data as CourseRow) : null;
}

export async function deleteCourse(id: string): Promise<Course | null> {
  const client = getClient();
  const { data, error } = await client.from("courses").delete().eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToCourse(data as CourseRow) : null;
}

export async function getConfig(): Promise<SiteConfig> {
  const client = getClient();
  const { data, error } = await client
    .from("site_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    return { homeBanners: [], physicalBanner: "", onlineBanner: "" };
  }
  return {
    homeBanners: Array.isArray(data.home_banners) ? data.home_banners : [],
    physicalBanner: data.physical_banner || "",
    onlineBanner: data.online_banner || "",
  };
}

export async function saveConfig(patch: Partial<SiteConfig>): Promise<SiteConfig> {
  const client = getClient();
  const dbPatch: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() };
  if (patch.homeBanners !== undefined) dbPatch.home_banners = patch.homeBanners;
  if (patch.physicalBanner !== undefined) dbPatch.physical_banner = patch.physicalBanner;
  if (patch.onlineBanner !== undefined) dbPatch.online_banner = patch.onlineBanner;

  const { error } = await client.from("site_config").upsert(dbPatch, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return getConfig();
}

export async function getSiteContent(): Promise<unknown> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from("site_content")
      .select("data")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.data ?? {};
  } catch (err) {
    // The public site must keep rendering (with built-in defaults) even if
    // this table hasn't been created yet or Supabase is briefly unreachable.
    console.error("Load site content error:", err);
    return {};
  }
}

export async function saveSiteContent(content: unknown): Promise<void> {
  const client = getClient();
  const { error } = await client
    .from("site_content")
    .upsert({ id: 1, data: content, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) {
    if (/could not find the table|does not exist|permission denied/i.test(error.message)) {
      throw new Error("尚未在 Supabase 建立「網站內容」資料表，請先執行 supabase/site_content.sql");
    }
    throw new Error(error.message);
  }
}

const ASSET_BUCKET = "site-assets";

export async function uploadSiteAsset(body: Buffer, contentType: string, path: string): Promise<string> {
  const client = getClient();
  const upload = () =>
    client.storage.from(ASSET_BUCKET).upload(path, body, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });

  let { error } = await upload();
  if (error && /bucket not found/i.test(error.message)) {
    const created = await client.storage.createBucket(ASSET_BUCKET, { public: true });
    if (created.error && !/already exists/i.test(created.error.message)) {
      throw new Error(created.error.message);
    }
    ({ error } = await upload());
  }
  if (error) throw new Error(error.message);

  return client.storage.from(ASSET_BUCKET).getPublicUrl(path).data.publicUrl;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  seoDescription: string;
  author: string;
  coverImage: string;
  body: string;
  published: boolean;
  publishedAt: string;
  updatedAt: string;
  viewCount: number;
}

export type ArticleInput = Omit<Article, "id" | "updatedAt" | "viewCount">;

type ArticleRow = {
  id: string;
  slug?: string | null;
  title: string;
  summary: string;
  seo_description?: string | null;
  author?: string | null;
  cover_image: string;
  body: string;
  published: boolean;
  published_at: string;
  updated_at?: string | null;
  view_count?: number | null;
};

function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug ?? "",
    title: row.title,
    summary: row.summary,
    seoDescription: row.seo_description ?? "",
    author: row.author ?? "",
    coverImage: row.cover_image,
    body: row.body,
    published: row.published,
    publishedAt: row.published_at,
    updatedAt: row.updated_at ?? row.published_at,
    viewCount: row.view_count ?? 0,
  };
}

/** Visible to visitors: published, and the scheduled publish time has arrived. */
export function isArticleLive(article: Pick<Article, "published" | "publishedAt">): boolean {
  return article.published && new Date(article.publishedAt).getTime() <= Date.now();
}

function articlesError(message: string): Error {
  if (/articles_slug_key|duplicate key/i.test(message)) {
    return new Error("這個「網址名稱」已經被別篇文章用了，請換一個");
  }
  if (/could not find the table|does not exist|permission denied/i.test(message) && !/column|function/i.test(message)) {
    return new Error("尚未在 Supabase 建立「文章」資料表，請先執行 supabase/articles.sql");
  }
  if (/slug|seo_description|author|view_count|increment_article_views/i.test(message)) {
    return new Error("尚未在 Supabase 升級「文章」資料表，請先執行 supabase/articles_v2.sql");
  }
  return new Error(message);
}

export async function listArticles(onlyLive: boolean): Promise<Article[]> {
  const client = getClient();
  let query = client.from("articles").select("*").order("published_at", { ascending: false });
  if (onlyLive) query = query.eq("published", true).lte("published_at", new Date().toISOString());
  const { data, error } = await query;
  if (error) throw articlesError(error.message);
  return (data as ArticleRow[]).map(rowToArticle);
}

/** Looks an article up by its id or its custom URL name. */
export async function getArticleByKey(key: string): Promise<Article | null> {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(key)) return null;
  const client = getClient();

  const byId = await client.from("articles").select("*").eq("id", key).maybeSingle();
  if (byId.error) throw articlesError(byId.error.message);
  if (byId.data) return rowToArticle(byId.data as ArticleRow);

  const bySlug = await client.from("articles").select("*").eq("slug", key).maybeSingle();
  if (bySlug.error) {
    if (/slug/i.test(bySlug.error.message)) return null; // upgrade SQL not run yet
    throw articlesError(bySlug.error.message);
  }
  return bySlug.data ? rowToArticle(bySlug.data as ArticleRow) : null;
}

export async function createArticle(input: ArticleInput): Promise<Article> {
  const client = getClient();
  const id = `art-${Date.now().toString(36)}`;
  const { data, error } = await client
    .from("articles")
    .insert({
      id,
      slug: input.slug || null,
      title: input.title,
      summary: input.summary,
      seo_description: input.seoDescription,
      author: input.author,
      cover_image: input.coverImage,
      body: input.body,
      published: input.published,
      published_at: input.publishedAt,
    })
    .select("*")
    .single();
  if (error) throw articlesError(error.message);
  return rowToArticle(data as ArticleRow);
}

export async function updateArticle(id: string, input: ArticleInput): Promise<Article | null> {
  const client = getClient();
  const { data, error } = await client
    .from("articles")
    .update({
      slug: input.slug || null,
      title: input.title,
      summary: input.summary,
      seo_description: input.seoDescription,
      author: input.author,
      cover_image: input.coverImage,
      body: input.body,
      published: input.published,
      published_at: input.publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw articlesError(error.message);
  return data ? rowToArticle(data as ArticleRow) : null;
}

export async function deleteArticle(id: string): Promise<boolean> {
  const client = getClient();
  const { data, error } = await client.from("articles").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw articlesError(error.message);
  return Boolean(data);
}

export async function incrementArticleViews(id: string): Promise<void> {
  const client = getClient();
  const { error } = await client.rpc("increment_article_views", { article_id: id });
  if (error) console.error("Increment article views error:", error.message);
}

export interface Lead {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

type LeadRow = { id: string; email: string; source: string; created_at: string };

function rowToLead(row: LeadRow): Lead {
  return { id: row.id, email: row.email, source: row.source, createdAt: row.created_at };
}

function leadsError(message: string): Error {
  if (/could not find the table|does not exist|permission denied/i.test(message)) {
    return new Error("尚未在 Supabase 建立「訂閱名單」資料表，請先執行 supabase/leads.sql");
  }
  return new Error(message);
}

/** Returns false if this email was already on the list (still not an error — the visitor sees success either way). */
export async function createLead(email: string, source: string): Promise<boolean> {
  const client = getClient();
  const id = `lead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const { error } = await client
    .from("leads")
    .insert({ id, email, source })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return false; // unique violation: already subscribed
    throw leadsError(error.message);
  }
  return true;
}

export async function listLeads(): Promise<Lead[]> {
  const client = getClient();
  const { data, error } = await client.from("leads").select("*").order("created_at", { ascending: false });
  if (error) throw leadsError(error.message);
  return (data as LeadRow[]).map(rowToLead);
}

export async function deleteLead(id: string): Promise<boolean> {
  const client = getClient();
  const { data, error } = await client.from("leads").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw leadsError(error.message);
  return Boolean(data);
}
