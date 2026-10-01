-- One-time content update for the 星育學苑 redesign: refreshes the top
-- menu and the small tagline next to the logo to match the new three
-- product lines. Everything else you've already customized (footer,
-- testimonials, FAQ/terms/privacy text, lead capture settings...) is left
-- untouched — this only touches data->nav->menu and data->brand->tagline.
--
-- Both fields stay fully editable afterwards in 後台 -> 網站內容, same as
-- always; this just sets a sensible starting value for them.
--
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

update public.site_content
set data = jsonb_set(
  jsonb_set(
    data,
    '{nav,menu}',
    '[
      {"label":"首頁","url":"/"},
      {"label":"大人的理財","url":"/adult-finance"},
      {"label":"小管家兒童理財","url":"/kids-finance"},
      {"label":"企業永續合作","url":"/enterprise"},
      {"label":"理財文章","url":"/articles"}
    ]'::jsonb
  ),
  '{brand,tagline}',
  '"大人的理財 × 小管家兒童理財 × 企業永續合作"'::jsonb
),
updated_at = now()
where id = 1;
