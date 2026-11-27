import { Sparkles, TreePine } from 'lucide-react';

/** Seasonal decoration only; no changes to offers or shopping rules. */
const WelcomeStrip = () => {
  return (
    <div className="mx-4 mt-3 mb-1 flex items-center justify-center gap-3 border-b border-festive-gold/25 py-3">
      <TreePine size={24} strokeWidth={1.5} className="shrink-0 text-festive-pine" aria-hidden="true" />
      <div className="text-center">
        <p className="font-hand text-2xl leading-tight text-primary">Um fim de ano cheio de beleza</p>
        <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">Natal com carinho · Ano Novo com brilho</p>
      </div>
      <Sparkles size={23} strokeWidth={1.5} className="shrink-0 text-festive-gold" aria-hidden="true" />
    </div>
  );
};

export default WelcomeStrip;
