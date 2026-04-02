import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowRight, ShieldCheck, CreditCard, Sparkles, Leaf } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import whatsappIcon from '@/assets/whatsapp-icon.png';
import heroBanner from '@/assets/hero-banner.jpg';
import promoMaster from '@/assets/promo-master-beauty.png';
import promoProtagonista from '@/assets/promo-protagonista.png';
import { products, categories } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const Index = () => {
  const navigate = useNavigate();
  const featured = products.filter(p => p.featured);

  // Track visit once per session
  useEffect(() => {
    if (sessionStorage.getItem('visit_tracked')) return;
    sessionStorage.setItem('visit_tracked', '1');
    supabase.functions.invoke('track-visit').catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Header />

      <div className="max-w-6xl mx-auto">
        {/* Hero Banner */}
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden animate-fade-in shadow-sm cursor-pointer" onClick={() => navigate('/catalogo')}>
          <img src={heroBanner} alt="Bem-Vinda à SAM Esthetic — Sua Fonte de Materiais Premium para Lash e Estética" className="w-full h-auto object-cover rounded-2xl" />
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

        {/* Promoções de Outono */}
        <section className="mt-10 px-4">
          <div className="flex items-center gap-2 mb-5">
            <Leaf size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">🍂 Promoções de Outono — Edição Limitada</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Kit 1 — Master Beauty Set */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden group">
              <div className="overflow-hidden">
                <img src={promoMaster} alt="Kit Master Beauty Set: O Poder do Olhar" className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300" />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Edição Limitada</span>
                  <Sparkles size={14} className="text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground leading-snug">Kit Master Beauty Set: O Poder do Olhar 👁️✨</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mais que um kit, uma seleção estratégica para a Lash que deseja entregar resultados de elite. Reunimos o que há de melhor em tecnologia de fios e precisão de pinças.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>💎 Mix de Fios Fadvan: 4D Duplo, YY e 6D</li>
                  <li>💎 Pinças Nagaraku N-07 e NH-12</li>
                  <li>💎 Cola One Cherry — retenção máxima</li>
                  <li>💎 Espelho Princesa + descartáveis completos</li>
                </ul>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-muted-foreground line-through">R$ 529,00</span>
                  <span className="text-lg font-extrabold text-primary">R$ 307,00</span>
                </div>
                <a
                  href="https://wa.me/5562998755213?text=Ol%C3%A1!%20Tenho%20interesse%20no%20Kit%20Master%20Beauty%20Set%20por%20R%24307,00"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-primary text-primary-foreground font-bold text-sm py-3 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Garantir meu Kit via WhatsApp
                </a>
              </div>
            </div>

            {/* Kit 2 — Coleção Protagonista */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden group">
              <div className="overflow-hidden">
                <img src={promoProtagonista} alt="Coleção Protagonista — Edição Alta Performance" className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300" />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Apenas 50 kits</span>
                  <Sparkles size={14} className="text-destructive" />
                </div>
                <h3 className="text-base font-bold text-foreground leading-snug">Coleção Protagonista — Edição Alta Performance 🏆</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Chegou para elevar o nível dos seus atendimentos. Reunimos os materiais mais desejados pelas profissionais que não abrem mão de qualidade e acabamento impecável.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>📦 Cílios Brasileiro YY (8mm, 10mm, 12mm)</li>
                  <li>📦 Cílios 5D Fadvan W (8mm, 10mm, 12mm)</li>
                  <li>📦 Cola HS 16 (3g) — Alta retenção</li>
                  <li>📦 Pads, Microbrushes, Escovinhas, Lip Gloss</li>
                  <li>📦 Fitas: Micropore branca + Transpore transparente</li>
                </ul>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-muted-foreground line-through">R$ 489,90</span>
                  <span className="text-lg font-extrabold text-primary">R$ 297,00</span>
                </div>
                <a
                  href="https://wa.me/5562998755213?text=Ol%C3%A1!%20Tenho%20interesse%20no%20Kit%20Cole%C3%A7%C3%A3o%20Protagonista%20por%20R%24297,00"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-primary text-primary-foreground font-bold text-sm py-3 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Garantir meu Kit via WhatsApp
                </a>
              </div>
            </div>
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
                <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
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
                    <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
                  </a>
                  <a href="https://www.instagram.com/sam_estheticoficial" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
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
