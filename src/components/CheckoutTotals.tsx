import { checkoutTotals, formatBRL } from '@/lib/checkoutRules';

export default function CheckoutTotals({ subtotal, discountRate = 0, freight = null }: {
  subtotal: number; discountRate?: number; freight?: number | null;
}) {
  const totals = checkoutTotals(subtotal, discountRate, freight);
  return <div aria-label="Totais do pedido" className="space-y-2 py-4">
    <div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(totals.subtotal)}</span></div>
    {totals.discount > 0 && <div className="flex justify-between gap-3 text-sm text-primary"><span>Desconto</span><span>− {formatBRL(totals.discount)}</span></div>}
    <div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">Frete</span><span>{freight === null ? 'Pendente de confirmação' : formatBRL(freight)}</span></div>
    <div className="flex justify-between gap-3 border-t border-border pt-3 font-bold"><span>Total</span><span className="text-primary text-right">{totals.total === null ? 'A confirmar com o frete' : formatBRL(totals.total)}</span></div>
    {totals.total === null && <p className="text-xs text-muted-foreground">Produtos: {formatBRL(totals.productsTotal)} + frete a combinar.</p>}
  </div>;
}