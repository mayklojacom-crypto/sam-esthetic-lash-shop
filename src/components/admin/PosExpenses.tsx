import { useState } from 'react';
import { Plus, Ban, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { POS_EXPENSE_LABELS, POS_PAYMENT_LABELS, type PosPayment } from '@/lib/posRules';

export interface PosExpense { id: string; description: string; category: keyof typeof POS_EXPENSE_LABELS; amount: number; expense_date: string; payment_method: string; notes: string; cancelled: boolean }
const brl = (n: number) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
interface Props { expenses: PosExpense[]; loading: boolean; call: (action: string, body?: unknown) => Promise<unknown>; reload: () => void; today: string }

export default function PosExpenses({ expenses, loading, call, reload, today }: Props) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<keyof typeof POS_EXPENSE_LABELS>('outros');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [payment, setPayment] = useState<PosPayment>('pix');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount.replace(',', '.'));
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(amount) || value <= 0) { toast.error('Informe um valor maior que zero, com até dois decimais'); return; }
    setSaving(true);
    try {
      await call('expense', { description, category, amount: value, expense_date: date, payment_method: payment, notes });
      toast.success('Despesa registrada'); setDescription(''); setAmount(''); setNotes(''); setOpen(false); reload();
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };
  const cancel = async (expense: PosExpense) => {
    if (!confirm(`Cancelar a despesa de ${brl(expense.amount)}? Ela ficará no histórico, sem descontar do saldo.`)) return;
    setSaving(true);
    try { await call('cancel-expense', { id: expense.id }); toast.success('Despesa cancelada'); reload(); }
    catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };
  return <div className="space-y-4">
    <Button onClick={() => setOpen(!open)} variant="outline" className="w-full h-12"><Plus />{open ? 'Fechar nova despesa' : 'Nova despesa'}</Button>
    {open && <form onSubmit={save} className="space-y-3 border-b border-border pb-5">
      <label className="block text-sm font-medium">Descrição<Input required maxLength={200} value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex.: campanha de anúncios" className="mt-1 h-12" /></label>
      <label className="block text-sm font-medium">Categoria<select value={category} onChange={e => setCategory(e.target.value as keyof typeof POS_EXPENSE_LABELS)} className="mt-1 w-full h-12 rounded-md border border-input bg-background px-3">{Object.entries(POS_EXPENSE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium">Valor (R$)<Input required inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="mt-1 h-12" /></label>
        <label className="text-sm font-medium">Data<Input required type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 h-12 min-w-0" /></label>
      </div>
      <label className="block text-sm font-medium">Forma de pagamento<select value={payment} onChange={e => setPayment(e.target.value as PosPayment)} className="mt-1 w-full h-12 rounded-md border border-input bg-background px-3">{Object.entries(POS_PAYMENT_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="block text-sm font-medium">Observação (opcional)<Input maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 h-12" /></label>
      <Button disabled={saving} className="w-full h-12" type="submit">{saving ? <Loader2 className="animate-spin" /> : <Plus />}Registrar despesa</Button>
    </form>}
    {loading ? <p className="text-muted-foreground text-center">Carregando despesas…</p> : expenses.length === 0 && <p className="text-muted-foreground text-center py-6">Nenhuma despesa nesse período</p>}
    <ul className="space-y-3">{expenses.map(e => <li key={e.id} className={`border border-border bg-background rounded-lg p-3 ${e.cancelled ? 'opacity-60' : ''}`}>
      <div className="flex gap-2 justify-between"><p className="font-semibold break-words min-w-0">{e.description}</p><span className={`font-bold shrink-0 ${e.cancelled ? 'line-through' : ''}`}>{brl(e.amount)}</span></div>
      <p className="text-xs text-muted-foreground mt-1">{e.expense_date.split('-').reverse().join('/')} · {POS_EXPENSE_LABELS[e.category]} · {POS_PAYMENT_LABELS[e.payment_method as PosPayment]}</p>
      {e.notes && <p className="text-sm mt-1 break-words">{e.notes}</p>}
      {e.cancelled ? <p className="text-xs text-destructive mt-2">Cancelada — fora do saldo</p> : <Button variant="ghost" size="sm" className="text-destructive mt-2" disabled={saving} onClick={() => cancel(e)}><Ban />Cancelar despesa</Button>}
    </li>)}</ul>
  </div>;
}