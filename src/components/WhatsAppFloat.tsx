import { useState } from 'react';
import whatsappIcon from '@/assets/whatsapp-icon.png';
import WhatsAppLeadModal from './WhatsAppLeadModal';
import { useCart } from '@/contexts/CartContext';

const WhatsAppFloat = () => {
  const [open, setOpen] = useState(false);
  const { items } = useCart();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center bg-[#25D366]"
        aria-label="Fale conosco no WhatsApp"
      >
        <img src={whatsappIcon} alt="WhatsApp" className="w-8 h-8" />
      </button>
      <WhatsAppLeadModal open={open} onOpenChange={setOpen} mode={items.length > 0 ? 'order' : 'contact'} />
    </>
  );
};

export default WhatsAppFloat;
