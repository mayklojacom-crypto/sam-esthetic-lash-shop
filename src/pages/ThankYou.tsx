import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ShoppingBag, MessageCircle, ArrowLeft, Package, Heart } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const ThankYou = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('pedido') || '';

  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'Purchase');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <div className="max-w-xl mx-auto px-4 mt-6 animate-fade-in">
        {/* Success Icon */}
        <div className="flex flex-col items-center text-center mt-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center animate-fade-in-up">
              <CheckCircle size={56} className="text-green-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart size={16} className="text-primary fill-primary" />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mt-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Obrigada pela sua compra! 🎉
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-sm animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Seu pedido foi recebido com sucesso! Estamos preparando tudo com muito carinho para você.
          </p>
        </div>

        {/* Order Info Card */}
        {orderId && (
          <div className="mt-6 bg-card border border-border/60 rounded-2xl p-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Número do pedido</p>
                <p className="text-sm font-bold font-mono text-foreground">{orderId}</p>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="mt-6 space-y-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-sm font-bold text-foreground">Próximos passos:</h2>

          <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-4">
            {[
              { step: '1', text: 'Vamos confirmar seu pedido via WhatsApp' },
              { step: '2', text: 'Preparamos seus produtos com cuidado' },
              { step: '3', text: 'Você receberá o código de rastreio' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {item.step}
                </span>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <button
            onClick={() => window.open('https://wa.me/5562998755213?text=Olá! Acabei de fazer um pedido e gostaria de acompanhar.', '_blank')}
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:brightness-110 transition-all shadow-md"
          >
            <MessageCircle size={18} />
            Falar com a SAM no WhatsApp
          </button>

          <button
            onClick={() => navigate('/catalogo')}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-2xl font-bold text-sm hover:brightness-110 transition-all"
          >
            <ShoppingBag size={18} />
            Continuar Comprando
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 bg-card border border-border/60 text-foreground px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-accent transition-all"
          >
            <ArrowLeft size={16} />
            Voltar ao Início
          </button>
        </div>

        {/* Footer Message */}
        <p className="text-center text-xs text-muted-foreground mt-8 mb-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          Qualquer dúvida, estamos à disposição pelo WhatsApp 💜
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default ThankYou;
