import { useState } from 'react';
import { ArrowLeft, Search, Package, Clock, CheckCircle, XCircle, Loader2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

interface OrderResult {
  id: string;
  external_reference: string;
  customer_name: string;
  payment_status: string | null;
  total: number;
  items: any;
  created_at: string;
}

const statusMap: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  approved: { label: 'Aprovado ✅', icon: <CheckCircle size={20} className="text-green-500" />, color: 'bg-green-500/10 text-green-600' },
  pending: { label: 'Pendente ⏳', icon: <Clock size={20} className="text-yellow-500" />, color: 'bg-yellow-500/10 text-yellow-600' },
  rejected: { label: 'Recusado', icon: <XCircle size={20} className="text-red-500" />, color: 'bg-red-500/10 text-red-600' },
  failure: { label: 'Falhou', icon: <XCircle size={20} className="text-red-500" />, color: 'bg-red-500/10 text-red-600' },
};

const OrderTracking = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const cleaned = query.trim();
    if (!cleaned) return;

    setLoading(true);
    setSearched(true);

    try {
      const digitsOnly = cleaned.replace(/\D/g, '');
      let results: OrderResult[] = [];

      if (digitsOnly.length === 11) {
        // Could be CPF or phone — try both
        const [phoneRes, cpfRes] = await Promise.all([
          supabase.rpc('search_orders_by_phone', { phone_query: digitsOnly.slice(-8) }),
          supabase.rpc('search_orders_by_cpf', { cpf_query: digitsOnly }),
        ]);
        const phoneData = (phoneRes.data as OrderResult[]) || [];
        const cpfData = (cpfRes.data as OrderResult[]) || [];
        // Merge unique results
        const seen = new Set<string>();
        results = [...cpfData, ...phoneData].filter(o => {
          if (seen.has(o.id)) return false;
          seen.add(o.id);
          return true;
        });
      } else if (digitsOnly.length >= 8) {
        const { data } = await supabase.rpc('search_orders_by_phone', { phone_query: digitsOnly.slice(-8) });
        results = (data as OrderResult[]) || [];
      } else {
        const { data } = await supabase.rpc('search_orders_by_reference', { ref_query: cleaned });
        results = (data as OrderResult[]) || [];
      }

      setOrders(results);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatus = (status: string | null) => {
    return statusMap[status || 'pending'] || statusMap.pending;
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <div className="max-w-xl mx-auto px-4 mt-4 animate-fade-in">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 font-medium">
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Acompanhar Pedido</h1>
            <p className="text-xs text-muted-foreground">Consulte o status da sua compra</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Seu telefone ou nº do pedido"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-3 bg-card border border-border/60 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="bg-primary text-primary-foreground px-5 py-3 rounded-2xl font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
          </button>
        </div>

        {/* Results */}
        {searched && !loading && orders.length === 0 && (
          <div className="text-center py-12">
            <Package size={40} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Nenhum pedido encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">Verifique o telefone ou número do pedido</p>
          </div>
        )}

        <div className="space-y-3">
          {orders.map((order) => {
            const st = getStatus(order.payment_status);
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <div key={order.id} className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Pedido</p>
                    <p className="text-sm font-bold font-mono text-foreground">{order.external_reference}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${st.color}`}>
                    {st.icon} {st.label}
                  </span>
                </div>

                <div className="border-t border-border/40 pt-3">
                  <p className="text-xs text-muted-foreground mb-1">Itens:</p>
                  {items.map((item: any, i: number) => (
                    <p key={i} className="text-sm text-foreground">
                      {item.quantity}x {item.name} — R$ {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </p>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                  <p className="text-sm font-extrabold text-foreground">R$ {Number(order.total).toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* WhatsApp help */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground mb-2">Precisa de ajuda?</p>
          <button
            onClick={() => window.open('https://wa.me/5562998755213?text=Olá! Gostaria de saber o status do meu pedido.', '_blank')}
            className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:brightness-110 transition-all"
          >
            <MessageCircle size={16} />
            Falar no WhatsApp
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default OrderTracking;
