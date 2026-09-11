-- Run this once in the Supabase dashboard: Project → SQL Editor → New query → paste → Run.
-- Creates the two tables the site needs and seeds them with the courses/banners
-- that were previously hardcoded in db.json, so the live site keeps working
-- through the cutover.

create table if not exists public.courses (
  id text primary key,
  type text not null check (type in ('physical', 'online')),
  title text not null default '',
  category text not null default '',
  price integer not null default 0,
  description text not null default '',
  image text not null default '',
  tags jsonb not null default '[]'::jsonb,
  location text not null default '',
  duration text not null default '',
  details text not null default '',
  start_date text not null default '',
  end_date text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.site_config (
  id integer primary key default 1,
  home_banners jsonb not null default '[]'::jsonb,
  physical_banner text not null default '',
  online_banner text not null default '',
  updated_at timestamptz not null default now(),
  constraint site_config_single_row check (id = 1)
);

-- Row Level Security: only the server (using the service_role key, which
-- bypasses RLS entirely) can write. Anyone can read, in case a future
-- feature calls Supabase directly from the browser with the anon key.
alter table public.courses enable row level security;
alter table public.site_config enable row level security;

drop policy if exists "Public read access" on public.courses;
create policy "Public read access" on public.courses for select using (true);

drop policy if exists "Public read access" on public.site_config;
create policy "Public read access" on public.site_config for select using (true);

-- Seed data (safe to re-run: upserts by primary key).
insert into public.courses (id, type, title, category, price, description, image, tags, location, duration, details, start_date, end_date)
values
  (
    'phy-1', 'physical', '【寒假營隊】小小巴菲特兒童理財創客營', '冬令營 / 實體活動', 8800,
    '透過情境模擬桌遊、實體貨幣交易與零用錢規劃，引導孩子建立正確金錢觀念與儲蓄思維。',
    'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?auto=format&fit=crop&q=80&w=800',
    '["理財啟蒙", "情境桌遊", "小學 1-6 年級"]'::jsonb,
    '台北市大安區教育中心', '5 天全日營',
    '專為國教學童設計的生活化理財營隊，藉由「虛擬小小社會體驗」、「日常記帳手作帳本」及「理性消費大挑戰」，讓孩子在趣味互動中學會珍惜資源、分辨「需要」與「想要」，培養受用一生的財務素養。',
    '2025-01-20', '2025-01-24'
  ),
  (
    'phy-2', 'physical', '【週末實體】小小創業家商業探索與拍賣工作坊', '週末常態班', 4200,
    '讓孩子學習商品定價、成本概念與行銷拍賣，動手設計攤位，體驗真實商業運作樂趣。',
    'https://images.unsplash.com/photo-1556742049-0a67e5572293?auto=format&fit=crop&q=80&w=800',
    '["商業思維", "拍賣實戰", "創意美學"]'::jsonb,
    '新北市板橋教室', '4 週（每週六上午）',
    '融合數學應用與商業啟蒙，教導小朋友認識成本與利潤、規劃商品行銷策略，並親自主持創意拍賣會，提升口語表達與團隊協作能力。',
    '2025-03-01', '2025-03-22'
  ),
  (
    'on-1', 'online', '【線上月訂閱】生活中的金錢魔法：兒童理財素養課', '線上訂閱', 599,
    '每週解鎖全新趣味理財動畫與生活任務，陪伴孩子養成自律儲蓄與智慧消費好習慣！',
    'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&q=80&w=800',
    '["每月扣款", "隨時觀看", "課後任務"]'::jsonb,
    '', '每月 4 堂影音 + 生活實踐任務',
    '不限時間地點，專為學童打造的啟蒙理財動畫課。內容涵蓋貨幣歷史、零用錢管理三罐法、家庭預算小幫手等主題，每週搭配趣味互動任務，由助教線上鼓勵與指導。',
    '', ''
  ),
  (
    'on-2', 'online', '【線上月訂閱】小小管家智慧記帳與未來財商思維班', '線上訂閱', 799,
    '從日常記帳工具操作到數位支付觀念，結合線上互動社群，培育未來數位金融競爭力！',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
    '["每月扣款", "專屬社群", "直播 Q&A"]'::jsonb,
    '', '每月 4 堂教學 + 每週線上答疑',
    '結合專屬小管家數位記帳系統與生活案例剖析，建立資產與負債概念、防範詐騙知識及現代數位消費觀念，每月舉辦線上互動工作坊解答學童疑惑。',
    '', ''
  )
on conflict (id) do nothing;

insert into public.site_config (id, home_banners, physical_banner, online_banner)
values (
  1,
  '[
    {"image": "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?auto=format&fit=crop&q=80&w=1600", "linkUrl": "/physical-courses"},
    {"image": "https://www.anuefund.com/Upload/Files/IndexBanner/Ad/1903x530_pc_20250730093235973021.jpg", "linkUrl": "/online-courses"},
    {"image": "https://drive.google.com/file/d/1gEneP9TbpPKy79uIbRj-45UhDvSDVOM7/view?usp=drive_link", "linkUrl": "/physical-courses"}
  ]'::jsonb,
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=1600'
)
on conflict (id) do nothing;
