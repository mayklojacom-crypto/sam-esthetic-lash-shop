import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { products, categories } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const Index = () => {
  const navigate = useNavigate();
  const featured = products.filter(p => p.featured);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      {/* Hero Banner */}
      <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary to-accent p-5 text-primary-foreground">
        <p className="text-xs font-medium uppercase tracking-wider opacity-90">Bem-vinda à</p>
        <h1 className="text-2xl font-bold mt-1">Sam Esthetic</h1>
        <p className="text-sm mt-2 opacity-90 leading-relaxed">
          Materiais para Lash Design com os melhores preços da região! 💜
        </p>
        <button
          onClick={() => navigate('/catalogo')}
          className="mt-4 bg-card text-foreground px-5 py-2.5 rounded-full text-sm font-semibold active:scale-95 transition-transform"
        >
          Ver Produtos
        </button>
      </div>

      {/* Search */}
      <button
        onClick={() => navigate('/catalogo')}
        className="mx-4 mt-4 flex items-center gap-3 w-[calc(100%-2rem)] bg-secondary rounded-xl px-4 py-3 text-muted-foreground"
      >
        <Search size={18} />
        <span className="text-sm">Buscar produtos...</span>
      </button>

      {/* Categories */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold px-4 mb-3">Categorias</h2>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {categories.filter(c => c.id !== 'todos').map(cat => (
            <button
              key={cat.id}
              onClick={() => navigate(`/catalogo?cat=${cat.id}`)}
              className="flex flex-col items-center gap-2 min-w-[72px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-2xl shadow-sm">
                {cat.icon}
              </div>
              <span className="text-xs font-medium text-foreground">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Destaques</h2>
          <button onClick={() => navigate('/catalogo')} className="text-sm text-primary font-medium">
            Ver todos
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {featured.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="mx-4 mt-6 rounded-2xl bg-secondary p-5">
        <p className="text-sm font-semibold text-secondary-foreground">🚚 Entrega para toda a região</p>
        <p className="text-xs text-muted-foreground mt-1">
          Consulte as condições de frete pelo WhatsApp
        </p>
      </section>

      <BottomNav />
    </div>
  );
};

export default Index;
