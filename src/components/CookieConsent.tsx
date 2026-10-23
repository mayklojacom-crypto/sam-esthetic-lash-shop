import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CONSENT_NOTICE, OPEN_SETTINGS_EVENT, readConsent, saveConsent } from '@/lib/consent';

const CookieConsent = () => {
  const [open, setOpen] = useState(() => !readConsent());
  const [current, setCurrent] = useState(() => readConsent()?.choice ?? null);

  useEffect(() => {
    const show = () => { setCurrent(readConsent()?.choice ?? null); setOpen(true); };
    const sync = () => setCurrent(readConsent()?.choice ?? null);
    window.addEventListener(OPEN_SETTINGS_EVENT, show);
    window.addEventListener('sam-consent-change', sync);
    return () => { window.removeEventListener(OPEN_SETTINGS_EVENT, show); window.removeEventListener('sam-consent-change', sync); };
  }, []);

  if (!open) return null;
  const choose = (c: 'granted' | 'denied') => { saveConsent(c); setCurrent(c); setOpen(false); };

  return (
    <div role="dialog" aria-label="Preferências de cookies"
      className="fixed inset-x-3 bottom-20 md:bottom-4 md:left-auto md:right-4 md:max-w-md z-[60] rounded-2xl border border-border bg-card text-card-foreground shadow-xl p-4 space-y-3">
      <p className="text-sm font-semibold">Cookies 🍪</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{CONSENT_NOTICE} Você pode mudar sua escolha quando quiser em “Cookies” no rodapé. Recusar não impede sua compra.</p>
      {current && <p className="text-xs text-muted-foreground">Escolha atual: {current === 'granted' ? 'aceito' : 'recusado'}.</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => choose('denied')}>Recusar</Button>
        <Button variant="outline" onClick={() => choose('granted')}>Aceitar</Button>
      </div>
    </div>
  );
};

export default CookieConsent;
