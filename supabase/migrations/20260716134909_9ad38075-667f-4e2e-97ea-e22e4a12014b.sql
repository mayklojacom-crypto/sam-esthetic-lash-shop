
-- Blog posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  cover_image text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft', -- draft | published
  published_at timestamptz,
  meta_title text NOT NULL DEFAULT '',
  meta_description text NOT NULL DEFAULT '',
  related_product_ids uuid[] NOT NULL DEFAULT '{}',
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' AND published_at IS NOT NULL AND published_at <= now());

CREATE INDEX idx_blog_posts_published ON public.blog_posts (published_at DESC) WHERE status = 'published';

CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_posts_updated_at();

-- Blog comments
CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.blog_comments TO anon, authenticated;
GRANT ALL ON public.blog_comments TO service_role;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved comments"
  ON public.blog_comments FOR SELECT
  USING (approved = true);

CREATE POLICY "Anyone can create a comment"
  ON public.blog_comments FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_blog_comments_post ON public.blog_comments (post_id, created_at DESC);
