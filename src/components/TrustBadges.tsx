import { ShieldCheck, Zap } from 'lucide-react';

const PIX_PATH =
  'M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156';

export default function TrustBadges() {
  const card = 'bg-card rounded-2xl border border-border p-3 flex flex-col items-center gap-2 text-center shadow-sm';
  return (
    <div className="mx-4 mt-6 grid grid-cols-3 gap-3 md:max-w-3xl md:mx-auto">
      <div className={card}>
        <div className="w-10 h-10 rounded-full bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center">
          <ShieldCheck size={22} className="text-emerald-600" strokeWidth={2.2} />
        </div>
        <span className="text-[12px] font-bold text-foreground leading-tight">Compra segura</span>
        <span className="text-[10px] text-muted-foreground leading-tight">
          Pagamento processado pelo <span className="font-semibold text-[#009EE3]">Mercado Pago</span>
        </span>
      </div>
      <div className={card}>
        <div className="w-10 h-10 rounded-full bg-primary/10 ring-1 ring-primary/25 flex items-center justify-center">
          <Zap size={22} className="text-primary fill-primary/20" strokeWidth={2.2} />
        </div>
        <span className="text-[12px] font-bold text-foreground leading-tight">Entrega rápida</span>
        <span className="text-[10px] text-muted-foreground leading-tight">Goiânia e Aparecida de Goiânia</span>
      </div>
      <div className={card}>
        <div className="w-10 h-10 rounded-full bg-[#32BCAD]/10 ring-1 ring-[#32BCAD]/30 flex items-center justify-center">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#32BCAD" role="img" aria-label="Pix">
            <path d={PIX_PATH} />
          </svg>
        </div>
        <span className="text-[12px] font-bold text-foreground leading-tight">Pagamento via Pix</span>
        <span className="text-[10px] text-muted-foreground leading-tight">Aprovação na hora</span>
      </div>
    </div>
  );
}
