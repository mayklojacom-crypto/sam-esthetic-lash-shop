import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Header />
        <div className="flex flex-col items-center justify-center px-4 pt-20 animate-fade-in">
          <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-5 animate-float">
            <ShoppingBag size={36} className="text-primary" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">Carrinho vazio</h2>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-[250px]">
            Que tal explorar nosso catálogo e adicionar alguns produtos?
          </p>
          <button
            onClick={() => navigate('/catalogo')}
            className="mt-7 bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-bold active:scale-[0.97] transition-all duration-200 shadow-md hover:shadow-lg hover:bg-primary/90 flex items-center gap-2.5 text-sm tracking-wide"
          >
            Ver Produtos <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-8">
      <Header />

      <div className="max-w-3xl mx-auto">
        <div className="px-4 mt-5 animate-fade-in">
          <h1 className="text-2xl font-extrabold text-foreground">Meu Carrinho</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} item(ns)</p>
        </div>

        <div className="px-4 mt-5 space-y-3">
          {items.map(({ product, quantity, selectedSize }, i) => {
            const cartKey = selectedSize ? `${product.id}__${selectedSize}` : product.id;
            return (
              <div
                key={cartKey}
                className="bg-card rounded-2xl border border-border/60 p-3.5 flex gap-3.5 shadow-card opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-[85px] h-[85px] rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[13px] font-semibold text-foreground line-clamp-2 leading-snug">{product.name}</h3>
                    {selectedSize && (
                      <span className="text-xs text-muted-foreground">Tamanho: {selectedSize}</span>
                    )}
                    <p className="text-base font-extrabold text-primary mt-1">R$ {product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-0.5 bg-secondary rounded-xl p-0.5 ring-1 ring-border/40">
                      <button
                        onClick={() => updateQuantity(cartKey, quantity - 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all hover:bg-muted"
                      >
                        <Minus size={13} strokeWidth={2.5} />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(cartKey, quantity + 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all hover:bg-muted"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(cartKey)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-full hover:bg-destructive/10"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer - fixed on mobile */}
        <div className="fixed bottom-[68px] left-0 right-0 bg-card/95 backdrop-blur-2xl border-t border-border/30 p-4 space-y-3 md:hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">Total</span>
            <span className="text-2xl font-extrabold text-primary">R$ {totalPrice.toFixed(2)}</span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg hover:bg-primary/90 flex items-center justify-center gap-2.5 text-[15px] tracking-wide"
          >
            Finalizar Pedido <ArrowRight size={17} strokeWidth={2.5} />
          </button>
        </div>

        {/* Desktop checkout footer */}
        <div className="hidden md:block px-4 mt-6">
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Total</span>
              <span className="text-2xl font-extrabold text-primary">R$ {totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg hover:bg-primary/90 flex items-center justify-center gap-2.5 text-[15px] tracking-wide"
            >
              Finalizar Pedido <ArrowRight size={17} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Cart;
