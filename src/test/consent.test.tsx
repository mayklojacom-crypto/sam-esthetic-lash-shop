import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CookieConsent from '@/components/CookieConsent';
import { applyConsent, openCookieSettings, readConsent } from '@/lib/consent';
import { act } from 'react';

const tagScripts = () => [...document.querySelectorAll('script')].map(s => s.src).filter(s => /googletagmanager|fbevents/.test(s));

describe('cookie choice', () => {
  beforeEach(() => { localStorage.clear(); });

  it('without a choice no Google/Meta script loads and both buttons are shown, none preselected', () => {
    applyConsent();
    expect(tagScripts()).toEqual([]);
    render(<CookieConsent />);
    expect(screen.getByRole('button', { name: 'Aceitar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Recusar' })).toBeTruthy();
    expect(readConsent()).toBeNull();
  });

  it('refuse: stored, no scripts; reopen; accept loads Google and Meta; revoke afterwards', () => {
    const { unmount } = render(<CookieConsent />);
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    expect(readConsent()?.choice).toBe('denied');
    expect(tagScripts()).toEqual([]);
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => openCookieSettings());
    fireEvent.click(screen.getByRole('button', { name: 'Aceitar' }));
    expect(tagScripts().some(s => s.includes('id=AW-18052419500'))).toBe(true);
    expect(tagScripts().some(s => s.includes('fbevents'))).toBe(true);
    const fbq = (window as unknown as { fbq: { queue: unknown[][] } }).fbq;
    act(() => openCookieSettings());
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    expect(fbq.queue.at(-1)).toEqual(['consent', 'revoke']);
    unmount();
  });
});
