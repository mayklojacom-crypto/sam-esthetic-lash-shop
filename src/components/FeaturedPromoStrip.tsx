import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PromoStrip {
  id: string;
  image_url: string;
  link: string;
  alt: string;
}

const FeaturedPromoStrip = () => {
  const navigate = useNavigate();
  const [strip, setStrip] = useState<PromoStrip | null>(null);

  useEffect(() => {
    supabase
      .from('banners')
      .select('id, image_url, link, alt')
      .eq('placement', 'featured_strip')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setStrip(data));
  }, []);

  if (!strip?.image_url) return null;

  const openLink = () => {
    const destination = strip.link.trim();
    if (!destination) return;

    if (/^https?:\/\//i.test(destination)) {
      window.open(destination, '_blank', 'noopener,noreferrer');
      return;
    }

    navigate(destination.startsWith('/') ? destination : `/${destination}`);
  };

  const clickable = Boolean(strip.link.trim());

  return (
    <section className="mt-7 px-4" aria-label="Destaque promocional">
      <div
        className={`w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm ${clickable ? 'cursor-pointer transition-transform duration-200 hover:scale-[1.005] active:scale-[0.995]' : ''}`}
        onClick={clickable ? openLink : undefined}
        onKeyDown={clickable ? event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openLink();
          }
        } : undefined}
        role={clickable ? 'link' : undefined}
        tabIndex={clickable ? 0 : undefined}
      >
        <img
          src={strip.image_url}
          alt={strip.alt}
          className="block h-auto min-h-[82px] max-h-[220px] w-full object-cover md:min-h-0"
          loading="lazy"
        />
      </div>
    </section>
  );
};

export default FeaturedPromoStrip;