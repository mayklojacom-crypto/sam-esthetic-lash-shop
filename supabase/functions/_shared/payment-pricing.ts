export interface RequestedItem { id: string; quantity: number; size?: string }
export interface CatalogProduct { id: string; name: string; price: number | string; active: boolean; stock: number; sizes: string[] | null }
export function priceOrder(items: RequestedItem[], products: CatalogProduct[], freight: number, discountPercent = 0) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 50 || !Number.isFinite(freight) || freight < 0 ||
      !Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) throw new Error('Valores do pedido inválidos');
  const quantities = new Map<string, number>();
  let subtotalCents = 0;
  const canonical = items.map(item => {
    if (!item || typeof item.id !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) throw new Error('Quantidade inválida');
    const product = products.find(p => p.id === item.id);
    if (!product?.active) throw new Error('Um produto não está mais disponível. Atualize o carrinho.');
    const price = Number(product.price);
    if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) throw new Error('Preço do produto inválido');
    const count = (quantities.get(item.id) || 0) + item.quantity;
    if (!Number.isInteger(product.stock) || count > product.stock) throw new Error(`Estoque insuficiente: ${product.name}`);
    quantities.set(item.id, count);
    if (product.sizes?.length ? !item.size || !product.sizes.includes(item.size) : !!item.size) throw new Error(`Escolha um modelo válido: ${product.name}`);
    const cents = Math.round(price * 100);
    subtotalCents += cents * item.quantity;
    return { id: product.id, name: item.size ? `${product.name} (${item.size})` : product.name, size: item.size || null, quantity: item.quantity, price: cents / 100 };
  });
  const discountCents = Math.round(subtotalCents * discountPercent / 100);
  const freightCents = Math.round(freight * 100);
  const totalCents = subtotalCents - discountCents + freightCents;
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) throw new Error('Total inválido');
  // Adjustment lines preserve totals for the existing PDFs and order consumers.
  const orderItems = [...canonical,
    ...(discountCents ? [{ id: 'discount', name: 'Desconto do cupom', size: null, quantity: 1, price: -discountCents / 100 }] : []),
    { id: 'freight', name: 'Entrega por aplicativo', size: null, quantity: 1, price: freightCents / 100 }];
  return { items: orderItems, total: totalCents / 100, subtotal: subtotalCents / 100, discount: discountCents / 100, freight: freightCents / 100 };
}