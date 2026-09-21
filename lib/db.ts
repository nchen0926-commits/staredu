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
  title: string;
  summary: string;
  coverImage: string;
  body: string;
  published: boolean;
  publishedAt: string;
}

type ArticleRow = {
  id: string;
  title: string;
  summary: string;
  cover_image: string;
  body: string;
  published: boolean;
  published_at: string;
};

function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    coverImage: row.cover_image,
    body: row.body,
    published: row.published,
    publishedAt: row.published_at,
  };
}

function articlesError(message: string): Error {
  if (/could not find the table|does not exist|permission denied/i.test(message)) {
    return new Error("尚未在 Supabase 建立「文章」資料表，請先執行 supabase/articles.sql");
  }
  return new Error(message);
}

export async function listArticles(onlyPublished: boolean): Promise<Article[]> {
  const client = getClient();
  let query = client.from("articles").select("*").order("published_at", { ascending: false });
  if (onlyPublished) query = query.eq("published", true);
  const { data, error } = await query;
  if (error) throw articlesError(error.message);
  return (data as ArticleRow[]).map(rowToArticle);
}

export async function getArticle(id: string): Promise<Article | null> {
  const client = getClient();
  const { data, error } = await client.from("articles").select("*").eq("id", id).maybeSingle();
  if (error) throw articlesError(error.message);
  return data ? rowToArticle(data as ArticleRow) : null;
}

export async function createArticle(input: Omit<Article, "id">): Promise<Article> {
  const client = getClient();
  const id = `art-${Date.now().toString(36)}`;
  const { data, error } = await client
    .from("articles")
    .insert({
      id,
      title: input.title,
      summary: input.summary,
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

export async function updateArticle(id: string, input: Omit<Article, "id">): Promise<Article | null> {
  const client = getClient();
  const { data, error } = await client
    .from("articles")
    .update({
      title: input.title,
      summary: input.summary,
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
