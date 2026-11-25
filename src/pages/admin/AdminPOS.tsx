import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Search, ShoppingCart, Trash2, Receipt, Store, X, Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { posBalance, posShareUrl, posTotals, posSummary, POS_PAYMENT_LABELS, type PosPayment } from '@/lib/posRules';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PosExpenses, { type PosExpense } from '@/components/admin/PosExpenses';

interface Prod { id: string; name: string; price: number; stock: number; image: string; active: boolean }
interface SaleItem { product_id: string; name: string; unit_price: number; quantity: number; line_total: number }
interface Sale { id: string; items: SaleItem[]; subtotal: number; discount: number; total: number; payment_method: string; notes: string; cancelled: boolean; created_at: string }

const brl = (n: number) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export default function AdminPOS() {
  const { isAuthenticated, token } = useAdminAuth();
  const [tab, setTab] = useState<'vender' | 'relatorio' | 'despesas'>('vender');
  const [products, setProducts] = useState<Prod[]>([]);
  const [loadingP, setLoadingP] = useState(true);
  const [q, setQ] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCart, setShowCart] = useState(false);
  const [payment, setPayment] = useState<PosPayment | null>(null);
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingS, setLoadingS] = useState(false);
  const [expenses, setExpenses] = useState<PosExpense[]>([]);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [reportError, setReportError] = useState('');

  const call = async (action: string, body?: unknown) => {
    const { data, error } = await supabase.functions.invoke(`admin-pos?action=${action}`, {
      headers: { Authorization: `Bearer ${token}` }, body: body ?? {},
    });
    if (error) {
      let msg = error.context?.status === 401 ? 'Entre novamente no painel para acessar o Caixa com segurança' : 'Erro de conexão';
      try { msg = (await (error as { context?: Response }).context?.json())?.error || msg; } catch { /* keep */ }
      throw new Error(msg);
    }
    return data;
  };

  const loadProducts = async () => {
    setLoadingP(true);
    try { setProducts((await call('products')).products); } catch (e) { toast.error((e as Error).message); } finally { setLoadingP(false); }
  };
  const loadSales = async () => {
    setLoadingS(true); setReportError('');
    try {
      const f = new Date(`${from}T00:00:00`); const t = new Date(`${to}T00:00:00`); t.setDate(t.getDate() + 1);
      if (from > to) throw new Error('A data inicial deve vir antes da final');
      const [s, e] = await Promise.all([call('sales', { from: f.toISOString(), to: t.toISOString() }), call('expenses', { from, to })]);
      setSales(s.sales); setExpenses(e.expenses);
    } catch (e) { setReportError((e as Error).message); toast.error((e as Error).message); } finally { setLoadingS(false); }
  };

  useEffect(() => { if (token) loadProducts(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);
  useEffect(() => { if (token && tab !== 'vender') loadSales(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab, from, to, token]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return products.filter((p) => !n || p.name.toLowerCase().includes(n))
      .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || a.name.localeCompare(b.name));
  }, [products, q]);

  const lines = Object.entries(cart).flatMap(([id, quantity]) => { const p = products.find(x => x.id === id); return p ? [{ p, quantity }] : []; });
  const totals = posTotals(lines.map((l) => ({ price: Number(l.p.price), quantity: l.quantity })), Number(discount.replace(',', '.')) || 0);
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  const setQty = (p: Prod, qty: number) => setCart((c) => {
    const n = { ...c };
    if (qty <= 0) delete n[p.id]; else n[p.id] = Math.min(qty, p.stock);
    return n;
  });

  const finish = async () => {
    if (!payment) { toast.error('Escolha a forma de pagamento'); return; }
    setSaving(true);
    try {
      const result = await call('sale', { items: lines.map((l) => ({ product_id: l.p.id, quantity: l.quantity })), discount: totals.discount, payment_method: payment, notes });
      setReceipt(result.sale);
      toast.success(`Venda registrada: ${brl(result.sale.total)}`);
      setCart({}); setDiscount(''); setNotes(''); setPayment(null); setShowCart(false);
      loadProducts();
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  const cancelSale = async (s: Sale) => {
    if (!confirm(`Cancelar a venda de ${brl(s.total)}? Os produtos voltam para o estoque.`)) return;
    try { await call('cancel', { id: s.id }); toast.success('Venda cancelada'); loadSales(); loadProducts(); } catch (e) { toast.error((e as Error).message); }
  };

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  const summary = posSummary(sales);
  const balance = posBalance(sales, expenses);
  const draft = { items: lines.map(l => ({ name: l.p.name, quantity: l.quantity, unit_price: Number(l.p.price), line_total: Number(l.p.price) * l.quantity })), ...totals, payment_method: payment };
  const share = (s: Parameters<typeof posShareUrl>[0]) => window.open(posShareUrl(s), '_blank', 'noopener,noreferrer');

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col max-w-md mx-auto md:border-x md:border-slate-200">
      <header className="sticky top-0 z-20 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white px-4 pt-4 pb-3 shadow">
        <div className="flex items-center gap-3">
          <Link to="/admin" aria-label="Voltar ao painel" className="p-1 -ml-1"><ArrowLeft size={22} /></Link>
          <Store size={20} />
          <h1 className="font-bold text-lg flex-1">Caixa Sam Esthetic</h1>
        </div>
        <div className="mt-3 grid grid-cols-3 bg-white/15 rounded-xl p-1 text-sm font-semibold">
          {(['vender', 'relatorio', 'despesas'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`py-2 rounded-lg ${tab === t ? 'bg-white text-purple-700' : 'text-white'}`}>
              {t === 'vender' ? 'Vender' : t === 'relatorio' ? 'Relatório' : 'Despesas'}
            </button>
          ))}
        </div>
      </header>

      {tab === 'vender' ? (
        <>
          <div className="px-4 pt-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto" className="w-full h-12 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-base" />
            </div>
          </div>
          <ul className="flex-1 px-4 py-3 space-y-2 pb-28">
            {loadingP && <li className="text-center text-slate-500 py-10"><Loader2 className="animate-spin inline" /> Carregando produtos…</li>}
            {!loadingP && filtered.length === 0 && <li className="text-center text-slate-500 py-10">Nenhum produto encontrado</li>}
            {filtered.map((p) => {
              const qty = cart[p.id] || 0; const out = p.stock <= 0;
              return (
                <li key={p.id} className={`bg-white rounded-xl border border-slate-200 p-2.5 flex items-center gap-3 ${out ? 'opacity-50' : ''}`}>
                  <img src={p.image} alt="" className="w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight">{p.name}</p>
                    <p className="text-sm text-purple-700 font-bold mt-0.5">{brl(p.price)}</p>
                    <p className="text-[11px] text-slate-500">{out ? 'Sem estoque' : `Estoque: ${p.stock}`}</p>
                  </div>
                  {qty === 0 ? (
                    <button disabled={out} onClick={() => setQty(p, 1)} className="h-11 w-11 rounded-xl bg-purple-600 text-white flex items-center justify-center disabled:bg-slate-300" aria-label={`Adicionar ${p.name}`}><Plus size={20} /></button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setQty(p, qty - 1)} className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center" aria-label="Menos"><Minus size={18} /></button>
                      <span className="w-7 text-center font-bold">{qty}</span>
                      <button disabled={qty >= p.stock} onClick={() => setQty(p, qty + 1)} className="h-10 w-10 rounded-lg bg-purple-600 text-white flex items-center justify-center disabled:bg-slate-300" aria-label="Mais"><Plus size={18} /></button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {count > 0 && (
            <div className="fixed bottom-0 inset-x-0 z-30 max-w-md mx-auto p-3 bg-white border-t border-slate-200">
              <button onClick={() => setShowCart(true)} className="w-full h-14 rounded-2xl bg-purple-600 text-white font-bold flex items-center justify-between px-5 shadow-lg">
                <span className="flex items-center gap-2"><ShoppingCart size={20} /> {count} {count === 1 ? 'item' : 'itens'}</span>
                <span>{brl(totals.subtotal)} · Fechar venda</span>
              </button>
            </div>
          )}
          {showCart && (
            <div className="fixed inset-0 z-40 bg-black/40 flex items-end" onClick={() => setShowCart(false)}>
              <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl max-h-[92dvh] overflow-auto p-4 pb-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center mb-3"><h2 className="font-bold text-lg flex-1">Fechar venda</h2><button onClick={() => setShowCart(false)} aria-label="Fechar"><X /></button></div>
                <ul className="space-y-2 mb-4">
                  {lines.map((l) => (
                    <li key={l.p.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{l.quantity}× {l.p.name}</span>
                      <span className="font-semibold">{brl(Number(l.p.price) * l.quantity)}</span>
                      <button onClick={() => setQty(l.p, 0)} className="text-red-500 p-1" aria-label="Remover"><Trash2 size={16} /></button>
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-semibold mb-2">Forma de pagamento</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {(Object.keys(POS_PAYMENT_LABELS) as PosPayment[]).map((m) => (
                    <button key={m} onClick={() => setPayment(m)} className={`h-12 rounded-xl border-2 font-semibold ${payment === m ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200'}`}>{POS_PAYMENT_LABELS[m]}</button>
                  ))}
                </div>
                <label className="text-sm font-semibold">Desconto (R$)</label>
                <input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0,00" className="w-full h-12 mt-1 mb-3 px-3 rounded-xl border border-slate-200 text-base" />
                <label className="text-sm font-semibold">Observação (opcional)</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Ex.: nome da cliente" className="w-full h-12 mt-1 mb-4 px-3 rounded-xl border border-slate-200 text-base" />
                <div className="text-sm space-y-1 mb-4">
                  <div className="flex justify-between"><span>Subtotal</span><span>{brl(totals.subtotal)}</span></div>
                  {totals.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Desconto</span><span>− {brl(totals.discount)}</span></div>}
                  <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{brl(totals.total)}</span></div>
                </div>
                <Button variant="outline" disabled={saving} onClick={() => share(draft)} className="w-full h-12 mb-3"><Share2 />Compartilhar resumo no WhatsApp</Button>
                <button disabled={saving || !payment || lines.length === 0} onClick={finish} className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-bold text-lg disabled:bg-slate-300">
                  {saving ? 'Registrando…' : 'Confirmar venda'}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-600">De<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full h-11 mt-1 px-2 rounded-xl border border-slate-200 bg-white text-base" /></label>
            <label className="text-xs text-slate-600">Até<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full h-11 mt-1 px-2 rounded-xl border border-slate-200 bg-white text-base" /></label>
          </div>
          {reportError && <p role="alert" className="text-destructive">{reportError}<Button variant="outline" onClick={loadSales} className="ml-2">Tentar novamente</Button></p>}
          {!reportError && tab === 'despesas' ? <PosExpenses expenses={expenses} loading={loadingS} call={call} reload={loadSales} today={todayStr()} /> : !reportError && <>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Total vendido no período</p>
            <p className="text-3xl font-bold text-purple-700">{brl(summary.total)}</p>
            <p className="text-xs text-slate-500">{summary.count} {summary.count === 1 ? 'venda' : 'vendas'}</p>
            <div className="mt-3 border-t border-border pt-3 space-y-1 text-sm"><div className="flex justify-between"><span>Despesas no período</span><strong>{brl(balance.expenses)}</strong></div><div className="flex justify-between"><span>Vendas menos despesas</span><strong>{brl(balance.balance)}</strong></div></div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {(Object.keys(POS_PAYMENT_LABELS) as PosPayment[]).map((m) => (
                <div key={m} className="bg-slate-50 rounded-xl p-2"><p className="text-[11px] text-slate-500">{POS_PAYMENT_LABELS[m]}</p><p className="font-bold text-sm">{brl(summary.byMethod[m] || 0)}</p><p className="text-[11px] text-muted-foreground mt-1">Após despesas: {brl(balance.byMethod[m] || 0)}</p></div>
              ))}
            </div>
          </div>
          {loadingS && <p className="text-center text-slate-500"><Loader2 className="animate-spin inline" /> Carregando…</p>}
          {!loadingS && sales.length === 0 && <p className="text-center text-slate-500 py-6">Nenhuma venda nesse período</p>}
          <ul className="space-y-2">
            {sales.map((s) => (
              <li key={s.id} className={`bg-white rounded-xl border border-slate-200 p-3 ${s.cancelled ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2">
                  <Receipt size={16} className="text-purple-600" />
                  <span className="text-xs text-slate-500 flex-1">{new Date(s.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {POS_PAYMENT_LABELS[s.payment_method as PosPayment] ?? s.payment_method}</span>
                  <span className={`font-bold ${s.cancelled ? 'line-through' : ''}`}>{brl(s.total)}</span>
                </div>
                <ul className="mt-1.5 text-xs text-slate-700 space-y-0.5">
                  {s.items.map((it, i) => <li key={i}>{it.quantity}× {it.name}</li>)}
                </ul>
                {Number(s.discount) > 0 && <p className="text-xs text-emerald-600 mt-1">Desconto {brl(s.discount)}</p>}
                {s.notes && <p className="text-xs text-slate-500 mt-1">{s.notes}</p>}
                <Button variant="outline" size="sm" className="mt-2 mr-2" onClick={() => share(s)}><Share2 />Compartilhar</Button>
                {s.cancelled ? <p className="text-xs text-red-600 font-semibold mt-1">Cancelada — estoque devolvido</p>
                  : <button onClick={() => cancelSale(s)} className="text-xs text-red-600 font-semibold mt-2">Cancelar venda</button>}
              </li>
            ))}
          </ul>
          </>}
        </div>
      )}
      <Dialog open={!!receipt} onOpenChange={open => { if (!open) setReceipt(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Venda registrada</DialogTitle><DialogDescription>O resumo pode ser encaminhado para a cliente pelo WhatsApp da loja.</DialogDescription></DialogHeader>
          {receipt && <><p className="text-2xl font-bold text-primary">{brl(receipt.total)}</p><p className="text-sm text-muted-foreground">#{receipt.id.slice(0, 8)} · Estoque atualizado</p>
            <Button className="h-12 w-full" onClick={() => share(receipt)}><Share2 />Compartilhar no WhatsApp da loja</Button>
            <Button variant="outline" className="h-12 w-full" onClick={() => setReceipt(null)}>Nova venda</Button></>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
