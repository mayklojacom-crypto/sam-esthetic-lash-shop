import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';

// Contador regressivo até meia-noite (oferta diária)
const getTimeLeft = () => {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = end.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s };
};

const pad = (n: number) => n.toString().padStart(2, '0');

const UrgencyBar = () => {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const i = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="bg-gradient-to-r from-primary via-accent to-primary text-white text-center py-2 px-4 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-2 flex-wrap">
      <Flame size={14} className="animate-pulse" />
      <span>OFERTAS RELÂMPAGO encerram em</span>
      <span className="bg-white/20 backdrop-blur rounded px-2 py-0.5 font-mono tracking-wider">
        {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
      </span>
    </div>
  );
};

export default UrgencyBar;
