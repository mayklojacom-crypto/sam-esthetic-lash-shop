import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const Header = () => {
  const navigate = useNavigate();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 glass-strong">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="w-10" />
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <img src="/logo.png" alt="Sam Esthetic" className="h-10 w-auto drop-shadow-sm" />
        </button>
        <button
          onClick={() => navigate('/carrinho')}
          className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <ShoppingBag size={20} className="text-foreground" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 gradient-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-glow animate-scale-in">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
