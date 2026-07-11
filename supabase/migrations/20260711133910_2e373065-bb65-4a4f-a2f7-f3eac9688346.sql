
CREATE TABLE public.live_visitors (
  session_id uuid NOT NULL PRIMARY KEY,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_live_visitors_last_seen ON public.live_visitors(last_seen);
GRANT SELECT ON public.live_visitors TO anon, authenticated;
GRANT ALL ON public.live_visitors TO service_role;
ALTER TABLE public.live_visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view live visitors" ON public.live_visitors FOR SELECT USING (true);

CREATE TABLE public.visitor_peaks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  peak_date date NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  peak_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.visitor_peaks TO anon, authenticated;
GRANT ALL ON public.visitor_peaks TO service_role;
ALTER TABLE public.visitor_peaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visitor peaks" ON public.visitor_peaks FOR SELECT USING (true);
