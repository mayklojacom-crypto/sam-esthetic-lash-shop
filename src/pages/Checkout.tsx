import { useState } from 'react';
import { ArrowLeft, MessageCircle, ShieldCheck, CreditCard, Loader2, Lock, MapPin, User, Phone, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

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

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

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

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const [form, setForm] = useState({
    name: '', cpf: '', email: '', phone: '',
    cep: '', street: '', number: '', complement: '',
    neighborhood: '', city: '', state: '', notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingMP, setLoadingMP] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

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

  const fetchCEP = async (cep: string) => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setLoadingCEP(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
        setErrors(prev => {
          const cleaned = { ...prev };
          delete cleaned.street;
          delete cleaned.neighborhood;
          delete cleaned.city;
          delete cleaned.state;
          return cleaned;
        });
      }
    } catch { /* ignore */ }
    setLoadingCEP(false);
  };

  const buildAddress = () => {
    const parts = [form.street, form.number];
    if (form.complement) parts.push(form.complement);
    parts.push(form.neighborhood, `${form.city} - ${form.state}`, `CEP: ${form.cep}`);
    return parts.join(', ');
  };

  const handleWhatsApp = () => {
    const data = validate();
    if (!data) return;

    const itemsList = items
      .map(i => `▪️ ${i.quantity}x ${i.product.name} — R$ ${(i.product.price * i.quantity).toFixed(2)}`)
      .join('\n');

    const message = `🛍️ *NOVO PEDIDO — Sam Esthetic*\n\n` +
      `*Cliente:* ${data.name}\n` +
      `*CPF:* ${data.cpf}\n` +
      `*E-mail:* ${data.email}\n` +
      `*Telefone:* ${data.phone}\n` +
      `*Endereço:* ${buildAddress()}\n` +
      `${data.notes ? `*Obs:* ${data.notes}\n` : ''}` +
      `\n*Itens:*\n${itemsList}\n\n` +
      `💰 *Total: R$ ${totalPrice.toFixed(2)}*`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
    clearCart();
    toast.success('Pedido enviado pelo WhatsApp! 🎉');
    navigate('/');
  };

  const handleMercadoPago = async () => {
    const data = validate();
    if (!data) return;

    setLoadingMP(true);
    try {
      const mpItems = items.map(i => ({
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
      }));

      const { data: response, error } = await supabase.functions.invoke('create-mp-preference', {
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
          siteUrl: 'https://samestheticlash.shop',
        },
      });

      if (error) throw error;
      if (response?.init_point) {
        window.location.href = response.init_point;
      } else {
        throw new Error('No payment URL returned');
      }
    } catch (err) {
      console.error('Mercado Pago error:', err);
      toast.error('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoadingMP(false);
    }
  };

  const updateField = (field: string, value: string) => {
    let formatted = value;
    if (field === 'cpf') formatted = formatCPF(value);
    if (field === 'phone') formatted = formatPhone(value);
    if (field === 'cep') {
      formatted = formatCEP(value);
      if (formatted.replace(/\D/g, '').length === 8) fetchCEP(formatted);
    }
    setForm(prev => ({ ...prev, [field]: formatted }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const renderInput = (field: string, label: string, placeholder: string, icon: React.ReactNode, type = 'text', className = '', disabled = false) => (
    <div className={className} key={field}>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
          {icon}
        </div>
        <input
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
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 font-medium hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Voltar
        </button>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</span>
            Dados Pessoais
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</span>
            Entrega & Pagamento
          </div>
        </div>

        <div className="md:grid md:grid-cols-[1fr_380px] md:gap-6">
          {/* Left Column - Form */}
          <div className="space-y-5">
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

                <button
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="w-full mt-6 bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all text-sm"
                >
                  Continuar <ChevronRight size={16} />
                </button>
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
                    <button onClick={() => setStep(1)} className="text-xs text-primary font-semibold hover:underline">
                      Editar
                    </button>
                  </div>
                </div>

                {/* Address Form */}
                <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm animate-fade-in">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-5">
                    <MapPin size={18} className="text-primary" />
                    Endereço de Entrega
                  </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                      <div className="relative">
                        {renderInput('cep', 'CEP', '00000-000', <MapPin size={16} />)}
                        {loadingCEP && (
                          <Loader2 size={14} className="absolute right-3 top-9 animate-spin text-primary" />
                        )}
                      </div>
                      <div className="flex items-end">
                        <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary font-medium hover:underline whitespace-nowrap pb-3">
                          Não sei meu CEP
                        </a>
                      </div>
                    </div>

                    {renderInput('street', 'Rua / Avenida', 'Nome da rua', <MapPin size={16} />, 'text', '', loadingCEP)}

                    <div className="grid grid-cols-2 gap-4">
                      {renderInput('number', 'Número', 'Nº', <span className="text-xs font-bold">Nº</span>)}
                      {renderInput('complement', 'Complemento', 'Apto, bloco...', <span className="text-xs">🏠</span>)}
                    </div>

                    {renderInput('neighborhood', 'Bairro', 'Seu bairro', <MapPin size={16} />, 'text', '', loadingCEP)}

                    <div className="grid grid-cols-[1fr_100px] gap-4">
                      {renderInput('city', 'Cidade', 'Sua cidade', <MapPin size={16} />, 'text', '', loadingCEP)}
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                          UF
                        </label>
                        <select
                          value={form.state}
                          onChange={e => updateField('state', e.target.value)}
                          disabled={loadingCEP}
                          className="w-full bg-background rounded-xl px-3 py-3 text-sm text-foreground outline-none border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 font-medium disabled:opacity-60"
                        >
                          <option value="">UF</option>
                          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {errors.state && <p className="text-xs text-destructive mt-1 font-medium">{errors.state}</p>}
                      </div>
                    </div>
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

                {/* Payment Buttons */}
                <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm animate-fade-in">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-5">
                    <CreditCard size={18} className="text-primary" />
                    Forma de Pagamento
                  </h2>

                  <div className="space-y-3">
                    <button
                      onClick={handleMercadoPago}
                      disabled={loadingMP}
                      className="w-full bg-[#009ee3] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 hover:brightness-110 transition-all text-sm disabled:opacity-60"
                    >
                      {loadingMP ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                      {loadingMP ? 'Processando...' : 'Pagar com Mercado Pago'}
                    </button>

                    <p className="text-[11px] text-muted-foreground text-center">
                      Pix, Cartão de Crédito e Boleto disponíveis
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground font-medium">ou</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <button
                      onClick={handleWhatsApp}
                      className="w-full bg-[#25D366] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 hover:brightness-110 transition-all text-sm"
                    >
                      <MessageCircle size={18} />
                      Enviar Pedido via WhatsApp
                    </button>
                  </div>
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
                {items.map(i => (
                  <div key={i.product.id} className="flex gap-3 items-center">
                    <img src={i.product.image} alt={i.product.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground line-clamp-1">{i.product.name}</p>
                      <p className="text-xs text-muted-foreground">Qtd: {i.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-foreground whitespace-nowrap">
                      R$ {(i.product.price * i.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">R$ {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="text-xs text-primary font-medium">A combinar</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">Total</span>
                  <span className="text-xl font-extrabold text-primary">R$ {totalPrice.toFixed(2)}</span>
                </div>
              </div>

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
