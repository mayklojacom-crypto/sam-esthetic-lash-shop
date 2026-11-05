import whatsappIcon from '@/assets/whatsapp-icon.png';
import { track } from '@/lib/analytics';

const WHATSAPP_NUMBER = '5562998755213';

/** Secondary help link only: opens a question to the store, never creates or finalizes an order. */
export default function SupportLink({ source }: { source: 'checkout' | 'carrinho' }) {
  const text = encodeURIComponent('Olá Sam Esthetic! Estou finalizando uma compra no site e tenho uma dúvida.');
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track.whatsappContact(source, 'contact')}
      className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground underline underline-offset-2 hover:text-primary"
    >
      <img src={whatsappIcon} alt="" className="w-3.5 h-3.5" /> Precisa de ajuda? Fale com a gente
    </a>
  );
}
