import { useEffect, useState } from 'react';
import { Truck, Zap, MapPin, Clock } from 'lucide-react';

const messages = [
  { icon: Zap, text: 'ENTREGAMOS SEU PRODUTO EM ATÉ 47 MINUTOS EM GOIÂNIA E APARECIDA DE GOIÂNIA' },
  { icon: Truck, text: 'MOTOBOY EXPRESSO • PEDIU, CHEGOU! GOIÂNIA & APARECIDA' },
  { icon: MapPin, text: 'MORA EM GOIÂNIA OU APARECIDA? RECEBA HOJE MESMO EM MINUTOS' },
  { icon: Clock, text: 'PEDIDO ATÉ 18H = ENTREGA NO MESMO DIA NA GRANDE GOIÂNIA' },
];

const DeliveryTickerBar = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setIdx(p => (p + 1) % messages.length), 4000);
    return () => clearInterval(i);
  }, []);

  const Current = messages[idx].icon;

  return (
    <div className="bg-gradient-to-r from-accent via-primary to-accent text-white px-4 py-2.5 overflow-hidden relative shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-center">
        <Current size={16} className="shrink-0 animate-pulse" />
        <p
          key={idx}
          className="text-[11px] sm:text-xs font-extrabold tracking-wide animate-fade-in leading-tight"
        >
          {messages[idx].text}
        </p>
      </div>
    </div>
  );
};

export default DeliveryTickerBar;
