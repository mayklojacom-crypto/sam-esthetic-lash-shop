import whatsappIcon from '@/assets/whatsapp-icon.png';

const WHATSAPP_NUMBER = '5562998755213';

const WhatsAppFloat = () => {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 md:bottom-6 right-4 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center bg-[#25D366]"
      aria-label="Fale conosco no WhatsApp"
    >
      <img src={whatsappIcon} alt="WhatsApp" className="w-8 h-8" />
    </a>
  );
};

export default WhatsAppFloat;
