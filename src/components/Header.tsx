import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Início' },
    { path: '/catalogo', label: 'Catálogo' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-2xl border-b border-border/40 shadow-sm">
      <div className="flex items-center justify-between h-16 md:h-[72px] px-4 max-w-6xl mx-auto">
        {/* Mobile: hamburger left */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors md:hidden"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Desktop: logo LEFT */}
        <button onClick={() => navigate('/')} className="hidden md:flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="Sam Esthetic" className="h-14 w-auto" />
        </button>

        {/* Mobile: logo CENTER */}
        <button onClick={() => navigate('/')} className="flex items-center absolute left-1/2 -translate-x-1/2 md:hidden">
          <img src="/logo.png" alt="Sam Esthetic" className="h-12 w-auto" />
        </button>

        {/* Desktop nav links (center) */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ path, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive(path)
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Cart (right) */}
        <button
          onClick={() => navigate('/carrinho')}
          className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <ShoppingBag size={20} className="text-foreground" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-scale-in">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/30 bg-card/95 backdrop-blur-2xl animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ path, label }) => (
              <button
                key={path}
                onClick={() => { navigate(path); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(path)
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
