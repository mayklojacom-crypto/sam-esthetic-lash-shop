import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Zap } from 'lucide-react';
import type { Product } from '@/data/products';
import { useCountdown, pad } from '@/hooks/useCountdown';

interface Props {
  products: Product[];
}

const isLive = (p: Product) => {
  if (!p.promoActive || !p.promoEndsAt) return false;
  return new Date(p.promoEndsAt).getTime() > Date.now();
};

const OfferCard = ({ product }: { product: Product }) => {
  const navigate = useNavigate();
  const cd = useCountdown(product.promoEndsAt);
  if (!cd || cd.expired) return null;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const timeLabel =
    cd.d > 0
      ? `${cd.d}d ${pad(cd.h)}:${pad(cd.m)}:${pad(cd.s)}`
      : `${pad(cd.h)}:${pad(cd.m)}:${pad(cd.s)}`;

  return (
    <div
      onClick={() => navigate(`/produto/${product.slug}`)}
      className="group relative shrink-0 w-[75%] sm:w-[48%] md:w-full bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer active:scale-[0.98] snap-start border-2 border-white/60"
    >
      {/* Discount ribbon */}
      {discount && discount > 0 && (
        <div className="absolute top-0 left-0 z-10 bg-gradient-to-br from-red-500 to-orange-500 text-white font-black text-sm px-3 py-1.5 rounded-br-2xl shadow-md">
          -{discount}% OFF
        </div>
      )}

      {/* Pulsing "acaba em" tag */}
      <div className="absolute top-2 right-2 z-10 bg-black/85 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
        <Flame size={11} className="text-orange-400" />
        ACABA EM
      </div>

      <div className="aspect-square bg-muted overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      <div className="p-3 space-y-2">
        <h3 className="text-[13px] font-bold text-foreground line-clamp-2 leading-snug min-h-[34px]">
          {product.name}
        </h3>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-[length:200%_100%] animate-gradient-x text-white font-mono font-black text-sm py-1.5 rounded-lg shadow-inner tracking-wider">
          ⏰ {timeLabel}
        </div>

        <div className="flex items-end justify-between">
          <div>
            {product.originalPrice && (
              <span className="text-[10px] text-muted-foreground line-through block leading-none">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
            <div className="flex items-baseline gap-0.5">
              <span className="text-[10px] font-bold text-red-600">R$</span>
              <span className="text-xl font-black text-red-600 leading-none">
                {product.price.toFixed(2).split('.')[0]}
              </span>
              <span className="text-xs font-bold text-red-600">
                ,{product.price.toFixed(2).split('.')[1]}
              </span>
            </div>
          </div>
          <button
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-2 rounded-xl shadow-md hover:shadow-lg active:scale-90 transition-all"
            aria-label="Ver oferta"
          >
            <Zap size={16} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SuperOfferSection = ({ products }: Props) => {
  const [tick, setTick] = useState(0);
  // Re-filter every 30s to drop expired items
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const live = products.filter(isLive);
  if (live.length === 0) return null;

  return (
    <section
      key={tick}
      className="relative mt-6 mx-4 rounded-3xl overflow-hidden shadow-xl"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-pink-500 via-orange-500 to-red-600 bg-[length:200%_200%] animate-gradient-x" />
      {/* Sparkle texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1.5px), radial-gradient(circle at 80% 70%, white 1px, transparent 1.5px), radial-gradient(circle at 50% 90%, white 1.5px, transparent 2px)',
          backgroundSize: '80px 80px, 120px 120px, 100px 100px'
        }}
      />

      <div className="relative p-4 md:p-6">
        {/* Header */}
        <div className="text-center mb-4 md:mb-5">
          <div className="inline-flex items-center gap-2 bg-black/25 backdrop-blur-sm px-3 py-1 rounded-full mb-2">
            <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-white uppercase">
              ao vivo agora
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white leading-tight drop-shadow-lg">
            ⚡ SUPER OFERTAS RELÂMPAGO ⚡
          </h2>
          <p className="text-white/95 text-xs md:text-sm font-semibold mt-1">
            Promoções por tempo limitado — corra, amor! 💨
          </p>
        </div>

        {/* Cards */}
        <div className="md:hidden flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory">
          {live.map(p => (
            <OfferCard key={p.id} product={p} />
          ))}
        </div>
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-4">
          {live.map(p => (
            <OfferCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuperOfferSection;
