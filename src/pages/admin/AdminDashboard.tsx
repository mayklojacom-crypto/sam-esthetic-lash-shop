import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Package, DollarSign, ShoppingCart, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

const statusColors: Record<string, string> = {
  novo: 'bg-blue-50 text-blue-700 border border-blue-200',
  processando: 'bg-amber-50 text-amber-700 border border-amber-200',
  enviado: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  entregue: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelado: 'bg-red-50 text-red-700 border border-red-200',
  pending: 'bg-slate-50 text-slate-600 border border-slate-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  processando: 'Processando',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
  pending: 'Pendente',
  approved: 'Aprovado',
  paid: 'Pago',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 px-4 py-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.name === 'Receita' ? `R$ ${Number(p.value).toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  );
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
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const ordersChartData = stats?.ordersByDay
    ? Object.entries(stats.ordersByDay).map(([date, count]) => {
        const d = new Date(date);
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return {
          date: `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`,
          pedidos: count as number,
        };
      })
    : [];

  const visitsChartData = stats?.visits
    ? [...stats.visits].reverse().slice(-14).map((v: any) => {
        const d = new Date(v.visit_date);
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return {
          date: `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`,
          visitas: v.visit_count,
        };
      })
    : [];

  const totalVisits = stats?.visits?.reduce((s: number, v: any) => s + v.visit_count, 0) || 0;

  const statCards = [
    {
      label: 'Total de Vendas',
      value: `R$ ${(stats?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Total de Pedidos',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Pedidos Hoje',
      value: stats?.todayOrders || 0,
      icon: Package,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Visitas Hoje',
      value: stats?.todayVisits || 0,
      subtitle: `${totalVisits} total`,
      icon: Eye,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Visão geral da sua loja</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-slate-500 truncate">{card.label}</p>
                  <p className="text-lg md:text-2xl font-bold text-slate-900 mt-1 truncate">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-[10px] md:text-xs text-slate-400 mt-0.5">{card.subtitle}</p>
                  )}
                </div>
                <div className={`${card.iconBg} p-2 md:p-2.5 rounded-xl flex-shrink-0 ml-2`}>
                  <card.icon size={18} className={card.iconColor} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Orders Chart */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm md:text-base font-semibold text-slate-900">Pedidos</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Últimos 7 dias</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full">
                <TrendingUp size={14} className="text-emerald-500" />
                <span className="text-xs font-medium text-slate-600">
                  {ordersChartData.reduce((s, d) => s + d.pedidos, 0)} pedidos
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ordersChartData}>
                <defs>
                  <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(272, 60%, 50%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(272, 60%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="pedidos"
                  name="Pedidos"
                  stroke="hsl(272, 60%, 50%)"
                  strokeWidth={2.5}
                  fill="url(#orderGradient)"
                  dot={{ r: 4, fill: 'white', stroke: 'hsl(272, 60%, 50%)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'hsl(272, 60%, 50%)', stroke: 'white', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Visits Chart */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm md:text-base font-semibold text-slate-900">Visitas</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Últimos 14 dias</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full">
                <Eye size={14} className="text-blue-500" />
                <span className="text-xs font-medium text-slate-600">
                  {totalVisits} total
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={visitsChartData}>
                <defs>
                  <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="visitas"
                  name="Visitas"
                  stroke="hsl(210, 80%, 55%)"
                  strokeWidth={2.5}
                  fill="url(#visitGradient)"
                  dot={{ r: 4, fill: 'white', stroke: 'hsl(210, 80%, 55%)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'hsl(210, 80%, 55%)', stroke: 'white', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm md:text-base font-semibold text-slate-900">Últimos Pedidos</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Pedidos mais recentes</p>
          </div>
          <button
            onClick={() => navigate('/admin/pedidos')}
            className="text-xs md:text-sm text-primary font-medium hover:underline bg-primary/5 px-3 py-1.5 rounded-full transition-colors hover:bg-primary/10"
          >
            Ver todos →
          </button>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Mobile: card list */}
          <div className="md:hidden space-y-3">
            {stats?.latestOrders?.map((order: any) => (
              <div
                key={order.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 active:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/pedidos/${order.id}`)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] text-slate-400">
                    #{order.external_reference?.slice(0, 8)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[order.order_status || 'novo']}`}>
                    {statusLabels[order.order_status || 'novo']}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800 truncate mr-2">{order.customer_name}</span>
                  <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                    R$ {Number(order.total).toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Pedido</th>
                  <th className="text-left py-3 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Cliente</th>
                  <th className="text-left py-3 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Data</th>
                  <th className="text-right py-3 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Total</th>
                  <th className="text-center py-3 px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.latestOrders?.map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-50 cursor-pointer hover:bg-slate-50/80 transition-colors"
                    onClick={() => navigate(`/admin/pedidos/${order.id}`)}
                  >
                    <td className="py-3.5 px-3 font-mono text-xs text-slate-500">#{order.external_reference?.slice(0, 8)}</td>
                    <td className="py-3.5 px-3 font-medium text-slate-800">{order.customer_name}</td>
                    <td className="py-3.5 px-3 text-xs text-slate-400">
                      {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold text-slate-900">R$ {Number(order.total).toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium ${statusColors[order.order_status || 'novo']}`}>
                        {statusLabels[order.order_status || 'novo']}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!stats?.latestOrders || stats.latestOrders.length === 0) && (
            <div className="text-center py-8">
              <ShoppingCart size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Nenhum pedido ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
