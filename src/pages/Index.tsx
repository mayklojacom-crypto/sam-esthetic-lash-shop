import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck, CreditCard, Leaf } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import whatsappIcon from '@/assets/whatsapp-icon.png';
import HeroBannerCarousel from '@/components/HeroBannerCarousel';
import WelcomeStrip from '@/components/WelcomeStrip';
import promoMaster from '@/assets/promo-master-beauty.png';
import promoProtagonista from '@/assets/promo-protagonista.png';
import { categories } from '@/data/products';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import UrgencyBar from '@/components/UrgencyBar';
import SuperOfferSection from '@/components/SuperOfferSection';

// Stickers (só decorativos, só mobile)
import stHeart from '@/assets/stickers/heart.png';
import stBow from '@/assets/stickers/bow.png';
import stStar from '@/assets/stickers/star.png';
import stCoffee from '@/assets/stickers/coffee.png';
import stLash from '@/assets/stickers/lash.png';
import stLashzinha from '@/assets/stickers/lashzinha.png';

const Index = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const featured = products.filter(p => p.featured);

  useEffect(() => {
    if (sessionStorage.getItem('visit_tracked')) return;
    sessionStorage.setItem('visit_tracked', '1');
    supabase.functions.invoke('track-visit').catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <UrgencyBar />
      <Header />

      <div className="max-w-6xl mx-auto">
        {/* Boas-vindas afetiva (só mobile) */}
        <WelcomeStrip />

        {/* Hero Banner — sticker Lashzinha ao lado, fora do banner */}
        <div className="relative">
          <HeroBannerCarousel />
          <img
            src={stLashzinha}
            alt=""
            aria-hidden="true"
            className="sticker sticker-tilt-r absolute -top-2 -right-2 w-14 h-14 md:w-20 md:h-20 md:-top-6 md:-right-4 z-10"
            loading="lazy"
          />
        </div>

        {/* Super Ofertas Relâmpago (produtos com cronômetro ativo) */}
        <SuperOfferSection products={products} />

        {/* Trust Bar */}
        <div className="mx-4 mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: <ShieldCheck size={18} />, text: 'Segurinha 🔒' },
            { icon: <Truck size={18} />, text: 'Vai pro Brasil 📦' },
            { icon: <CreditCard size={18} />, text: 'Pix & Cartão 💳' },
          ].map((item, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-3 flex flex-col items-center gap-1.5 text-center shadow-sm">
              <div className="text-primary">{item.icon}</div>
              <span className="text-[11px] font-semibold text-foreground">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Categorias */}
        <section className="mt-8">
          <div className="px-4 mb-4 flex items-center gap-3">
            <h2 className="font-hand text-3xl md:text-4xl text-primary leading-none">o que você tá procurando, amor?</h2>
            <img src={stCoffee} alt="" aria-hidden="true" className="sticker sticker-tilt-r w-10 h-10 md:w-14 md:h-14 shrink-0" loading="lazy" />
          </div>
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

        {/* Kits Promocionais */}
        <section className="mt-8 px-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Leaf size={16} className="text-primary shrink-0" />
            <h2 className="font-hand text-3xl md:text-4xl text-primary leading-none">mimos da estação 🍂</h2>
            <img src={stBow} alt="" aria-hidden="true" className="sticker sticker-tilt-l w-10 h-10 md:w-14 md:h-14 shrink-0" loading="lazy" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Edição Limitada</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Kit 1 */}
            <div
              onClick={() => navigate('/produto/kit-master-beauty-set')}
              className="group bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-pink transition-all duration-300 cursor-pointer active:scale-[0.98] flex flex-col"
            >
              <div className="relative aspect-square bg-muted overflow-hidden">
                <img src={promoMaster} alt="Kit Master Beauty Set" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Kit Premium</span>
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h4 className="text-[13px] font-semibold text-foreground line-clamp-2 leading-snug mb-1">Master Beauty Set 👁️✨</h4>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">Fios Fadvan, Pinças Nagaraku, Cola Cherry + acessórios.</p>
                <div className="mt-auto">
                  <span className="text-[10px] text-muted-foreground line-through">R$ 529,00</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[11px] font-medium text-primary">R$</span>
                    <span className="text-lg font-extrabold text-foreground leading-none">307</span>
                    <span className="text-xs font-bold text-muted-foreground">,00</span>
                  </div>
                  <button className="mt-2 w-full bg-gradient-to-r from-accent to-primary text-white py-1.5 rounded-lg font-bold text-[11px] active:scale-95 transition-all">
                    Quero esse 💕
                  </button>
                </div>
              </div>
            </div>

            {/* Kit 2 */}
            <div
              onClick={() => navigate('/produto/kit-colecao-protagonista')}
              className="group bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-pink transition-all duration-300 cursor-pointer active:scale-[0.98] flex flex-col"
            >
              <div className="relative aspect-square bg-muted overflow-hidden">
                <img src={promoProtagonista} alt="Coleção Protagonista" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">Só 50 kits</span>
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h4 className="text-[13px] font-semibold text-foreground line-clamp-2 leading-snug mb-1">Coleção Protagonista 🏆</h4>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">Cílios YY + 5D, Cola HS 16, Pads, Microbrushes e mais.</p>
                <div className="mt-auto">
                  <span className="text-[10px] text-muted-foreground line-through">R$ 489,90</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[11px] font-medium text-primary">R$</span>
                    <span className="text-lg font-extrabold text-foreground leading-none">297</span>
                    <span className="text-xs font-bold text-muted-foreground">,00</span>
                  </div>
                  <button className="mt-2 w-full bg-gradient-to-r from-accent to-primary text-white py-1.5 rounded-lg font-bold text-[11px] active:scale-95 transition-all">
                    Quero esse 💕
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Queridinhos da casa (destaques) */}
        <section className="mt-8 px-4">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img src={stHeart} alt="" aria-hidden="true" className="sticker sticker-tilt-l w-10 h-10 md:w-14 md:h-14 shrink-0" loading="lazy" />
              <h2 className="font-hand text-3xl md:text-4xl text-primary leading-none truncate">os queridinhos da casa 💕</h2>
            </div>
            <button onClick={() => navigate('/catalogo')} className="text-xs text-primary font-bold uppercase tracking-wider hover:opacity-80 transition-opacity shrink-0">
              Ver todos →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>

        {/* Prateleiras por categoria */}
        {categories
          .filter(c => c.id !== 'todos' && c.id !== 'kits')
          .map((cat, catIdx) => {
            const items = products.filter(p => p.category === cat.id).slice(0, 8);
            if (items.length === 0) return null;
            const decor = [stStar, stLash, stHeart, stBow][catIdx % 4];
            const tilt = catIdx % 2 === 0 ? 'sticker-tilt-r' : 'sticker-tilt-l';
            return (
              <section key={cat.id} className="mt-8 px-4">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={decor} alt="" aria-hidden="true" className={`sticker ${tilt} w-10 h-10 md:w-12 md:h-12 shrink-0`} loading="lazy" />
                    <h2 className="font-hand text-3xl md:text-4xl text-primary leading-none truncate">{cat.label.toLowerCase()}</h2>
                  </div>
                  <button
                    onClick={() => navigate(`/catalogo?cat=${cat.id}`)}
                    className="text-xs text-primary font-bold uppercase tracking-wider hover:opacity-80 transition-opacity shrink-0"
                  >
                    Ver todos →
                  </button>
                </div>
                <div className="md:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
                  {items.map((p, i) => (
                    <div key={p.id} className="shrink-0 w-[46%] snap-start">
                      <ProductCard product={p} index={i} />
                    </div>
                  ))}
                </div>
                <div className="hidden md:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                  {items.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              </section>
            );
          })}


        {/* Comunidade Lash */}
        <section className="mt-10 px-4 relative">

          <div className="rounded-3xl gradient-girly p-5 shadow-pink relative overflow-hidden">
            <img src={stStar} alt="" aria-hidden="true" className="sticker sticker-tilt-l absolute -top-3 -left-3 w-14 h-14" loading="lazy" />
            <img src={stHeart} alt="" aria-hidden="true" className="sticker sticker-tilt-r absolute -bottom-3 -right-3 w-14 h-14" loading="lazy" />
            <h3 className="font-hand text-3xl text-primary leading-none text-center mb-1">faz parte da nossa turma 💕</h3>
            <p className="text-center text-[12px] text-foreground/70 mb-4">bora ficar por dentro de tudo, linda?</p>
            <div className="grid grid-cols-3 gap-2">
              <a
                href="https://www.instagram.com/sam_estheticoficial"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/70 backdrop-blur rounded-2xl p-3 flex flex-col items-center gap-1 active:scale-95 transition-transform"
              >
                <span className="text-2xl">📸</span>
                <span className="text-[10px] font-bold text-foreground text-center leading-tight">Insta<br/>@sam_esthetic</span>
              </a>
              <a
                href="https://wa.me/5562998755213?text=Oi!%20Quero%20entrar%20na%20lista%20VIP%20do%20WhatsApp%20💗"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/70 backdrop-blur rounded-2xl p-3 flex flex-col items-center gap-1 active:scale-95 transition-transform"
              >
                <span className="text-2xl">💬</span>
                <span className="text-[10px] font-bold text-foreground text-center leading-tight">Lista VIP<br/>no zap</span>
              </a>
              <a
                href="https://www.instagram.com/sam_estheticoficial"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/70 backdrop-blur rounded-2xl p-3 flex flex-col items-center gap-1 active:scale-95 transition-transform"
              >
                <span className="text-2xl">✨</span>
                <span className="text-[10px] font-bold text-foreground text-center leading-tight">Dicas de<br/>lash pro</span>
              </a>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="mt-8 px-4">
          <button
            onClick={() => navigate('/catalogo')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent to-primary text-white font-extrabold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-[0.99] transition-all"
          >
            Vem ver o catálogo inteirinho →
          </button>
        </section>

        {/* Info Cards */}
        <section className="px-4 mt-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Truck size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Enviamos pro Brasil todinho 💗</p>
                <p className="text-xs text-muted-foreground mt-0.5">Frete calculado no checkout</p>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Chama no zap, amor</p>
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
                <p className="font-hand text-xl text-primary">feito com 💗 em Goiânia</p>
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
