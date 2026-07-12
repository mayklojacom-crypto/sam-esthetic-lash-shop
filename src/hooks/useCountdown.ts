import { useEffect, useState } from 'react';

export interface Countdown {
  d: number;
  h: number;
  m: number;
  s: number;
  total: number; // ms restantes
  expired: boolean;
}

const compute = (target: number): Countdown => {
  const total = target - Date.now();
  if (total <= 0) return { d: 0, h: 0, m: 0, s: 0, total: 0, expired: true };
  const d = Math.floor(total / 86400000);
  const h = Math.floor((total % 86400000) / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  return { d, h, m, s, total, expired: false };
};

export const useCountdown = (endsAt: string | Date | null | undefined): Countdown | null => {
  const target = endsAt ? (endsAt instanceof Date ? endsAt.getTime() : new Date(endsAt).getTime()) : null;
  const [state, setState] = useState<Countdown | null>(target ? compute(target) : null);

  useEffect(() => {
    if (!target) {
      setState(null);
      return;
    }
    setState(compute(target));
    const id = setInterval(() => {
      const next = compute(target);
      setState(next);
      if (next.expired) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  return state;
};

export const pad = (n: number) => n.toString().padStart(2, '0');
