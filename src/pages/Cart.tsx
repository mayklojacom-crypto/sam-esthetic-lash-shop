import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="flex flex-col items-center justify-center px-4 pt-20">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
            <ShoppingBag size={32} className="text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Carrinho vazio</h2>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Adicione produtos para começar sua compra!
          </p>
          <button
            onClick={() => navigate('/catalogo')}
            className="mt-6 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
          >
            Ver Produtos
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-36">
      <Header />

      <div className="px-4 mt-4">
        <h1 className="text-xl font-bold text-foreground">Meu Carrinho</h1>
        <p className="text-sm text-muted-foreground mt-1">{items.length} item(ns)</p>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="bg-card rounded-xl border border-border p-3 flex gap-3">
            <img
              src={product.image}
              alt={product.name}
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground line-clamp-2">{product.name}</h3>
              <p className="text-base font-bold text-primary mt-1">R$ {product.price.toFixed(2)}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 bg-secondary rounded-full px-1 py-0.5">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-semibold w-5 text-center">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(product.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">R$ {totalPrice.toFixed(2)}</span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold active:scale-[0.98] transition-transform"
        >
          Finalizar Pedido
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Cart;
