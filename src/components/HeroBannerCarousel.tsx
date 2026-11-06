import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
// Bundled with the site build so they load on any host (Hostinger included).
import bannerAgenda from '@/assets/banner-agenda-continuar.jpg';
import bannerPedeRecebe from '@/assets/banner-pede-recebe-hoje.jpg';
import bannerQueridinhas from '@/assets/banner-queridinhas-colas.jpg';
import bannerAgenda768 from '@/assets/banner-agenda-continuar-768.v1.webp';
import bannerAgenda1440 from '@/assets/banner-agenda-continuar-1440.v1.webp';
import bannerPedeRecebe768 from '@/assets/banner-pede-recebe-hoje-768.v1.webp';
import bannerPedeRecebe1440 from '@/assets/banner-pede-recebe-hoje-1440.v1.webp';
import bannerQueridinhas768 from '@/assets/banner-queridinhas-colas-768.v1.webp';
import bannerQueridinhas1440 from '@/assets/banner-queridinhas-colas-1440.v1.webp';

interface Banner {
  id: string;
  image_url: string;
  image_mobile_url?: string | null;
  link: string;
  alt: string;
  /** Local WebP srcset for bundled fallback art only; remote banners are used as-is. */
  webpSrcSet?: string;
}

const fallback: Banner[] = [
  { id: 'f1', image_url: bannerAgenda, webpSrcSet: `${bannerAgenda768} 768w, ${bannerAgenda1440} 1440w`, alt: 'Tudo para sua agenda continuar', link: '/catalogo' },
  { id: 'f2', image_url: bannerPedeRecebe, webpSrcSet: `${bannerPedeRecebe768} 768w, ${bannerPedeRecebe1440} 1440w`, alt: 'Pede agora e recebe hoje', link: '/catalogo' },
  { id: 'f3', image_url: bannerQueridinhas, webpSrcSet: `${bannerQueridinhas768} 768w, ${bannerQueridinhas1440} 1440w`, alt: 'As queridinhas da lash', link: '/catalogo?cat=colas' },
];

const HeroBannerCarousel = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [banners, setBanners] = useState<Banner[] | null>(null);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('id, image_url, image_mobile_url, link, alt')
        .eq('placement', 'hero')
        .eq('active', true)
        .order('sort_order', { ascending: true });
      if (!active) return;
      if (error) console.warn('Banners indisponíveis; usando artes da loja.', error);
      setBanners(data && data.length ? (data as Banner[]) : fallback);
    })();
    return () => { active = false; };
  }, []);

  // Drop slides whose image failed to load; if every managed banner fails, show the bundled artwork.
  const visible = (() => {
    if (!banners) return [];
    const ok = banners.filter(b => !failed.has(b.id));
    if (ok.length) return ok;
    return fallback.filter(b => !failed.has(b.id));
  })();

  const handleError = (b: Banner) => {
    console.warn('Imagem de banner falhou ao carregar:', b.id);
    setFailed(prev => new Set(prev).add(b.id));
  };

  const count = visible.length;
  const next = useCallback(() => setCurrent(i => (count ? (i + 1) % count : 0)), [count]);
  const prev = useCallback(() => setCurrent(i => (count ? (i - 1 + count) % count : 0)), [count]);

  useEffect(() => { if (current >= count) setCurrent(0); }, [count, current]);

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, count]);

  // Reserved space while loading, so the page does not jump.
  if (!banners) {
    return (
      <div className="mx-4 mt-4 md:max-w-3xl md:mx-auto" role="status" aria-label="Carregando destaques">
        <div className="w-full aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!count) return null;

  return (
    <div className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm relative group md:max-w-3xl md:mx-auto bg-muted">
      <div className="relative w-full overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {visible.map((b, i) => (
            <picture key={b.id} className="block min-w-full">
              {b.image_mobile_url && <source media="(max-width: 767px)" srcSet={b.image_mobile_url} />}
              {b.webpSrcSet && <source type="image/webp" srcSet={b.webpSrcSet} sizes="(min-width: 768px) 768px, 100vw" />}
              <img
                src={b.image_url}
                alt={b.alt}
                width={1448}
                height={1086}
                // High priority only for the first banner; the rest load lazily.
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding={i === 0 ? 'sync' : 'async'}
                {...(i === 0 ? { fetchpriority: 'high' } : {})}
                className="w-full h-auto object-cover cursor-pointer rounded-2xl"
                onClick={() => navigate(b.link || '/catalogo')}
                onError={() => handleError(b)}
              />
            </picture>
          ))}
        </div>
      </div>

      {count > 1 && <>
        <button onClick={prev} aria-label="Banner anterior" className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/30 hover:bg-foreground/50 text-background rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronLeft size={20} />
        </button>
        <button onClick={next} aria-label="Próximo banner" className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/30 hover:bg-foreground/50 text-background rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight size={20} />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {visible.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setCurrent(i)}
              aria-label={`Ir para banner ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-background w-5' : 'bg-background/50'}`}
            />
          ))}
        </div>
      </>}
    </div>
  );
};

export default HeroBannerCarousel;
