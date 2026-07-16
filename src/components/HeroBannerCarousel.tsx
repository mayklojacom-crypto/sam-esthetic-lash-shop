import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import bannerAgenda from '@/assets/banner-agenda-continuar.png.asset.json';
import bannerPedeRecebe from '@/assets/banner-pede-recebe-hoje.png.asset.json';
import bannerQueridinhas from '@/assets/banner-queridinhas-colas.png.asset.json';

interface Banner {
  id: string;
  image_url: string;
  link: string;
  alt: string;
}

const fallback: Banner[] = [
  { id: 'f1', image_url: bannerAgenda.url, alt: 'Tudo para sua agenda continuar', link: '/catalogo' },
  { id: 'f2', image_url: bannerPedeRecebe.url, alt: 'Pede agora e recebe hoje', link: '/catalogo' },
  { id: 'f3', image_url: bannerQueridinhas.url, alt: 'As queridinhas da lash', link: '/catalogo?cat=colas' },
];

const HeroBannerCarousel = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [banners, setBanners] = useState<Banner[]>(fallback);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('banners')
        .select('id, image_url, link, alt')
        .eq('active', true)
        .order('sort_order', { ascending: true });
      if (data && data.length) setBanners(data as Banner[]);
    })();
  }, []);

  const next = useCallback(() => setCurrent(i => (i + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setCurrent(i => (i - 1 + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (!banners.length) return null;

  return (
    <div className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm relative group md:max-w-3xl md:mx-auto">
      <div className="relative w-full overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((b) => (
            <img
              key={b.id}
              src={b.image_url}
              alt={b.alt}
              className="w-full h-auto object-cover flex-shrink-0 cursor-pointer rounded-2xl"
              onClick={() => navigate(b.link)}
              style={{ minWidth: '100%' }}
            />
          ))}
        </div>
      </div>

      <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronLeft size={20} />
      </button>
      <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-5' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBannerCarousel;
