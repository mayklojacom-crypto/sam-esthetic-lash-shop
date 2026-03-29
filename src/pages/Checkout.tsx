import { useState } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { z } from 'zod';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(100),
  phone: z.string().trim().min(10, 'Telefone inválido').max(20),
  address: z.string().trim().min(5, 'Endereço muito curto').max(300),
  notes: z.string().max(500).optional(),
});

const WHATSAPP_NUMBER = '5562998755213';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (items.length === 0) {
    navigate('/carrinho');
    return null;
  }

  const handleSubmit = () => {
    const result = checkoutSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    const itemsList = items
      .map(i => `▪️ ${i.quantity}x ${i.product.name} — R$ ${(i.product.price * i.quantity).toFixed(2)}`)
      .join('\n');

    const message = `🛍️ *NOVO PEDIDO — Sam Esthetic*\n\n` +
      `*Cliente:* ${result.data.name}\n` +
      `*Telefone:* ${result.data.phone}\n` +
      `*Endereço:* ${result.data.address}\n` +
      `${result.data.notes ? `*Obs:* ${result.data.notes}\n` : ''}` +
      `\n*Itens:*\n${itemsList}\n\n` +
      `💰 *Total: R$ ${totalPrice.toFixed(2)}*`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');

    clearCart();
    toast.success('Pedido enviado pelo WhatsApp!');
    navigate('/');
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="px-4 mt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft size={16} /> Voltar
        </button>

        <h1 className="text-xl font-bold text-foreground">Finalizar Pedido</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha seus dados e envie o pedido pelo WhatsApp
        </p>

        {/* Order Summary */}
        <div className="bg-secondary rounded-xl p-4 mt-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Resumo</h3>
          {items.map(i => (
            <div key={i.product.id} className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">{i.quantity}x {i.product.name}</span>
              <span className="text-foreground font-medium">R$ {(i.product.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-border mt-2 pt-2 flex justify-between">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-bold text-primary text-lg">R$ {totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Form */}
        <div className="mt-6 space-y-4">
          {[
            { key: 'name', label: 'Nome completo', placeholder: 'Seu nome' },
            { key: 'phone', label: 'Telefone / WhatsApp', placeholder: '(00) 00000-0000' },
            { key: 'address', label: 'Endereço de entrega', placeholder: 'Rua, número, bairro, cidade' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-sm font-medium text-foreground">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={e => updateField(key, e.target.value)}
                className="mt-1 w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors[key] && <p className="text-xs text-destructive mt-1">{errors[key]}</p>}
            </div>
          ))}
          <div>
            <label className="text-sm font-medium text-foreground">Observações (opcional)</label>
            <textarea
              placeholder="Alguma observação sobre o pedido?"
              value={form.notes}
              onChange={e => updateField('notes', e.target.value)}
              rows={3}
              className="mt-1 w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full mt-6 bg-[#25D366] text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <MessageCircle size={20} />
          Enviar Pedido via WhatsApp
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Checkout;
