import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

const ProductCard = ({ product }: { product: Product }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    toast.success('Adicionado ao carrinho!', { duration: 1500 });
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div
      onClick={() => navigate(`/produto/${product.id}`)}
      className="bg-card rounded-xl border border-border overflow-hidden shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="relative aspect-square bg-muted">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        {discount && (
          <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight mb-2">{product.name}</h3>
        <div className="flex items-end justify-between">
          <div>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through block">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-lg font-bold text-primary">R$ {product.price.toFixed(2)}</span>
          </div>
          <button
            onClick={handleAdd}
            className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition-colors active:scale-95"
            aria-label="Adicionar ao carrinho"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
