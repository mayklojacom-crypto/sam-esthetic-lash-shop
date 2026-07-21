import { useEffect, useState } from 'react';
import { X, Gift, Copy, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'exit_popup_shown';

interface PopupCoupon {
  code: string;
  discount_percent: number;
  title: string;
  subtitle: string;
  cta_text: string;
}

const ExitIntentPopup = () => {
  const { items } = useCart();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [coupon, setCoupon] = useState<PopupCoupon | null>(null);

  // Carrega cupom ativo do popup
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('coupons')
        .select('code, discount_percent, title, subtitle, cta_text')
        .eq('active', true)
        .eq('show_in_popup', true)
        .maybeSingle();
      if (data) setCoupon(data);
    })();
  }, []);

  useEffect(() => {
    if (!coupon) return;
    const blocked = ['/checkout', '/obrigado', '/admin', '/pagamento'];
    if (blocked.some(p => location.pathname.startsWith(p))) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const triggerByMouse = (e: MouseEvent) => {
      if (e.clientY < 10 && !sessionStorage.getItem(STORAGE_KEY)) {
        sessionStorage.setItem(STORAGE_KEY, '1');
        setOpen(true);
      }
    };

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
  }, [location.pathname, coupon]);

  if (!open || !coupon) return null;

  const copy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success('Cupom copiado! Use no checkout 🎉');
    setTimeout(() => setCopied(false), 3000);
  };

  const message = items.length > 0
    ? 'Não vá embora sem finalizar! Garantimos um desconto especial pra você:'
    : coupon.subtitle;

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
          {coupon.title}
        </h3>
        <p className="text-center text-sm text-muted-foreground mt-2 leading-relaxed">
          {message}
        </p>

        <div className="my-5 p-4 rounded-2xl border-2 border-dashed border-primary bg-primary/5">
          <p className="text-center text-xs text-muted-foreground mb-1">Use o cupom</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-extrabold text-primary tracking-wider">{coupon.code}</span>
          </div>
          <p className="text-center text-xs text-foreground mt-2 font-bold">
            {Number(coupon.discount_percent)}% OFF na sua compra
          </p>
        </div>

        <button
          onClick={copy}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md"
        >
          {copied ? <><Check size={18} /> Copiado!</> : <><Copy size={18} /> {coupon.cta_text}</>}
        </button>

        <p className="text-center text-[10px] text-muted-foreground mt-3">
          *Apresente o cupom ao finalizar pelo WhatsApp
        </p>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
