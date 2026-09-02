import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Minus, Download, RotateCcw, Trash2, Loader2, Check } from 'lucide-react';
import { categories } from '@/data/products';

interface StockRow {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
  slug: string;
}

const LOW_STOCK = 3;

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const catLabel = (id: string) => categories.find(c => c.id === id)?.label || id;

const sortRows = (rows: StockRow[]) =>
  [...rows].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
  });

const AdminStock = () => {
  const { token } = useAdminAuth();
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [quickFilter, setQuickFilter] = useState<'todos' | 'ativos' | 'sem' | 'baixo'>('todos');
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [adjust, setAdjust] = useState<Record<string, string>>({});
  const [newRow, setNewRow] = useState<{ name: string; category: string; price: string; stock: string } | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchRows = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-products?action=list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      setRows(
        sortRows(
          (data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: Number(p.price) || 0,
            stock: typeof p.stock === 'number' ? p.stock : 0,
            active: !!p.active,
            slug: p.slug,
          }))
        )
      );
    } catch {
      toast({ title: 'Erro ao carregar estoque', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const flashSaved = (id: string) => {
    setSavedIds(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setSavedIds(prev => ({ ...prev, [id]: false })), 1600);
  };

  const patch = async (id: string, updates: Partial<StockRow>, previous: StockRow) => {
    setSavingIds(prev => ({ ...prev, [id]: true }));
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
    try {
      const { error } = await supabase.functions.invoke('admin-products?action=update', {
        headers: { Authorization: `Bearer ${token}` },
        body: { id, ...updates },
      });
      if (error) throw error;
      flashSaved(id);
      if (updates.active !== undefined) setRows(prev => sortRows(prev));
    } catch {
      setRows(prev => prev.map(r => (r.id === id ? previous : r)));
      toast({ title: 'Erro ao salvar alteração', variant: 'destructive' });
    } finally {
      setSavingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const setStock = (row: StockRow, value: number) => {
    const stock = Math.max(0, Math.round(value || 0));
    if (stock === row.stock) return;
    patch(row.id, { stock }, row);
  };

  const setPrice = (row: StockRow, value: number) => {
    const price = Math.max(0, Number(value) || 0);
    if (price === row.price) return;
    patch(row.id, { price }, row);
  };

  const applyAdjust = (row: StockRow) => {
    const raw = (adjust[row.id] || '').trim();
    if (!raw) return;
    const delta = Number(raw.replace(',', '.'));
    if (Number.isNaN(delta) || delta === 0) return;
    setAdjust(prev => ({ ...prev, [row.id]: '' }));
    setStock(row, row.stock + delta);
  };

  const handleCreate = async () => {
    if (!newRow?.name.trim()) {
      toast({ title: 'Informe o nome do produto', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const body = {
        name: newRow.name.trim(),
        slug: `${slugify(newRow.name)}-${Date.now().toString().slice(-4)}`,
        category: newRow.category,
        price: Number((newRow.price || '0').replace(',', '.')) || 0,
        stock: Math.max(0, Math.round(Number(newRow.stock) || 0)),
        image: '/placeholder.svg',
        description: '',
        weight: 50,
        active: true,
        sort_order: 0,
      };
      const { error } = await supabase.functions.invoke('admin-products?action=create', {
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (error) throw error;
      toast({ title: 'Produto adicionado!', description: 'Suba a foto depois em Produtos.' });
      setNewRow(null);
      fetchRows();
    } catch (err: any) {
      toast({ title: 'Erro ao adicionar', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter(r => {
      if (term && !r.name.toLowerCase().includes(term)) return false;
      if (categoryFilter !== 'todos' && r.category !== categoryFilter) return false;
      if (quickFilter === 'ativos' && !r.active) return false;
      if (quickFilter === 'sem' && r.stock > 0) return false;
      if (quickFilter === 'baixo' && (r.stock === 0 || r.stock > LOW_STOCK)) return false;
      return true;
    });
  }, [rows, search, categoryFilter, quickFilter]);

  const summary = useMemo(() => {
    const actives = rows.filter(r => r.active);
    return {
      total: actives.length,
      out: actives.filter(r => r.stock === 0).length,
      low: actives.filter(r => r.stock > 0 && r.stock <= LOW_STOCK).length,
      value: actives.reduce((sum, r) => sum + r.price * r.stock, 0),
    };
  }, [rows]);

  const exportCsv = () => {
    const header = ['Produto', 'Categoria', 'Preco', 'Estoque', 'Status'];
    const lines = filtered.map(r =>
      [r.name, catLabel(r.category), r.price.toFixed(2), r.stock, r.active ? 'Ativo' : 'Inativo']
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(';')
    );
    const csv = '\uFEFF' + [header.join(';'), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `estoque-sam-esthetic-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Controle de Estoque</h1>
          <p className="text-sm text-slate-500">Edite direto na tabela — tudo reflete na loja na hora.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download size={16} className="mr-2" /> Exportar CSV
          </Button>
          <Button onClick={() => setNewRow({ name: '', category: 'cilios', price: '', stock: '0' })}>
            <Plus size={16} className="mr-2" /> Novo produto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Produtos ativos', value: summary.total, tone: 'text-slate-900' },
          { label: 'Sem estoque', value: summary.out, tone: 'text-red-600' },
          { label: `Estoque baixo (≤${LOW_STOCK})`, value: summary.low, tone: 'text-amber-600' },
          {
            label: 'Valor em estoque',
            value: summary.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            tone: 'text-emerald-600',
          },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.tone}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          {([
            ['todos', 'Todos'],
            ['ativos', 'Só ativos'],
            ['sem', 'Sem estoque'],
            ['baixo', 'Estoque baixo'],
          ] as const).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={quickFilter === key ? 'default' : 'outline'}
              onClick={() => setQuickFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3 font-semibold">Produto</th>
                <th className="px-3 py-3 font-semibold w-[150px]">Categoria</th>
                <th className="px-3 py-3 font-semibold w-[120px]">Preço (R$)</th>
                <th className="px-3 py-3 font-semibold w-[210px]">Estoque</th>
                <th className="px-3 py-3 font-semibold w-[120px]">Ajustar</th>
                <th className="px-3 py-3 font-semibold w-[130px] text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {newRow && (
                <tr className="bg-primary/5 border-b border-slate-200">
                  <td className="px-4 py-2">
                    <Input
                      autoFocus
                      placeholder="Nome do produto"
                      value={newRow.name}
                      onChange={e => setNewRow({ ...newRow, name: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={newRow.category} onValueChange={v => setNewRow({ ...newRow, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.id !== 'todos').map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      inputMode="decimal"
                      placeholder="0,00"
                      value={newRow.price}
                      onChange={e => setNewRow({ ...newRow, price: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2" colSpan={2}>
                    <Input
                      inputMode="numeric"
                      placeholder="Qtd"
                      value={newRow.stock}
                      onChange={e => setNewRow({ ...newRow, stock: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <Button size="sm" onClick={handleCreate} disabled={creating}>
                      {creating ? <Loader2 size={14} className="animate-spin" /> : 'Salvar'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setNewRow(null)}>
                      Cancelar
                    </Button>
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Carregando...
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && !newRow && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}

              {filtered.map(row => (
                <tr
                  key={row.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 ${row.active ? '' : 'opacity-60'}`}
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{row.name}</span>
                      {!row.active && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                      {row.active && row.stock === 0 && (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px]">Esgotado</Badge>
                      )}
                      {savingIds[row.id] && <Loader2 size={13} className="animate-spin text-slate-400" />}
                      {savedIds[row.id] && <Check size={14} className="text-emerald-500" />}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{catLabel(row.category)}</td>
                  <td className="px-3 py-2">
                    <Input
                      className="h-8 w-24"
                      inputMode="decimal"
                      defaultValue={row.price.toFixed(2).replace('.', ',')}
                      key={`price-${row.id}-${row.price}`}
                      onBlur={e => setPrice(row, Number(e.target.value.replace(/\./g, '').replace(',', '.')))}
                      onKeyDown={e => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setStock(row, row.stock - 1)}
                        disabled={row.stock <= 0}
                      >
                        <Minus size={14} />
                      </Button>
                      <Input
                        className={`h-8 w-20 text-center font-semibold ${row.stock === 0 ? 'text-red-600' : row.stock <= LOW_STOCK ? 'text-amber-600' : ''}`}
                        inputMode="numeric"
                        key={`stock-${row.id}-${row.stock}`}
                        defaultValue={row.stock}
                        onBlur={e => setStock(row, Number(e.target.value))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setStock(row, row.stock + 1)}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      className="h-8 w-24"
                      placeholder="+12 / -3"
                      value={adjust[row.id] || ''}
                      onChange={e => setAdjust(prev => ({ ...prev, [row.id]: e.target.value }))}
                      onBlur={() => applyAdjust(row)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {row.active ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          if (confirm(`Remover "${row.name}" da loja? Ele fica salvo como inativo.`)) {
                            patch(row.id, { active: false }, row);
                          }
                        }}
                      >
                        <Trash2 size={14} className="mr-1" /> Remover
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => patch(row.id, { active: true }, row)}>
                        <RotateCcw size={14} className="mr-1" /> Reativar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400">
        Dica: no campo "Ajustar" digite +12 para entrada de mercadoria ou -3 para saída. O estoque é somado automaticamente.
      </p>
    </div>
  );
};

export default AdminStock;
