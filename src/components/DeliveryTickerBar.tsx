import { useEffect, useState } from 'react';

// Apenas as 2 mensagens mais importantes, em rotação suave (crossfade)
const messages = [
  '🛵 Entrega por aplicativo em até 30 minutos — Goiânia e Aparecida de Goiânia',
  '⏰ Pedido até as 18h chega ainda hoje',
];

const DeliveryTickerBar = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setIdx(p => (p + 1) % messages.length), 5000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="bg-gradient-to-r from-accent via-primary to-accent text-white px-4 py-2.5 overflow-hidden relative shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-center">
        {/* Altura fixa + mensagens empilhadas: nada de "pulo" na troca */}
        <div className="relative h-[2.6em] sm:h-[1.7em] w-full flex items-center justify-center">
          {messages.map((msg, i) => (
            <p
              key={msg}
              aria-hidden={i !== idx}
              className={`absolute inset-0 flex items-center justify-center text-center text-[11px] sm:text-xs font-extrabold tracking-wide leading-tight transition-opacity duration-700 ease-in-out ${
                i === idx ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {msg}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeliveryTickerBar;
