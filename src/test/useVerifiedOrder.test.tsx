import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useVerifiedOrder } from '@/hooks/useVerifiedOrder';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));

describe('read-only payment confirmation', () => {
  beforeEach(() => rpc.mockReset());
  it('does not query or approve an empty reference', () => {
    const { result } = renderHook(() => useVerifiedOrder(''));
    expect(result.current.purchase).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });
  it('reads the exact reference and returns only verified BRL purchase data', async () => {
    rpc.mockResolvedValue({ data: [{ external_reference: 'order_test', payment_status: 'approved', total: 102 }], error: null });
    const { result } = renderHook(() => useVerifiedOrder('order_test'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(rpc).toHaveBeenCalledWith('search_orders_by_reference', { ref_query: 'order_test' });
    expect(result.current.purchase).toEqual({ transaction_id: 'order_test', currency: 'BRL', value: 102 });
  });
  it('never approves a pending stored order', async () => {
    rpc.mockResolvedValue({ data: [{ external_reference: 'order_test', payment_status: 'pending', total: 102 }], error: null });
    const { result } = renderHook(() => useVerifiedOrder('order_test'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.purchase).toBeNull();
  });
  it('keeps confirmation unavailable after a failed lookup', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'unavailable' } });
    const { result } = renderHook(() => useVerifiedOrder('order_test'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.purchase).toBeNull();
    expect(result.current.error).toBeTruthy();
  });
});