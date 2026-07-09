import { useEffect, useState } from 'react';
import lashzinha from '@/assets/stickers/lashzinha.png';

const messages = [
  'oi, lash lover 💗 bora deixar tudo perfeito hoje?',
  'chegou material novinho pra você, amor ✨',
  'qualquer dúvida chama no zap, respondo rapidinho 🤞',
  'você merece o melhor cíliozinho do Brasil 👁️💕',
];

/** Faixinha afetiva — só aparece no mobile pra dar personalidade */
const WelcomeStrip = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setIdx(p => (p + 1) % messages.length), 4500);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="mx-4 mt-3 rounded-2xl gradient-girly px-4 py-3 flex items-center gap-3 shadow-pink relative overflow-hidden">
      <img
        src={lashzinha}
        alt=""
        aria-hidden="true"
        className="w-11 h-11 sticker animate-wiggle shrink-0"
        loading="lazy"
      />
      <p
        key={idx}
        className="font-hand text-lg leading-tight text-primary animate-fade-in"
      >
        {messages[idx]}
      </p>
    </div>
  );
};

export default WelcomeStrip;
