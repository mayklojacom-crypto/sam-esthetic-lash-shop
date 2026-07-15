import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import whatsappIcon from '@/assets/whatsapp-icon.png';
import { Loader2, MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '5562998755213';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Contexto opcional: quando não há carrinho, usar mensagem genérica */
  mode?: 'order' | 'contact';
}

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const WhatsAppLeadModal = ({ open, onOpenChange, mode = 'order' }: Props) => {
  const { items, totalPrice, clearCart } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const isOrder = mode === 'order' && items.length > 0;

  const submit = async () => {
    const trimmedName = name.trim();
    const digits = phone.replace(/\D/g, '');
    if (trimmedName.length < 2) return toast.error('Digite seu nome completo');
    if (digits.length < 10) return toast.error('Digite um WhatsApp válido com DDD');

    setLoading(true);
    try {
      // Registra o lead antes de abrir o WhatsApp
      await supabase.functions.invoke('create-lead', {
        body: {
          customer_name: trimmedName,
          customer_phone: phone,
          items: isOrder
            ? items.map(i => ({
                name: i.product.name,
                quantity: i.quantity,
                price: i.product.price,
                size: i.selectedSize || null,
              }))
            : [],
          total: isOrder ? totalPrice : 0,
        },
      });
    } catch {
      // não bloqueia o envio ao WhatsApp
    }

    let message: string;
    if (isOrder) {
      const itemsList = items
        .map(({ product, quantity, selectedSize }) => {
          const sizeText = selectedSize ? ` (${selectedSize})` : '';
          return `▪️ ${quantity}x ${product.name}${sizeText} — R$ ${(product.price * quantity).toFixed(2)}`;
        })
        .join('\n');
      message =
        `🛍️ *Olá Sam Esthetic!*\n\n*Cliente:* ${trimmedName}\n*WhatsApp:* ${phone}\n\nQuero finalizar este pedido:\n\n${itemsList}\n\n` +
        `💰 *Subtotal: R$ ${totalPrice.toFixed(2)}*\n\nAguardo retorno para combinar entrega e pagamento. Obrigado!`;
    } else {
      message = `Olá Sam Esthetic! 💜\n\n*Meu nome:* ${trimmedName}\n*WhatsApp:* ${phone}\n\nGostaria de tirar uma dúvida.`;
    }

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    if (isOrder) clearCart();
    setLoading(false);
    onOpenChange(false);
    setName('');
    setPhone('');
    toast.success('Redirecionando para o WhatsApp… 🎉');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src={whatsappIcon} alt="" className="w-5 h-5" />
            {isOrder ? 'Finalizar pelo WhatsApp' : 'Falar no WhatsApp'}
          </DialogTitle>
          <DialogDescription>
            {isOrder
              ? 'Deixe seu nome e WhatsApp para agilizarmos o atendimento e a entrega.'
              : 'Para te atender melhor, precisamos do seu nome e WhatsApp.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Nome completo</label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria Silva"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">WhatsApp</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(62) 99999-9999"
              inputMode="tel"
              className="mt-1"
            />
          </div>

          {isOrder && (
            <div className="bg-muted/60 rounded-xl p-2.5 text-xs text-muted-foreground">
              {items.length} item(ns) · <span className="font-bold text-foreground">R$ {totalPrice.toFixed(2)}</span>
            </div>
          )}

          <Button
            onClick={submit}
            disabled={loading}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-6 rounded-2xl"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-1.5" />
                {isOrder ? 'Enviar pedido' : 'Abrir conversa'}
              </>
            )}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            Seus dados são usados apenas para o atendimento.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppLeadModal;
