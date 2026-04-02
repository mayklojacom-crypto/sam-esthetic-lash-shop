import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import bannerMasterBeauty from '@/assets/banner-master-beauty.jpg';
import heroBanner from '@/assets/hero-banner.jpg';

const banners = [
  { src: bannerMasterBeauty, alt: 'Kit Master Beauty Set — Outono Premium Lash Collection', link: '/produto/kit-master-beauty-set' },
  { src: heroBanner, alt: 'Bem-Vinda à SAM Esthetic — Sua Fonte de Materiais Premium', link: '/catalogo' },
];

const HeroBannerCarousel = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent(i => (i + 1) % banners.length), []);
  const prev = useCallback(() => setCurrent(i => (i - 1 + banners.length) % banners.length), []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm relative group">
      <div className="relative w-full overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((b, i) => (
            <img
              key={i}
              src={b.src}
              alt={b.alt}
              className="w-full h-auto object-cover flex-shrink-0 cursor-pointer rounded-2xl"
              onClick={() => navigate(b.link)}
              style={{ minWidth: '100%' }}
            />
          ))}
        </div>
      </div>

      {/* Arrows */}
      <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronLeft size={20} />
      </button>
      <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
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
