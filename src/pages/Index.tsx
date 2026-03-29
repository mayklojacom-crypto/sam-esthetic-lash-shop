import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Truck, MessageCircle } from 'lucide-react';
import { products, categories } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const Index = () => {
  const navigate = useNavigate();
  const featured = products.filter(p => p.featured);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {/* Hero Banner */}
      <div className="mx-4 mt-4 rounded-3xl gradient-primary p-6 text-primary-foreground relative overflow-hidden animate-fade-in">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={14} className="animate-pulse-soft" />
            <p className="text-xs font-semibold uppercase tracking-widest opacity-90">Bem-vinda à</p>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">
            Sam Esthetic
          </h1>
          <p className="text-sm mt-2 opacity-90 leading-relaxed font-light">
            Materiais para Lash Design com os melhores preços da região! 💜
          </p>
          <button
            onClick={() => navigate('/catalogo')}
            className="mt-5 bg-white text-foreground px-7 py-3 rounded-full text-sm font-bold active:scale-[0.97] transition-all duration-200 shadow-lg hover:shadow-xl ring-1 ring-black/5 tracking-wide"
          >
            Ver Produtos →
          </button>
        </div>
      </div>

      {/* Search */}
      <button
        onClick={() => navigate('/catalogo')}
        className="mx-4 mt-5 flex items-center gap-3 w-[calc(100%-2rem)] bg-card rounded-2xl px-4 py-3.5 text-muted-foreground border border-border/60 shadow-card hover:shadow-elevated transition-all duration-300 opacity-0 animate-fade-in stagger-1"
      >
        <Search size={18} className="text-primary" />
        <span className="text-sm">Buscar produtos...</span>
      </button>

      {/* Categories */}
      <section className="mt-7 opacity-0 animate-fade-in stagger-2">
        <h2 className="text-lg font-bold px-4 mb-4 text-foreground">Categorias</h2>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {categories.filter(c => c.id !== 'todos').map((cat, i) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/catalogo?cat=${cat.id}`)}
              className="flex flex-col items-center gap-2.5 min-w-[76px] group"
            >
              <div className="w-16 h-16 rounded-2xl bg-card border border-border/60 flex items-center justify-center text-2xl shadow-card group-hover:shadow-elevated group-hover:scale-105 transition-all duration-300">
                {cat.icon}
              </div>
              <span className="text-xs font-semibold text-foreground">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mt-7 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">🔥 Destaques</h2>
          <button onClick={() => navigate('/catalogo')} className="text-xs text-primary font-bold uppercase tracking-wider hover:opacity-80 transition-opacity">
            Ver todos →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* Info Cards */}
      <section className="px-4 mt-7 space-y-3 opacity-0 animate-fade-in-up stagger-4">
        <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow">
            <Truck size={20} className="text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Entrega para toda a região</p>
            <p className="text-xs text-muted-foreground mt-0.5">Consulte condições pelo WhatsApp</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Atendimento via WhatsApp</p>
            <p className="text-xs text-muted-foreground mt-0.5">(62) 99875-5213</p>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
};

export default Index;
