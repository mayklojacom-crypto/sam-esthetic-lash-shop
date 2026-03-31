import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, MessageCircle, FileText, Save, Truck } from 'lucide-react';

const statusOptions = ['novo', 'processando', 'enviado', 'entregue', 'cancelado'];

const statusColors: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-800',
  processando: 'bg-yellow-100 text-yellow-800',
  enviado: 'bg-indigo-100 text-indigo-800',
  entregue: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

const AdminOrderDetail = () => {
  const { id } = useParams();
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('novo');
  const [trackingCode, setTrackingCode] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(`admin-orders?action=get&id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (error) throw error;
        setOrder(data);
        setStatus(data.order_status || 'novo');
        setTrackingCode(data.tracking_code || '');
      } catch {
        toast.error('Erro ao carregar pedido');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-orders?action=update', {
        headers: { Authorization: `Bearer ${token}` },
        body: { id, order_status: status, tracking_code: trackingCode },
      });
      if (error) throw error;
      setOrder(data);
      toast.success('Pedido atualizado!');
    } catch {
      toast.error('Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const openWhatsApp = () => {
    if (!order) return;
    const phone = order.customer_phone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá ${order.customer_name}! Aqui é da Sam Esthetic. Seu pedido ${order.external_reference} está com status: *${status}*.${trackingCode ? `\n\nCódigo de rastreio: *${trackingCode}*` : ''}`
    );
    window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
  };

  if (loading) return <div className="p-8 text-slate-500">Carregando...</div>;
  if (!order) return <div className="p-8 text-slate-500">Pedido não encontrado</div>;

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl">
      <button onClick={() => navigate('/admin/pedidos')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pedido #{order.external_reference?.slice(0, 12)}</h1>
          <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColors[status]}`}>
          {status}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base text-slate-900">Dados do Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-slate-500">Nome:</span> <span className="font-medium">{order.customer_name}</span></div>
            <div><span className="text-slate-500">Telefone:</span> <span className="font-medium">{order.customer_phone}</span></div>
            {order.customer_cpf && <div><span className="text-slate-500">CPF:</span> <span className="font-medium">{order.customer_cpf}</span></div>}
            <div><span className="text-slate-500">Endereço:</span> <span className="font-medium">{order.customer_address}</span></div>
            {order.customer_notes && <div><span className="text-slate-500">Observações:</span> <span className="font-medium">{order.customer_notes}</span></div>}
          </CardContent>
        </Card>

        {/* Status & Tracking */}
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base text-slate-900">Status & Rastreio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1.5">Status do Pedido</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-500 mb-1.5">Código de Rastreio</label>
              <div className="flex gap-2">
                <Input
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Ex: BR123456789BR"
                  className="bg-white border-slate-200"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save size={16} className="mr-1" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button onClick={openWhatsApp} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                <MessageCircle size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base text-slate-900">Itens do Pedido</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-slate-500 font-medium">Produto</th>
                  <th className="text-left py-2 text-slate-500 font-medium">Qtd</th>
                  <th className="text-left py-2 text-slate-500 font-medium">Preço</th>
                  <th className="text-left py-2 text-slate-500 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-3">
                      <div className="font-medium">{item.title || item.name}</div>
                      {item.curvature && <div className="text-xs text-slate-400">Curvatura: {item.curvature}</div>}
                    </td>
                    <td className="py-3">{item.quantity}</td>
                    <td className="py-3">R$ {Number(item.unit_price || item.price).toFixed(2)}</td>
                    <td className="py-3 font-medium">R$ {(Number(item.unit_price || item.price) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td colSpan={3} className="py-3 font-bold text-right">Total:</td>
                  <td className="py-3 font-bold text-lg">R$ {Number(order.total).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment info */}
          <div className="mt-4 flex gap-4 text-sm text-slate-500 flex-wrap">
            <span>Pagamento: <span className={`font-medium ${order.payment_status === 'approved' || order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>{order.payment_status || 'pendente'}</span></span>
            {order.pdf_url && (
              <a href={order.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <FileText size={14} /> Ver PDF
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrderDetail;
