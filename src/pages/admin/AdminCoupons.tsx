import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Ticket, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  title: string;
  subtitle: string;
  cta_text: string;
  active: boolean;
  show_in_popup: boolean;
  created_at: string;
}

const empty: Omit<Coupon, 'id' | 'created_at'> = {
  code: '',
  discount_percent: 10,
  title: 'Espera! 🎁',
  subtitle: 'Antes de sair, leve um cupom exclusivo pra você:',
  cta_text: 'Copiar Cupom',
  active: true,
  show_in_popup: false,
};

const AdminCoupons = () => {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<Omit<Coupon, 'id' | 'created_at'>>(empty);

  const call = async (action: string, body?: any) => {
    const { data, error } = await supabase.functions.invoke(`admin-coupons?action=${action}`, {
      body,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (error) throw error;
    return data;
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await call('list');
      setItems(data || []);
    } catch (e: any) {
      toast.error('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      discount_percent: Number(c.discount_percent),
      title: c.title,
      subtitle: c.subtitle,
      cta_text: c.cta_text,
      active: c.active,
      show_in_popup: c.show_in_popup,
    });
  };

  const [dialogOpen, setDialogOpen] = useState(false);

  const openDialog = (c?: Coupon) => {
    c ? openEdit(c) : openNew();
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) {
      toast.error('Informe o código do cupom');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, code: form.code.trim().toUpperCase() };
      if (editing) {
        await call('update', { id: editing.id, ...payload });
        toast.success('Cupom atualizado! 💗');
      } else {
        await call('create', payload);
        toast.success('Cupom criado! 💗');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Excluir cupom "${c.code}"?`)) return;
    try {
      await supabase.functions.invoke(`admin-coupons?action=delete&id=${c.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Cupom removido');
      load();
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const toggle = async (c: Coupon, field: 'active' | 'show_in_popup', value: boolean) => {
    try {
      await call('update', { id: c.id, [field]: value });
      load();
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Ticket className="text-primary" /> Cupons de Desconto
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie cupons e o banner de saída (RECUPERA10). Só <strong>1 cupom por vez</strong> pode aparecer no popup.
          </p>
        </div>
        <Button onClick={() => openDialog()} className="shrink-0">
          <Plus size={16} className="mr-1" /> Novo
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
          <Ticket className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-500">Nenhum cupom cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map(c => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-extrabold tracking-wider text-primary">{c.code}</span>
                    <Badge className="bg-accent text-accent-foreground">{Number(c.discount_percent)}% OFF</Badge>
                    {c.show_in_popup && (
                      <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                        <Sparkles size={11} className="mr-1" /> no popup
                      </Badge>
                    )}
                    {!c.active && <Badge variant="outline" className="text-slate-500">inativo</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.subtitle}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openDialog(c)}>
                    <Pencil size={15} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(c)} className="text-red-500 hover:text-red-600">
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Switch checked={c.active} onCheckedChange={v => toggle(c, 'active', v)} />
                  Ativo
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Switch checked={c.show_in_popup} onCheckedChange={v => toggle(c, 'show_in_popup', v)} />
                  Mostrar no popup de saída
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar cupom' : 'Novo cupom'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Código</Label>
                <Input
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="RECUPERA10"
                  className="mt-1 font-mono tracking-wider"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Desconto (%)</Label>
                <Input
                  type="number" min={0} max={100}
                  value={form.discount_percent}
                  onChange={e => setForm(p => ({ ...p, discount_percent: Number(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Título do popup</Label>
              <Input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Mensagem</Label>
              <Textarea
                value={form.subtitle}
                onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))}
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Texto do botão</Label>
              <Input
                value={form.cta_text}
                onChange={e => setForm(p => ({ ...p, cta_text: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.active}
                  onCheckedChange={v => setForm(p => ({ ...p, active: v }))}
                />
                Ativo
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.show_in_popup}
                  onCheckedChange={v => setForm(p => ({ ...p, show_in_popup: v }))}
                />
                Mostrar no popup
              </label>
            </div>
            {form.show_in_popup && (
              <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                ⚠️ Ao salvar, este cupom será o único a aparecer no popup — os outros serão desmarcados automaticamente.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={16} /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
