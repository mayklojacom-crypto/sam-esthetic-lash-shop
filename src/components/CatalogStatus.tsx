import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Skeleton grid shown while products load, so the store never looks empty. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Carregando produtos" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/60 bg-card p-2.5 space-y-2.5">
          <div className="aspect-square w-full rounded-xl bg-muted animate-pulse" />
          <div className="h-3 w-4/5 rounded bg-muted animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          <div className="h-8 w-full rounded-md bg-muted animate-pulse" />
        </div>
      ))}
      <span className="sr-only">Carregando produtos…</span>
    </div>
  );
}

/** Honest error state with retry: the failure is shown, never disguised as "no products". */
export function CatalogError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-border bg-card px-5 py-10 text-center space-y-3">
      <p className="text-3xl" aria-hidden="true">🌸</p>
      <p className="font-semibold text-foreground">Não conseguimos carregar os produtos agora</p>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Pode ser uma instabilidade de conexão. Seus itens no carrinho continuam salvos.
      </p>
      <Button onClick={onRetry} className="gap-2"><RefreshCw size={16} /> Tentar novamente</Button>
    </div>
  );
}

export function CatalogEmpty({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-14 animate-fade-in space-y-1">
      <p className="text-4xl mb-2" aria-hidden="true">🔎</p>
      <p className="text-foreground font-semibold">{title}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="pt-3">{action}</div>}
    </div>
  );
}
