import { useNavigate } from 'react-router-dom';
import { Sparkles, Truck, MessageCircle, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';
import { products, categories } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const Index = () => {
  const navigate = useNavigate();
  const featured = products.filter(p => p.featured);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Header />

      <div className="max-w-6xl mx-auto">
        {/* Hero Banner */}
        <div className="mx-4 mt-4 rounded-2xl bg-card border border-border p-6 md:p-10 relative overflow-hidden animate-fade-in shadow-sm">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
          <div className="relative z-10 md:max-w-xl">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={14} className="text-primary" />
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Bem-vinda à</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-foreground">
              Sam Esthetic
            </h1>
            <p className="text-sm md:text-base mt-2 text-muted-foreground leading-relaxed">
              Materiais para Lash Design com os melhores preços do Brasil! 💜
            </p>
            <button
              onClick={() => navigate('/catalogo')}
              className="mt-5 bg-primary text-primary-foreground px-7 py-3 rounded-xl text-sm font-bold transition-all duration-200 shadow-sm hover:bg-primary/90 flex items-center gap-2"
            >
              Ver Produtos <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Trust Bar */}
        <div className="mx-4 mt-4 grid grid-cols-3 gap-3">
          {[
            { icon: <ShieldCheck size={18} />, text: 'Compra Segura' },
            { icon: <Truck size={18} />, text: 'Entrega Brasil' },
            { icon: <CreditCard size={18} />, text: 'Pix & Cartão' },
          ].map((item, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-3 flex flex-col items-center gap-1.5 text-center shadow-sm">
              <div className="text-primary">{item.icon}</div>
              <span className="text-[11px] font-semibold text-foreground">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Categories */}
        <section className="mt-7">
          <h2 className="text-lg font-bold px-4 mb-4 text-foreground">Categorias</h2>
          <div className="flex gap-2.5 overflow-x-auto px-4 pb-2 scrollbar-hide md:flex-wrap">
            {categories.filter(c => c.id !== 'todos').map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/catalogo?cat=${cat.id}`)}
                className="shrink-0 px-5 py-2.5 rounded-xl bg-card border border-border shadow-sm hover:border-primary/40 transition-all duration-200"
              >
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">{cat.label}</span>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>

        {/* Info Cards */}
        <section className="px-4 mt-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Truck size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Enviamos para todo o Brasil</p>
                <p className="text-xs text-muted-foreground mt-0.5">Frete calculado no checkout</p>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Atendimento via WhatsApp</p>
                <p className="text-xs text-muted-foreground mt-0.5">(62) 99875-5213</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 mb-24 md:mb-0 px-4">
          <div className="border-t border-border pt-8 pb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex flex-col items-center md:items-start gap-3">
                <img src="/logo.png" alt="Sam Esthetic" className="h-12 w-auto" />
                <p className="text-xs text-muted-foreground text-center md:text-left leading-relaxed max-w-[320px]">
                  Especialistas em materiais para Lash Design e Nail Designer. Qualidade premium com os melhores preços do Brasil.
                </p>
              </div>
              <div className="flex flex-col items-center md:items-end gap-4">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <a href="https://wa.me/5562998755213" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <MessageCircle size={18} />
                  </a>
                  <a href="https://www.instagram.com/sam_esthetic_" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  </a>
                </div>
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  © 2025 Sam Esthetic • Todos os direitos reservados
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
