import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Minus, Plus, Share2 } from 'lucide-react';
import { useState } from 'react';
import { products } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

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
    if (product.sizes && !selectedSize) {
      toast.error('Selecione o tamanho antes de adicionar! 📏', {
        duration: 2000,
      });
      return;
    }
    for (let i = 0; i < qty; i++) addItem(product, selectedSize || undefined);
    toast.success(`${qty}x adicionado ao carrinho! 🛍️`, {
      duration: 1500,
      style: { background: 'hsl(272 60% 45%)', color: '#fff', border: 'none' },
    });
  };

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-8">
      <Header />

      <div className="max-w-5xl mx-auto">
        {/* Desktop: side by side. Mobile: stacked */}
        <div className="md:grid md:grid-cols-2 md:gap-8 md:px-4 md:mt-6">
          {/* Image */}
          <div className="relative animate-fade-in">
            <div className="aspect-square bg-muted overflow-hidden md:rounded-3xl">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent md:hidden" />
            <button
              onClick={() => navigate(-1)}
              className="absolute top-4 left-4 glass p-2.5 rounded-full shadow-elevated md:hidden"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              className="absolute top-4 right-4 glass p-2.5 rounded-full shadow-elevated md:hidden"
              onClick={() => {
                navigator.share?.({ title: product.name, url: window.location.href }).catch(() => {});
              }}
            >
              <Share2 size={20} />
            </button>
            {discount && (
              <span className="absolute bottom-6 left-4 md:top-4 md:left-4 md:bottom-auto gradient-accent text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md">
                -{discount}% OFF
              </span>
            )}
          </div>

          {/* Info */}
          <div className="px-4 -mt-4 relative z-10 animate-fade-in-up md:mt-0 md:px-0">
            {/* Desktop back button */}
            <button
              onClick={() => navigate(-1)}
              className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground mb-4 font-medium hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} /> Voltar
            </button>

            <div className="bg-card rounded-3xl border border-border/60 shadow-elevated p-5">
              <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
                {product.category}
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold text-foreground mt-1.5 leading-tight">{product.name}</h1>

              <div className="mt-4">
                {product.originalPrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    R$ {product.originalPrice.toFixed(2)}
                  </span>
                )}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-semibold text-primary">R$</span>
                  <span className="text-4xl font-extrabold text-foreground leading-none tracking-tight">
                    {product.price.toFixed(2).split('.')[0]}
                  </span>
                  <span className="text-lg font-bold text-foreground/70">
                    ,{product.price.toFixed(2).split('.')[1]}
                  </span>
                </div>
              </div>

              <div className="h-px bg-border/60 my-4" />

              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>

              {/* Size selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mt-5">
                  <span className="text-sm font-semibold text-foreground">Tamanho</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                          selectedSize === size
                            ? 'border-primary bg-primary text-primary-foreground shadow-md'
                            : 'border-border bg-secondary text-foreground hover:border-primary/50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center justify-between mt-6">
                <span className="text-sm font-semibold text-foreground">Quantidade</span>
                <div className="flex items-center gap-1 bg-secondary rounded-full p-1">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-all active:scale-90"
                  >
                    <Minus size={15} strokeWidth={2.5} />
                  </button>
                  <span className="text-sm font-bold w-8 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-all active:scale-90"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Desktop add button */}
              <button
                onClick={handleAdd}
                className="hidden md:flex w-full mt-6 bg-primary text-primary-foreground py-4 rounded-2xl font-bold items-center justify-center gap-2.5 active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg hover:bg-primary/90 text-[15px] tracking-wide"
              >
                <ShoppingBag size={19} strokeWidth={2.5} />
                Adicionar — R$ {(product.price * qty).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Add Button */}
      <div className="fixed bottom-[68px] left-0 right-0 p-4 glass-strong border-t border-border/50 md:hidden">
        <button
          onClick={handleAdd}
          className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg hover:bg-primary/90 text-[15px] tracking-wide"
        >
          <ShoppingBag size={19} strokeWidth={2.5} />
          Adicionar — R$ {(product.price * qty).toFixed(2)}
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProductDetail;
