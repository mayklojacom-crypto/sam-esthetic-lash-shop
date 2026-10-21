import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ShieldCheck, CreditCard, Loader2, Lock, MapPin, User, Phone, FileText, ChevronRight, Copy, Check, QrCode } from 'lucide-react';
import whatsappIcon from '@/assets/whatsapp-icon.png';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import DeliveryConsultation from '@/components/DeliveryConsultation';
import CheckoutTotals from '@/components/CheckoutTotals';
import { useDelivery } from '@/contexts/DeliveryContext';
import { checkoutTotals, formatBRL, isServedCity } from '@/lib/checkoutRules';

const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'Nome é obrigatório').max(100),
  cpf: z.string().trim().min(11, 'CPF inválido').max(14),
  email: z.string().trim().email('E-mail inválido'),
  phone: z.string().trim().min(10, 'Telefone inválido').max(20),
  cep: z.string().trim().min(8, 'CEP inválido').max(9),
  street: z.string().trim().min(2, 'Rua é obrigatória').max(200),
  number: z.string().trim().min(1, 'Número é obrigatório').max(10),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().trim().min(2, 'Bairro é obrigatório').max(100),
  city: z.string().trim().min(2, 'Cidade é obrigatória').max(100),
  state: z.string().trim().min(2, 'Estado é obrigatório').max(2),
  notes: z.string().max(500).optional(),
});

const WHATSAPP_NUMBER = '5562998755213';

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatCEP = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

// Cupons agora vêm do banco (tabela public.coupons) — validados em tempo real

