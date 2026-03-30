import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowLeft, FileText } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [orderSent, setOrderSent] = useState(false);

  const status = searchParams.get('status') || searchParams.get('collection_status') || 'unknown';
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id') || '';

  useEffect(() => {
    const processOrder = async () => {
      if (status === 'approved' && !orderSent) {
        clearCart();

        try {
          const customerParam = searchParams.get('customer');
          const itemsParam = searchParams.get('items');

          if (customerParam && itemsParam) {
            const customer = JSON.parse(decodeURIComponent(customerParam));
            const items = JSON.parse(decodeURIComponent(itemsParam));

            const { data, error } = await supabase.functions.invoke('generate-order-pdf', {
              body: {
                items,
                customer,
                payment_id: paymentId,
                status,
                reference: `order_${Date.now()}`,
              },
            });

            if (!error && data?.pdfUrl) {
              setPdfUrl(data.pdfUrl);
              // Open WhatsApp with order details
              if (data.whatsappUrl) {
                window.open(data.whatsappUrl, '_blank');
              }
            }
          }
        } catch (err) {
          console.error('Error generating order PDF:', err);
        }

        setOrderSent(true);
      }
      setLoading(false);
    };

    processOrder();
  }, [status, paymentId]);

  const statusConfig: Record<string, { icon: React.ReactNode; title: string; description: string; color: string }> = {
    approved: {
      icon: <CheckCircle size={64} className="text-green-500" />,
      title: 'Pagamento Aprovado! 🎉',
      description: 'Seu pedido foi confirmado com sucesso. Você receberá atualizações pelo WhatsApp.',
      color: 'text-green-500',
    },
    pending: {
      icon: <Clock size={64} className="text-yellow-500" />,
      title: 'Pagamento Pendente',
      description: 'Seu pagamento está sendo processado. Assim que for confirmado, enviaremos os detalhes.',
      color: 'text-yellow-500',
    },
    failure: {
      icon: <XCircle size={64} className="text-red-500" />,
      title: 'Pagamento não aprovado',
      description: 'Houve um problema com o pagamento. Tente novamente ou escolha outra forma de pagamento.',
      color: 'text-red-500',
    },
    unknown: {
      icon: <Clock size={64} className="text-muted-foreground" />,
      title: 'Status desconhecido',
      description: 'Não foi possível identificar o status do pagamento.',
      color: 'text-muted-foreground',
    },
  };

  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="px-4 mt-4 animate-fade-in">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 font-medium">
          <ArrowLeft size={16} /> Voltar ao início
        </button>

        <div className="flex flex-col items-center text-center mt-8">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto" />
              <div className="h-6 w-48 bg-muted rounded mx-auto" />
              <div className="h-4 w-64 bg-muted rounded mx-auto" />
            </div>
          ) : (
            <>
              <div className="animate-fade-in-up">{config.icon}</div>
              <h1 className="text-2xl font-extrabold text-foreground mt-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                {config.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-3 max-w-sm animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                {config.description}
              </p>

              {paymentId && (
                <p className="text-xs text-muted-foreground mt-4 bg-card rounded-xl px-4 py-2 border border-border/60">
                  ID do pagamento: <span className="font-mono font-semibold">{paymentId}</span>
                </p>
              )}

              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm hover:brightness-110 transition-all animate-fade-in-up"
                  style={{ animationDelay: '0.3s' }}
                >
                  <FileText size={18} />
                  Ver PDF do Pedido
                </a>
              )}

              <div className="flex gap-3 mt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <button
                  onClick={() => navigate('/')}
                  className="bg-card border border-border/60 text-foreground px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-accent transition-all"
                >
                  Voltar ao Início
                </button>
                {status !== 'approved' && (
                  <button
                    onClick={() => navigate('/checkout')}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm hover:brightness-110 transition-all"
                  >
                    Tentar Novamente
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PaymentStatus;
