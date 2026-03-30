import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface Props {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: Props) => {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    toast.success('Adicionado ao carrinho! 🛍️', { duration: 1500 });
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div
      onClick={() => navigate(`/produto/${product.slug}`)}
      className="group bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.98] opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {discount && (
          <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-[13px] font-semibold text-foreground line-clamp-2 leading-snug mb-1.5">
          {product.name}
        </h3>
        {product.originalPrice && (
          <span className="text-[11px] text-muted-foreground line-through">
            R$ {product.originalPrice.toFixed(2)}
          </span>
        )}
        <div className="flex items-end justify-between mt-1">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[11px] font-medium text-primary">R$</span>
            <span className="text-lg font-extrabold text-foreground leading-none">
              {product.price.toFixed(2).split('.')[0]}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              ,{product.price.toFixed(2).split('.')[1]}
            </span>
          </div>
          <button
            onClick={handleAdd}
            className="bg-primary text-primary-foreground p-2 rounded-lg shadow-sm hover:bg-primary/90 transition-all duration-200 active:scale-90"
            aria-label="Adicionar ao carrinho"
          >
            <ShoppingBag size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
