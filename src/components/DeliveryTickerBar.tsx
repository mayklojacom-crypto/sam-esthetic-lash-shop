import { useEffect, useState } from 'react';

const messages = [
  '🛵 Entrega por aplicativo em até 30 minutos para regiões atendidas de Goiânia e Aparecida de Goiânia',
  '💗 pediu, chegou! entrega rápida via app pra Goiânia e Aparecida',
  '✨ mora aqui pertinho? recebe hoje mesmo, amor',
  '☕ pedido até 18h = tá na sua porta ainda hoje',
];

const DeliveryTickerBar = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setIdx(p => (p + 1) % messages.length), 4000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="bg-gradient-to-r from-accent via-primary to-accent text-white px-4 py-2.5 overflow-hidden relative shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-center">
        <p
          key={idx}
          className="text-[11px] sm:text-xs font-extrabold tracking-wide animate-fade-in leading-tight"
        >
          {messages[idx]}
        </p>
      </div>
    </div>
  );
};

export default DeliveryTickerBar;
