import { Link } from 'react-router-dom';
import type { Product } from '@/data/products';
import { Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  product: Product;
  label?: string;
}

const InlineProductPickCard = ({ product, label = 'a queridinha pra isso 💗' }: Props) => {
  const price = product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return (
    <aside
      className="not-prose my-8 relative rounded-3xl p-4 md:p-5 bg-gradient-to-br from-lilac/60 via-pink-soft/30 to-white border-2 border-dashed border-primary/30 shadow-pink"
      aria-label="Produto indicado"
    >
      <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-primary/20 text-primary rounded-full px-2.5 py-1 text-[11px] font-semibold mb-3 shadow-sm">
        <Sparkles size={12} /> {label}
      </div>
      <Link
        to={`/produto/${product.slug}`}
        className="group flex gap-3 md:gap-4 items-center"
      >
        <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-white border border-lilac/60 shadow-sm">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-primary/70 font-semibold">
            dica da Sam
          </p>
          <h4 className="font-bold text-foreground leading-tight line-clamp-2 text-base md:text-lg mt-0.5">
            {product.name}
          </h4>
          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-baseline gap-1.5">
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-muted-foreground line-through">
                  {product.originalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              )}
              <span className="text-lg md:text-xl font-bold text-primary">{price}</span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary bg-white/80 rounded-full px-3 py-1.5 group-hover:gap-2 transition-all shadow-sm">
              ver produto <ArrowRight size={14} />
            </span>
          </div>
          <span className="sm:hidden mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
            ver produto <ArrowRight size={12} />
          </span>
        </div>
      </Link>
    </aside>
  );
};

export default InlineProductPickCard;
