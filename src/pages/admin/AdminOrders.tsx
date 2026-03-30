import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const statusColors: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-800',
  processando: 'bg-yellow-100 text-yellow-800',
  enviado: 'bg-indigo-100 text-indigo-800',
  entregue: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

const statusFilters = ['todos', 'novo', 'processando', 'enviado', 'entregue', 'cancelado'];

const AdminOrders = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: 'list', page: String(page) });
      if (statusFilter !== 'todos') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const { data, error } = await supabase.functions.invoke(`admin-orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Pedidos</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone ou pedido..."
              className="pl-9 bg-white border-slate-200"
            />
          </div>
          <Button type="submit" variant="outline" className="border-slate-200">Buscar</Button>
        </form>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Pedido</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium hidden md:table-cell">Telefone</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Total</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium hidden md:table-cell">Data</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">Carregando...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">Nenhum pedido encontrado</td></tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => navigate(`/admin/pedidos/${order.id}`)}
                    >
                      <td className="py-3 px-4 font-mono text-xs">{order.external_reference?.slice(0, 12)}</td>
                      <td className="py-3 px-4 font-medium">{order.customer_name}</td>
                      <td className="py-3 px-4 hidden md:table-cell text-slate-500">{order.customer_phone}</td>
                      <td className="py-3 px-4 font-medium">R$ {Number(order.total).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[order.order_status || 'novo']}`}>
                          {order.order_status || 'novo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-slate-500 text-xs">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200">
              <span className="text-sm text-slate-500">{total} pedidos</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={16} />
                </Button>
                <span className="flex items-center text-sm text-slate-600">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrders;
