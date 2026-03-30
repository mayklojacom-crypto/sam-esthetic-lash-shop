import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Package, DollarSign, ShoppingCart, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';

const statusColors: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-800',
  processando: 'bg-yellow-100 text-yellow-800',
  enviado: 'bg-indigo-100 text-indigo-800',
  entregue: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
  pending: 'bg-gray-100 text-gray-600',
  approved: 'bg-green-100 text-green-800',
  paid: 'bg-green-100 text-green-800',
};

const AdminDashboard = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('admin-orders?action=dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (error) throw error;
        setStats(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token]);

  if (loading) {
    return <div className="p-8 text-slate-500">Carregando...</div>;
  }

  const chartData = stats?.ordersByDay
    ? Object.entries(stats.ordersByDay).map(([date, count]) => ({
        date: date.slice(5), // MM-DD
        pedidos: count,
      }))
    : [];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pedidos', value: stats?.totalOrders || 0, icon: ShoppingCart, color: 'text-blue-600' },
          { label: 'Pedidos Hoje', value: stats?.todayOrders || 0, icon: Package, color: 'text-purple-600' },
          { label: 'Receita Total', value: `R$ ${(stats?.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: 'text-green-600' },
          { label: 'Visitas Hoje', value: stats?.todayVisits || 0, icon: Eye, color: 'text-orange-600' },
        ].map((card, i) => (
          <Card key={i} className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                </div>
                <card.icon size={28} className={card.color} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900 text-base">Pedidos — Últimos 7 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="pedidos" fill="hsl(272 60% 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-900 text-base">Últimos Pedidos</CardTitle>
          <button onClick={() => navigate('/admin/pedidos')} className="text-sm text-primary font-medium hover:underline">
            Ver todos →
          </button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Pedido</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Cliente</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Total</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.latestOrders?.map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-100 cursor-pointer hover:bg-slate-50"
                    onClick={() => navigate(`/admin/pedidos/${order.id}`)}
                  >
                    <td className="py-3 px-2 font-mono text-xs">{order.external_reference?.slice(0, 12)}</td>
                    <td className="py-3 px-2">{order.customer_name}</td>
                    <td className="py-3 px-2 font-medium">R$ {Number(order.total).toFixed(2)}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.order_status || 'novo']}`}>
                        {order.order_status || 'novo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
