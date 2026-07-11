import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Package, DollarSign, ShoppingCart, Eye, TrendingUp, TrendingDown, CalendarIcon, MessageCircle, Target } from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import LiveVisitorsCard from '@/components/admin/LiveVisitorsCard';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  novo: 'Novo', processando: 'Processando', enviado: 'Enviado', entregue: 'Entregue',
  cancelado: 'Cancelado', pending: 'Pendente', approved: 'Aprovado', paid: 'Pago',
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

type PresetKey = 'today' | '7d' | '14d' | '30d' | 'custom';

function computeRange(preset: PresetKey, custom?: DateRange): { from: Date; to: Date } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === 'today') return { from: startOfToday, to: now };
  if (preset === '7d') return { from: new Date(now.getTime() - 6 * 86400000), to: now };
  if (preset === '14d') return { from: new Date(now.getTime() - 13 * 86400000), to: now };
  if (preset === '30d') return { from: new Date(now.getTime() - 29 * 86400000), to: now };
  if (preset === 'custom' && custom?.from) {
    return { from: custom.from, to: custom.to || custom.from };
  }
  return { from: new Date(now.getTime() - 6 * 86400000), to: now };
}

const AdminDashboard = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<PresetKey>('7d');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const range = useMemo(() => computeRange(preset, customRange), [preset, customRange]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const fromStr = format(range.from, 'yyyy-MM-dd');
        const toStr = format(range.to, 'yyyy-MM-dd');
        const { data, error } = await supabase.functions.invoke(
          `admin-orders?action=dashboard&from=${fromStr}&to=${toStr}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (error) throw error;
        setStats(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token, range.from, range.to]);

  const ordersChartData = stats?.ordersByDay
    ? Object.entries(stats.ordersByDay).map(([date, count]) => {
        const d = new Date(date + 'T12:00:00');
        return {
          date: format(d, 'dd/MM'),
          pedidos: count as number,
        };
      })
    : [];

  const visitsChartData = stats?.visits
    ? stats.visits.map((v: any) => ({
        date: format(new Date(v.visit_date + 'T12:00:00'), 'dd/MM'),
        visitas: v.visit_count,
      }))
    : [];

  const leadsChartData = stats?.leadsByDay
    ? Object.entries(stats.leadsByDay).map(([date, count]) => ({
        date: format(new Date(date + 'T12:00:00'), 'dd/MM'),
        leads: count as number,
      }))
    : [];

  const formatDelta = (delta: number | undefined) => {
    if (delta === undefined || delta === null || !isFinite(delta)) return null;
    const rounded = Math.round(delta);
    const isUp = rounded >= 0;
    return { text: `${isUp ? '+' : ''}${rounded}%`, isUp };
  };

  const statCards = [
    {
      label: 'Vendas',
      value: `R$ ${(stats?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      delta: formatDelta(stats?.revenueDelta),
    },
    {
      label: 'Pedidos iniciados',
      value: stats?.totalLeads || 0,
      subtitle: 'Clicaram no WhatsApp',
      icon: MessageCircle,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      delta: formatDelta(stats?.leadsDelta),
    },
    {
      label: 'Pedidos pagos (Pix)',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      delta: formatDelta(stats?.ordersDelta),
    },
    {
      label: 'Taxa de conversão',
      value: `${(stats?.conversionRate || 0).toFixed(1)}%`,
      subtitle: 'Pedidos / Visitas',
      icon: Target,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Visitas',
      value: stats?.totalVisits || 0,
      subtitle: `${stats?.todayVisits || 0} hoje`,
      icon: Eye,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      delta: formatDelta(stats?.visitsDelta),
    },
    {
      label: 'Pedidos hoje',
      value: stats?.todayOrders || 0,
      icon: Package,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  ];

  const periodLabel = preset === 'custom' && customRange?.from
    ? `${format(customRange.from, 'dd/MM')} - ${format(customRange.to || customRange.from, 'dd/MM')}`
    : preset === 'today' ? 'Hoje'
    : preset === '7d' ? 'Últimos 7 dias'
    : preset === '14d' ? 'Últimos 14 dias'
    : 'Últimos 30 dias';

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Período: <span className="font-medium text-slate-700">{periodLabel}</span></p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={preset} onValueChange={(v) => setPreset(v as PresetKey)}>
            <SelectTrigger className="w-[170px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="14d">Últimos 14 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          {preset === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-white gap-2">
                  <CalendarIcon size={14} />
                  {customRange?.from
                    ? `${format(customRange.from, 'dd/MM/yy')}${customRange.to ? ' - ' + format(customRange.to, 'dd/MM/yy') : ''}`
                    : 'Escolher datas'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={customRange}
                  onSelect={setCustomRange}
                  numberOfMonths={2}
                  locale={ptBR}
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Live + quick stat row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <LiveVisitorsCard />
        <Card className="border-slate-200/80 shadow-sm md:col-span-2">
          <CardContent className="p-4 md:p-5 flex items-center justify-between h-full">
            <div>
              <p className="text-xs md:text-sm text-slate-500">Total de pedidos (todo período)</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{stats?.totalOrdersLifetime || 0}</p>
              <p className="text-[10px] md:text-xs text-slate-400 mt-1">Desde o início da loja</p>
            </div>
            <button
              onClick={() => navigate('/admin/pedidos')}
              className="text-xs md:text-sm text-primary font-medium bg-primary/5 px-3 py-1.5 rounded-full hover:bg-primary/10"
            >
              Ver pedidos →
            </button>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
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
                      {card.delta && (
                        <div className={`inline-flex items-center gap-0.5 text-[10px] md:text-xs font-medium mt-1 ${card.delta.isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                          {card.delta.isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {card.delta.text}
                          <span className="text-slate-400 font-normal ml-0.5">vs anterior</span>
                        </div>
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm md:text-base font-semibold text-slate-900">Pedidos</CardTitle>
                    <p className="text-xs text-slate-400 mt-0.5">{periodLabel}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full">
                    <TrendingUp size={14} className="text-emerald-500" />
                    <span className="text-xs font-medium text-slate-600">{stats?.totalOrders || 0}</span>
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
                    <Area type="monotone" dataKey="pedidos" name="Pedidos" stroke="hsl(272, 60%, 50%)" strokeWidth={2.5} fill="url(#orderGradient)"
                      dot={{ r: 3, fill: 'white', stroke: 'hsl(272, 60%, 50%)', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: 'hsl(272, 60%, 50%)', stroke: 'white', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm md:text-base font-semibold text-slate-900">Visitas</CardTitle>
                    <p className="text-xs text-slate-400 mt-0.5">{periodLabel}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full">
                    <Eye size={14} className="text-blue-500" />
                    <span className="text-xs font-medium text-slate-600">{stats?.totalVisits || 0}</span>
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
                    <Area type="monotone" dataKey="visitas" name="Visitas" stroke="hsl(210, 80%, 55%)" strokeWidth={2.5} fill="url(#visitGradient)"
                      dot={{ r: 3, fill: 'white', stroke: 'hsl(210, 80%, 55%)', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: 'hsl(210, 80%, 55%)', stroke: 'white', strokeWidth: 2 }} />
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
              <div className="md:hidden space-y-3">
                {stats?.latestOrders?.map((order: any) => (
                  <div key={order.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 active:bg-slate-100 cursor-pointer"
                    onClick={() => navigate(`/admin/pedidos/${order.id}`)}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] text-slate-400">#{order.external_reference?.slice(0, 8)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[order.order_status || 'novo']}`}>
                        {statusLabels[order.order_status || 'novo']}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800 truncate mr-2">{order.customer_name}</span>
                      <span className="text-sm font-bold text-slate-900 whitespace-nowrap">R$ {Number(order.total).toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>

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
                      <tr key={order.id}
                        className="border-b border-slate-50 cursor-pointer hover:bg-slate-50/80"
                        onClick={() => navigate(`/admin/pedidos/${order.id}`)}>
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
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
