import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { products } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground">Produto não encontrado</p>
        <BottomNav />
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product);
    toast.success(`${qty}x adicionado ao carrinho!`, { duration: 1500 });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Image */}
      <div className="relative">
        <div className="aspect-square bg-muted">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm p-2 rounded-full shadow-md"
        >
          <ArrowLeft size={20} />
        </button>
        {discount && (
          <span className="absolute top-4 right-4 bg-accent text-accent-foreground text-sm font-bold px-3 py-1 rounded-full">
            -{discount}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pt-4">
        <span className="text-xs font-medium text-primary uppercase tracking-wider">
          {product.category}
        </span>
        <h1 className="text-xl font-bold text-foreground mt-1">{product.name}</h1>

        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-2xl font-bold text-primary">R$ {product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              R$ {product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{product.description}</p>

        {/* Quantity */}
        <div className="flex items-center gap-4 mt-6">
          <span className="text-sm font-medium text-foreground">Quantidade:</span>
          <div className="flex items-center gap-3 bg-secondary rounded-full px-1 py-1">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm font-semibold w-6 text-center">{qty}</span>
            <button
              onClick={() => setQty(q => q + 1)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t border-border">
        <button
          onClick={handleAdd}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <ShoppingBag size={18} />
          Adicionar — R$ {(product.price * qty).toFixed(2)}
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProductDetail;
