import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminPOS from '@/pages/admin/AdminPOS';

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
vi.mock('@/contexts/AdminAuthContext', () => ({ useAdminAuth: () => ({ isAuthenticated: true, token: 'mock-local-only' }) }));
const product = { id: 'test-product', name: 'Pinça teste', stock: 2, price: 20, image: '/placeholder.svg', active: true };
let expenses: unknown[] = [];
const mount = () => render(<MemoryRouter><AdminPOS /></MemoryRouter>);
beforeEach(() => {
  cleanup(); expenses = []; vi.restoreAllMocks();
  mocks.invoke.mockReset().mockImplementation(async (path: string, options: { body: Record<string, unknown> }) => {
    const action = path.split('=')[1];
    if (action === 'products') return { data: { products: [product] } };
    if (action === 'sales') return { data: { sales: [] } };
    if (action === 'expenses') return { data: { expenses } };
    if (action === 'expense') { expenses.push({ ...options.body, id: 'expense-test', cancelled: false }); return { data: { expense: expenses[0] } }; }
    if (action === 'sale') return { data: { sale: { id: 'saved-id-123', items: [{ name: product.name, quantity: 1, unit_price: 20, line_total: 20 }], subtotal: 20, discount: 2, total: 18, payment_method: 'pix', cancelled: false } } };
    throw new Error('Unexpected action');
  });
});
describe('ferramentas do Caixa com serviço simulado, sem lançamentos reais', () => {
  it('compartilhar rascunho não registra venda; confirmação compartilha valor retornado pelo servidor', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    mount(); fireEvent.click(await screen.findByRole('button', { name: 'Adicionar Pinça teste' }));
    fireEvent.click(screen.getByRole('button', { name: /Fechar venda/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar resumo no WhatsApp' }));
    expect(mocks.invoke.mock.calls.some(([path]) => path.endsWith('=sale'))).toBe(false);
    expect(decodeURIComponent(String(open.mock.calls[0][0]))).toContain('ainda não registrado');
    fireEvent.click(screen.getByRole('button', { name: 'Pix' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar venda' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar no WhatsApp da loja' }));
    expect(decodeURIComponent(String(open.mock.calls[1][0]))).toContain('18,00');
    expect(decodeURIComponent(String(open.mock.calls[1][0]))).toContain('Venda registrada #saved-id');
  });
  it('despesa registrada volta no histórico e no saldo do período', async () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Despesas' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Nova despesa' }));
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Anúncios novembro' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'anuncios' } });
    fireEvent.change(screen.getByLabelText('Valor (R$)'), { target: { value: '20,00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar despesa' }));
    await screen.findByText('Anúncios novembro');
    expect(expenses).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Relatório' }));
    await waitFor(() => expect(screen.getByText('Vendas menos despesas').nextElementSibling?.textContent).toContain('-R$'));
    expect(screen.getByText('Vendas menos despesas').nextElementSibling?.textContent).toContain('20,00');
  });
});