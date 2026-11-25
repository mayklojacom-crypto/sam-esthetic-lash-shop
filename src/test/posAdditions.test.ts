import { describe, it, expect } from 'vitest';
import { posBalance, posShareUrl } from '@/lib/posRules';
import { createAdminSession, verifyAdminSession } from '../../supabase/functions/_shared/admin-session';

describe('Caixa: despesas e compartilhamento', () => {
  it('desconta anúncios de R$20 das vendas de R$100 sem alterar as vendas', () => {
    const sales = [{ total: 100, payment_method: 'pix', cancelled: false }];
    expect(posBalance(sales, [{ amount: 20, payment_method: 'pix', cancelled: false }])).toEqual({ expenses: 20, balance: 80, byMethod: { pix: 80, dinheiro: 0, credito: 0, debito: 0 } });
    expect(sales[0].total).toBe(100);
  });
  it('não desconta despesas canceladas', () => {
    expect(posBalance([], [{ amount: 30, payment_method: 'dinheiro', cancelled: true }]).balance).toBe(0);
  });
  it('permite saldo negativo e mantém a conciliação por pagamento', () => {
    expect(posBalance([], [{ amount: 12.35, payment_method: 'dinheiro', cancelled: false }]).byMethod.dinheiro).toBe(-12.35);
  });
  it('compartilha apenas resumo na conversa da loja, sem ação de registro', () => {
    const draft = { items: [{ name: 'Pinça', quantity: 2, unit_price: 20, line_total: 40 }], subtotal: 40, discount: 5, total: 35, payment_method: 'pix' };
    const url = new URL(posShareUrl(draft));
    expect(url.origin + url.pathname).toBe('https://wa.me/5562998755213');
    expect(url.searchParams.get('text')).toContain('ainda não registrado');
    expect(url.searchParams.get('text')).toContain('35,00');
    expect(new URL(posShareUrl({ ...draft, id: '12345678-1234', cancelled: true })).searchParams.get('text')).toContain('Venda cancelada #12345678');
  });
});
describe('sessão protegida do Caixa', () => {
  it('aceita sessão assinada e rejeita alteração e expiração', async () => {
    const token = await createAdminSession('test-id', 'test@example.test', 'test-secret', 1000);
    expect(await verifyAdminSession(token, 'test-secret', 2000)).toBe('test@example.test');
    const changed = JSON.parse(atob(token)); changed.email = 'other@example.test';
    expect(await verifyAdminSession(btoa(JSON.stringify(changed)), 'test-secret', 2000)).toBeNull();
    expect(await verifyAdminSession(token, 'test-secret', 86401000)).toBeNull();
    expect(await verifyAdminSession(token, 'different-secret', 2000)).toBeNull();
  });
});