const CUSTOMER_KEY = 'sam-customer-data';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOMER_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {
      name: '', cpf: '', email: '', phone: '',
      cep: '', street: '', number: '', complement: '',
      neighborhood: '', city: '', state: '', notes: ''
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingMP, setLoadingMP] = useState(false);
  const loadingCEP = false;
  const { delivery } = useDelivery();
  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  // Pix payment state
  const [pixData, setPixData] = useState<{
    payment_id: number;
    qr_code_base64: string;
    qr_code: string;
    external_reference: string;
  } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixStatus, setPixStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingStartRef = useRef<number>(0);

  // Persist customer data on every change
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(form));
    } catch { /* ignore */ }
  }, [form]);

  const totals = checkoutTotals(totalPrice, appliedCoupon?.discount || 0, delivery?.price ?? null);
  const finalTotal = totals.productsTotal;

  useEffect(() => {
    if (delivery) setForm(prev => ({ ...prev, ...delivery.address }));
    else setStep(0);
  }, [delivery]);

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const { data, error } = await (supabase as any)
      .from('coupons')
      .select('code, discount_percent')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle();
    if (error || !data) {
      toast.error('Cupom inválido ou expirado');
      return;
    }
    const discount = Number(data.discount_percent) / 100;
    setAppliedCoupon({ code: data.code, discount });
    toast.success(`Cupom ${data.code} aplicado! Você economizou ${(discount * 100).toFixed(0)}% 🎉`);
    setCouponInput('');
  };


  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Start polling when pixData is set
  useEffect(() => {
    if (!pixData || pixStatus !== 'pending') return;

    pollingStartRef.current = Date.now();
    pollingRef.current = setInterval(async () => {
      // Stop after 30 minutes
      if (Date.now() - pollingStartRef.current > 30 * 60 * 1000) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        toast.error('Tempo expirado. Gere um novo pagamento.');
        setPixData(null);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-payment-status', {
          body: { payment_id: pixData.payment_id },
        });

        if (error) return;

        if (data?.status === 'approved') {
          setPixStatus('approved');
          if (pollingRef.current) clearInterval(pollingRef.current);
          clearCart();
          toast.success('Pagamento aprovado! 🎉');
          navigate(`/obrigado?pedido=${pixData.external_reference}`);
        } else if (data?.status === 'rejected' || data?.status === 'cancelled') {
          setPixStatus('rejected');
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast.error('Pagamento recusado. Tente novamente.');
          setPixData(null);
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pixData, pixStatus, clearCart, navigate]);

  if (items.length === 0) {
    navigate('/carrinho');
    return null;
  }

  const validate = (fields?: string[]) => {
    const result = checkoutSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(e => {
        const key = e.path[0] as string;
        if (!fields || fields.includes(key)) {
          fieldErrors[key] = e.message;
        }
      });
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...fieldErrors }));
        return null;
      }
    }
    if (fields) {
      const cleaned = { ...errors };
      fields.forEach(f => delete cleaned[f]);
      setErrors(cleaned);
    } else {
      setErrors({});
    }
    return result.success ? result.data : null;
  };

  const validateStep1 = () => {
    const fields = ['name', 'cpf', 'email', 'phone'];
    const result = checkoutSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(e => {
        const key = e.path[0] as string;
        if (fields.includes(key)) fieldErrors[key] = e.message;
      });
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return false;
      }
    }
    setErrors({});
    return true;
  };

  const buildAddress = () => {
    const parts = [form.street, form.number];
    if (form.complement) parts.push(form.complement);
    parts.push(form.neighborhood, `${form.city} - ${form.state}`, `CEP: ${form.cep}`);
    return parts.join(', ');
  };

  const handleWhatsApp = async () => {
    if (!delivery || !isServedCity(form.city, form.state) || form.cep.replace(/\D/g, '') !== delivery.address.cep) {
      setStep(0);
      toast.error('Consulte um endereço na nossa área de entrega antes de continuar.');
      return;
    }
    const data = validate();
    if (!data) return;

    const shippingText = '*Frete:* Entrega local por aplicativo (Uber/99Pop) — valor e prazo a confirmar; não incluído no subtotal';

    const itemsList = items
      .map(i => {
        const sizeText = i.selectedSize ? ` (${i.selectedSize})` : '';
        return `▪️ ${i.quantity}x ${i.product.name}${sizeText} — ${formatBRL(i.product.price * i.quantity)}`;
      })
      .join('\n');

    const message = `🛍️ *NOVO PEDIDO — Sam Esthetic*\n\n` +
      `*Cliente:* ${data.name}\n` +
      `*CPF:* ${data.cpf}\n` +
      `*E-mail:* ${data.email}\n` +
      `*Telefone:* ${data.phone}\n` +
      `*Endereço:* ${buildAddress()}\n` +
      `${data.notes ? `*Obs:* ${data.notes}\n` : ''}` +
      `\n*Itens:*\n${itemsList}\n\n` +
      `${shippingText}\n` +
      `💰 *Subtotal dos produtos: ${formatBRL(finalTotal)}*\n*Total com frete:* a confirmar`;

    // Save lead (fire-and-forget — não bloqueia a ida ao WhatsApp)
    try {
      await supabase.functions.invoke('create-lead', {
        body: {
          customer_name: data.name,
          customer_phone: data.phone,
          items: items.map(i => ({
            name: i.product.name,
            quantity: i.quantity,
            price: i.product.price,
            size: i.selectedSize || null,
          })),
          total: finalTotal,
        },
      });
    } catch {
      // ignora — não bloqueia o fluxo do cliente
    }

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
    clearCart();
    toast.success('Conversa aberta no WhatsApp. O pedido ainda depende de confirmação.');
    navigate('/');
  };

  const handlePixPayment = async () => {
    if (!delivery || totals.total === null) {
      toast.error('O frete precisa ser confirmado antes do pagamento online.');
      return;
    }
    const data = validate();
    if (!data) return;

    setLoadingMP(true);
    try {
      const mpItems = items.map(i => ({
        name: i.selectedSize ? `${i.product.name} (${i.selectedSize})` : i.product.name,
        quantity: i.quantity,
        price: i.product.price,
      }));

      const { data: response, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          items: mpItems,
          customer: {
            name: data.name,
            cpf: data.cpf,
            email: data.email,
            phone: data.phone,
            address: buildAddress(),
            notes: data.notes || '',
          },
        },
      });

      if (error) throw error;

      if (response?.qr_code_base64 && response?.qr_code) {
        setPixData({
          payment_id: response.payment_id,
          qr_code_base64: response.qr_code_base64,
          qr_code: response.qr_code,
          external_reference: response.external_reference,
        });
        setPixStatus('pending');
        toast.success('QR Code Pix gerado! Escaneie para pagar.');
      } else {
        throw new Error('QR Code não retornado');
      }
    } catch (err) {
      console.error('Pix payment error:', err);
      toast.error('Erro ao gerar pagamento Pix. Tente novamente.');
    } finally {
      setLoadingMP(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixData?.qr_code) return;
    navigator.clipboard.writeText(pixData.qr_code);
    setPixCopied(true);
    toast.success('Código Pix copiado!');
    setTimeout(() => setPixCopied(false), 3000);
  };

  const updateField = (field: string, value: string) => {
    let formatted = value;
    if (field === 'cpf') formatted = formatCPF(value);
    if (field === 'phone') formatted = formatPhone(value);
    if (field === 'cep') {
      formatted = formatCEP(value);

    }
    if (['cep', 'city', 'state'].includes(field)) return;
    setForm(prev => ({ ...prev, [field]: formatted }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const renderInput = (field: string, label: string, placeholder: string, icon: React.ReactNode, type = 'text', className = '', disabled = false) => (
    <div className={className} key={field}>
      <label htmlFor={`checkout-${field}`} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
          {icon}
        </div>
        <input
          id={`checkout-${field}`}
          type={type}
          placeholder={placeholder}
          value={form[field as keyof typeof form]}
          onChange={e => updateField(field, e.target.value)}
          disabled={disabled}
          className="w-full bg-background rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 font-medium disabled:opacity-60"
        />
      </div>
      {errors[field] && (
        <p className="text-xs text-destructive mt-1 font-medium">{errors[field]}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <div className="max-w-5xl mx-auto px-4 mt-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 font-medium hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Button>

        <div className="flex flex-wrap gap-3 mb-6 text-sm font-semibold text-muted-foreground" aria-label="Etapas do checkout">
          <span className={step === 0 ? 'text-primary' : ''}>1 · Entrega e valores</span>
          <span className={step === 1 ? 'text-primary' : ''}>2 · Seus dados</span>
          <span className={step === 2 ? 'text-primary' : ''}>3 · Finalização</span>
        </div>

        <div className="md:grid md:grid-cols-[1fr_380px] md:gap-6">
          {/* Left Column - Form */}
          <div className="space-y-5">
            <DeliveryConsultation />
            {step === 0 && <>
              <CheckoutTotals subtotal={totalPrice} discountRate={appliedCoupon?.discount || 0} />
              <Button className="w-full" disabled={!delivery} onClick={() => setStep(1)}>Continuar com meus dados <ChevronRight /></Button>
            </>}
            {step === 1 && (
              <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm animate-fade-in">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-5">
                  <User size={18} className="text-primary" />
                  Dados Pessoais
                </h2>

                <div className="space-y-4">
                  {renderInput('name', 'Nome completo', 'Seu nome completo', <User size={16} />)}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderInput('cpf', 'CPF', '000.000.000-00', <FileText size={16} />)}
                    {renderInput('phone', 'Telefone / WhatsApp', '(00) 00000-0000', <Phone size={16} />)}
                  </div>

                  {renderInput('email', 'E-mail', 'seu@email.com', <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>, 'email')}
                </div>

                <Button
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="w-full mt-6 bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all text-sm"
                >
                  Continuar <ChevronRight size={16} />
                </Button>
              </div>
            )}

            {step === 2 && (
              <>
                {/* Personal data summary */}
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{form.name}</p>
                        <p className="text-xs text-muted-foreground">{form.email} • {form.phone}</p>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => setStep(1)} className="text-xs text-primary font-semibold hover:underline">
                      Editar
                    </Button>
                  </div>
                </div>

                {/* Address Form */}
                <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm animate-fade-in">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-5">
                    <MapPin size={18} className="text-primary" />
                    Endereço de Entrega
                  </h2>

                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{delivery?.address.city} / GO · CEP {delivery?.address.cep}</p>

                    {renderInput('street', 'Rua / Avenida', 'Nome da rua', <MapPin size={16} />, 'text', '', loadingCEP)}

                    <div className="grid grid-cols-2 gap-4">
                      {renderInput('number', 'Número', 'Nº', <span className="text-xs font-bold">Nº</span>)}
                      {renderInput('complement', 'Complemento', 'Apto, bloco...', <span className="text-xs">🏠</span>)}
                    </div>

                    {renderInput('neighborhood', 'Bairro', 'Seu bairro', <MapPin size={16} />, 'text', '', loadingCEP)}

                  </div>
                </div>

                {/* Notes */}
                <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm animate-fade-in">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
                    📝 Observações
                  </h2>
                  <textarea
                    placeholder="Alguma observação sobre o pedido? (opcional)"
                    value={form.notes}
                    onChange={e => updateField('notes', e.target.value)}
                    rows={3}
                    className="w-full bg-background rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 resize-none font-medium"
                  />
                </div>

                {/* Payment Section */}
                <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm animate-fade-in">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-5">
                    <CreditCard size={18} className="text-primary" />
                    Forma de Pagamento
                  </h2>

                  {/* Pix QR Code Display */}
                  {pixData && pixStatus === 'pending' ? (
                    <div className="space-y-4">
                      <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-5 text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <Loader2 size={16} className="animate-spin text-primary" />
                          <span className="text-sm font-semibold text-primary">Aguardando pagamento...</span>
                        </div>

                        <img
                          src={`data:image/png;base64,${pixData.qr_code_base64}`}
                          alt="QR Code Pix"
                          className="mx-auto w-48 h-48 rounded-lg border border-border"
                        />

                        <p className="text-xs text-muted-foreground mt-3 mb-2">
                          Escaneie o QR Code acima com seu app bancário
                        </p>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={pixData.qr_code}
                            readOnly
                            className="flex-1 bg-background rounded-lg px-3 py-2 text-xs text-foreground border border-border truncate font-mono"
                          />
                          <Button
                            onClick={handleCopyPix}
                            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/90 transition-all whitespace-nowrap"
                          >
                            {pixCopied ? <Check size={14} /> : <Copy size={14} />}
                            {pixCopied ? 'Copiado!' : 'Copiar'}
                          </Button>
                        </div>

                        <p className="text-[10px] text-muted-foreground mt-3">
                          ⏱️ O pagamento será confirmado automaticamente. Não feche esta página.
                        </p>
                      </div>

                      <Button
                        onClick={() => {
                          if (pollingRef.current) clearInterval(pollingRef.current);
                          setPixData(null);
                          setPixStatus('pending');
                        }}
                        className="w-full text-sm text-muted-foreground font-medium hover:text-foreground transition-colors py-2"
                      >
                        ← Cancelar e escolher outro método
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        onClick={handlePixPayment}
                        disabled={loadingMP || totals.total === null}
                        className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 hover:brightness-110 transition-all text-sm disabled:opacity-60"
                      >
                        {loadingMP ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
                        {loadingMP ? 'Gerando QR Code...' : 'Pagar com Pix'}
                      </Button>

                      <p className="text-[11px] text-muted-foreground text-center">
                        Pix disponível após confirmação do frete. Não há cotação automática para a entrega por aplicativo.
                      </p>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground font-medium">ou</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>

                      <Button
                        onClick={handleWhatsApp}
                        className="w-full bg-accent text-accent-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 hover:brightness-110 transition-all text-sm"
                      >
                        <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
                        Combinar entrega pelo WhatsApp
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Column - Order Summary (always visible) */}
          <div className="mt-5 md:mt-0">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm md:sticky md:top-24">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                🧾 Resumo do Pedido
              </h3>
              
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {items.map(i => {
                  const key = i.selectedSize ? `${i.product.id}__${i.selectedSize}` : i.product.id;
                  return (
                    <div key={key} className="flex gap-3 items-center">
                      <img src={i.product.image} alt={i.product.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground line-clamp-1">{i.product.name}</p>
                        {i.selectedSize && <p className="text-[10px] text-muted-foreground">Tam: {i.selectedSize}</p>}
                        <p className="text-xs text-muted-foreground">Qtd: {i.quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-foreground whitespace-nowrap">
                        {formatBRL(i.product.price * i.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Cupom */}
              <div className="border-t border-border mt-4 pt-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-xs font-bold text-green-700 dark:text-green-400">✓ {appliedCoupon.code}</p>
                      <p className="text-[10px] text-muted-foreground">{(appliedCoupon.discount * 100).toFixed(0)}% de desconto aplicado</p>
                    </div>
                    <Button
                      onClick={() => setAppliedCoupon(null)}
                      className="text-xs text-destructive font-semibold hover:underline"
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Cupom de desconto"
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                      className="flex-1 bg-background rounded-lg px-3 py-2 text-xs text-foreground border border-border outline-none focus:border-primary uppercase font-bold tracking-wider"
                    />
                    <Button
                      onClick={applyCoupon}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/90 transition-all"
                    >
                      Aplicar
                    </Button>
                  </div>
                )}
              </div>

              <CheckoutTotals subtotal={totalPrice} discountRate={appliedCoupon?.discount || 0} />

              {/* Trust badges */}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck size={14} className="text-primary flex-shrink-0" />
                  <span className="text-[11px] font-medium">Compra 100% segura</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock size={14} className="text-primary flex-shrink-0" />
                  <span className="text-[11px] font-medium">Dados protegidos e criptografados</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Checkout;
