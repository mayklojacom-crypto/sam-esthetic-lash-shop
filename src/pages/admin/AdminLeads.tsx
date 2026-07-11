import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Search, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Lead = {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: Array<{ name: string; quantity: number; price: number; size?: string | null }>;
  total: number;
  status: 'novo' | 'respondido' | 'fechado' | 'perdido';
  notes: string;
  created_at: string;
};

const statusStyles: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-700 border-blue-200',
  respondido: 'bg-amber-100 text-amber-700 border-amber-200',
  fechado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  perdido: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
  novo: 'Novo', respondido: 'Respondido', fechado: 'Fechado', perdido: 'Perdido',
};

const AdminLeads = () => {
  const { token } = useAdminAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<Lead['status']>('novo');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: 'list', page: String(page), status: statusFilter });
      if (search) params.set('search', search);
      const { data, error } = await supabase.functions.invoke(`admin-leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const openLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEditNotes(lead.notes || '');
    setEditStatus(lead.status);
  };

  const saveLead = async () => {
    if (!selectedLead) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('admin-leads?action=update', {
        method: 'POST',
        body: { id: selectedLead.id, status: editStatus, notes: editNotes },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      toast.success('Lead atualizado');
      setSelectedLead(null);
      load();
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const removeLead = async (id: string) => {
    if (!confirm('Apagar este lead?')) return;
    try {
      const { error } = await supabase.functions.invoke('admin-leads?action=delete', {
        method: 'POST',
        body: { id },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      toast.success('Lead removido');
      load();
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const openWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    const full = digits.startsWith('55') ? digits : `55${digits}`;
    window.open(`https://wa.me/${full}`, '_blank');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Leads (Pedidos Iniciados)</h1>
        <p className="text-sm text-slate-500 mt-0.5">Clientes que clicaram em "Finalizar no WhatsApp" — {total} no total</p>
      </div>

      <Card className="border-slate-200/80 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou telefone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="respondido">Respondido</SelectItem>
              <SelectItem value="fechado">Fechado</SelectItem>
              <SelectItem value="perdido">Perdido</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setPage(1); load(); }} variant="outline">Buscar</Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">Nenhum lead encontrado</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <div key={lead.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openLead(lead)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{lead.customer_name}</span>
                      <Badge variant="outline" className={statusStyles[lead.status]}>{statusLabels[lead.status]}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {lead.customer_phone} · {lead.items.length} {lead.items.length === 1 ? 'item' : 'itens'} · R$ {Number(lead.total).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(lead.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openWhatsApp(lead.customer_phone)}>
                      <MessageCircle size={14} className="text-emerald-600" />
                      <span className="hidden md:inline">WhatsApp</span>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeLead(lead.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-slate-500 self-center">Página {page} de {Math.ceil(total / 20)}</span>
          <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Próxima</Button>
        </div>
      )}

      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes do Lead</DialogTitle></DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Cliente</p>
                <p className="text-slate-900 font-medium">{selectedLead.customer_name}</p>
                <p className="text-sm text-slate-600">{selectedLead.customer_phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Itens</p>
                <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                  {selectedLead.items.map((it, i) => (
                    <p key={i} className="text-sm text-slate-700">
                      {it.quantity}x {it.name}{it.size ? ` (${it.size})` : ''} — R$ {(it.price * it.quantity).toFixed(2)}
                    </p>
                  ))}
                  <p className="text-sm font-bold text-slate-900 pt-2 border-t border-slate-200 mt-2">
                    Total: R$ {Number(selectedLead.total).toFixed(2)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Status</p>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as Lead['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="respondido">Respondido</SelectItem>
                    <SelectItem value="fechado">Fechado (vendeu)</SelectItem>
                    <SelectItem value="perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Anotações internas</p>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} placeholder="Ex: pediu desconto, prometeu voltar amanhã..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => openWhatsApp(selectedLead.customer_phone)} className="gap-1.5">
                  <MessageCircle size={14} className="text-emerald-600" /> Abrir WhatsApp
                </Button>
                <Button onClick={saveLead} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeads;
