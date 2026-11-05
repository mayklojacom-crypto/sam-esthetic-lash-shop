import { Link } from 'react-router-dom';

export default function PolicyLinks({ className = '' }: { className?: string }) {
  return (
    <nav aria-label="Políticas da loja" className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground ${className}`}>
      <Link to="/entrega" className="underline hover:text-primary">Entrega e frete</Link>
      <Link to="/trocas-e-devolucoes" className="underline hover:text-primary">Trocas e devoluções</Link>
      <Link to="/privacidade" className="underline hover:text-primary">Privacidade</Link>
    </nav>
  );
}
