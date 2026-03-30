import { Home, Search, ShoppingBag } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();

  const tabs = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/catalogo', icon: Search, label: 'Catálogo' },
    { path: '/carrinho', icon: ShoppingBag, label: 'Carrinho' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/50 md:hidden">
      <div className="flex items-center justify-around h-[68px] max-w-lg mx-auto px-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-2xl transition-all duration-300 relative ${active ? 'gradient-primary shadow-glow' : ''}`}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={`transition-all duration-300 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                />
                {label === 'Carrinho' && totalItems > 0 && (
                  <span className="absolute -top-2 -right-3 bg-white text-primary text-[9px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center shadow-sm">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className={`text-[10px] transition-all duration-300 ${active ? 'font-bold text-primary-foreground' : 'font-medium text-muted-foreground'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
