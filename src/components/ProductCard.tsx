import { ShoppingBag, Heart } from 'lucide-react';
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
    toast.success('Adicionado ao carrinho! 🛍️', {
      duration: 1500,
      style: { background: 'hsl(272 60% 45%)', color: '#fff', border: 'none' },
    });
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div
      onClick={() => navigate(`/produto/${product.id}`)}
      className={`group bg-card rounded-2xl border border-border/60 overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer active:scale-[0.97] opacity-0 animate-fade-in-up`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {discount && (
          <span className="absolute top-2.5 left-2.5 gradient-accent text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md animate-scale-in">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="text-[13px] font-semibold text-foreground line-clamp-2 leading-snug mb-2.5">
          {product.name}
        </h3>
        <div className="flex items-end justify-between">
          <div>
            {product.originalPrice && (
              <span className="text-[11px] text-muted-foreground line-through block mb-0.5">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-lg font-extrabold text-gradient">
              R$ {product.price.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleAdd}
            className="gradient-primary text-primary-foreground p-2.5 rounded-xl shadow-glow hover:shadow-elevated transition-all duration-300 active:scale-90"
            aria-label="Adicionar ao carrinho"
          >
            <ShoppingBag size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
