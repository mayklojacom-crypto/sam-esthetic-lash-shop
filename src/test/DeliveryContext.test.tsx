import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DeliveryProvider, useDelivery } from '@/contexts/DeliveryContext';

function DeliveryProbe() {
  const { delivery } = useDelivery();
  return <output data-testid="delivery">{delivery ? `${delivery.address.city}:${String(delivery.price)}` : 'none'}</output>;
}

afterEach(() => { cleanup(); sessionStorage.clear(); });

describe('browser delivery storage is not a payable quote', () => {
  const address = { cep: '74000000', city: 'Goiânia', state: 'GO', street: '', neighborhood: '' };
  it.each([0, 7, 9, -7])('does not restore a client-supplied freight of %s', price => {
    sessionStorage.setItem('sam-selected-local-delivery', JSON.stringify({ service: 'Entrega por aplicativo', address, price }));
    render(<DeliveryProvider><DeliveryProbe /></DeliveryProvider>);
    expect(screen.getByTestId('delivery').textContent).toBe('none');
  });
  it('reuses the consulted destination with freight still pending', () => {
    sessionStorage.setItem('sam-selected-local-delivery', JSON.stringify({ service: 'Entrega por aplicativo', address, price: null }));
    render(<DeliveryProvider><DeliveryProbe /></DeliveryProvider>);
    expect(screen.getByTestId('delivery').textContent).toBe('Goiânia:null');
  });
  it('does not restore an out-of-area destination', () => {
    sessionStorage.setItem('sam-selected-local-delivery', JSON.stringify({ service: 'Entrega por aplicativo', address: { ...address, city: 'Trindade' }, price: null }));
    render(<DeliveryProvider><DeliveryProbe /></DeliveryProvider>);
    expect(screen.getByTestId('delivery').textContent).toBe('none');
  });
});