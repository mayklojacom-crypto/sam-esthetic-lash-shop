import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Minus, Plus, Share2 } from 'lucide-react';
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pb-20 animate-fade-in">
        <p className="text-4xl mb-3">😕</p>
        <p className="text-muted-foreground font-medium">Produto não encontrado</p>
        <button onClick={() => navigate('/catalogo')} className="mt-4 text-primary font-semibold text-sm">
          ← Voltar ao catálogo
        </button>
        <BottomNav />
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product);
    toast.success(`${qty}x adicionado ao carrinho! 🛍️`, {
      duration: 1500,
      style: { background: 'hsl(272 60% 45%)', color: '#fff', border: 'none' },
    });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Image */}
      <div className="relative animate-fade-in">
        <div className="aspect-square bg-muted overflow-hidden">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 glass p-2.5 rounded-full shadow-elevated"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          className="absolute top-4 right-4 glass p-2.5 rounded-full shadow-elevated"
          onClick={() => {
            navigator.share?.({ title: product.name, url: window.location.href }).catch(() => {});
          }}
        >
          <Share2 size={20} />
        </button>
        {discount && (
          <span className="absolute bottom-6 left-4 gradient-accent text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md">
            -{discount}% OFF
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-4 -mt-4 relative z-10 animate-fade-in-up">
        <div className="bg-card rounded-3xl border border-border/60 shadow-elevated p-5">
          <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
            {product.category}
          </span>
          <h1 className="text-xl font-extrabold text-foreground mt-1.5 leading-tight">{product.name}</h1>

          <div className="flex items-baseline gap-3 mt-4">
            <span className="text-3xl font-extrabold text-gradient">R$ {product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="h-px bg-border/60 my-4" />

          <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>

          {/* Quantity */}
          <div className="flex items-center justify-between mt-6">
            <span className="text-sm font-semibold text-foreground">Quantidade</span>
            <div className="flex items-center gap-1 bg-secondary rounded-full p-1">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors active:scale-90"
              >
                <Minus size={15} />
              </button>
              <span className="text-sm font-bold w-8 text-center">{qty}</span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors active:scale-90"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <div className="fixed bottom-[68px] left-0 right-0 p-4 glass-strong border-t border-border/50">
        <button
          onClick={handleAdd}
          className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all duration-300 shadow-glow text-[15px]"
        >
          <ShoppingBag size={19} />
          Adicionar — R$ {(product.price * qty).toFixed(2)}
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProductDetail;
