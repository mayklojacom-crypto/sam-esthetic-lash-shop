import { useEffect, useState } from 'react';
import { X, Gift, Copy, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const STORAGE_KEY = 'exit_popup_shown';
const COUPON = 'RECUPERA10';

const ExitIntentPopup = () => {
  const { items } = useCart();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Não mostra em checkout / obrigado / admin
    const blocked = ['/checkout', '/obrigado', '/admin', '/pagamento'];
    if (blocked.some(p => location.pathname.startsWith(p))) return;

    // Já mostrado nesta sessão? (sessionStorage para reaparecer em nova visita)
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    // Só dispara se já tem algo no carrinho OU já passou tempo suficiente no site
    const triggerByMouse = (e: MouseEvent) => {
      if (e.clientY < 10 && !sessionStorage.getItem(STORAGE_KEY)) {
        sessionStorage.setItem(STORAGE_KEY, '1');
        setOpen(true);
      }
    };

    // Em mobile (sem mouseleave confiável): após 45s
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem(STORAGE_KEY)) {
        sessionStorage.setItem(STORAGE_KEY, '1');
        setOpen(true);
      }
    }, 45000);

    document.addEventListener('mouseleave', triggerByMouse);
    return () => {
      document.removeEventListener('mouseleave', triggerByMouse);
      clearTimeout(timer);
    };
  }, [location.pathname]);

  if (!open) return null;

  const copy = () => {
    navigator.clipboard.writeText(COUPON);
    setCopied(true);
    toast.success('Cupom copiado! Use no checkout 🎉');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative bg-card rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-border animate-scale-in">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg animate-float">
            <Gift size={32} className="text-white" />
          </div>
        </div>

        <h3 className="text-2xl font-extrabold text-center text-foreground leading-tight">
          Espera! 🎁
        </h3>
        <p className="text-center text-sm text-muted-foreground mt-2 leading-relaxed">
          {items.length > 0
            ? 'Não vá embora sem finalizar! Garantimos um desconto especial pra você:'
            : 'Antes de sair, leve um cupom exclusivo de boas-vindas:'}
        </p>

        <div className="my-5 p-4 rounded-2xl border-2 border-dashed border-primary bg-primary/5">
          <p className="text-center text-xs text-muted-foreground mb-1">Use o cupom</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-extrabold text-primary tracking-wider">{COUPON}</span>
          </div>
          <p className="text-center text-xs text-foreground mt-2 font-bold">10% OFF na sua compra</p>
        </div>

        <button
          onClick={copy}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md"
        >
          {copied ? <><Check size={18} /> Copiado!</> : <><Copy size={18} /> Copiar Cupom</>}
        </button>

        <p className="text-center text-[10px] text-muted-foreground mt-3">
          *Apresente o cupom ao finalizar pelo WhatsApp
        </p>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
