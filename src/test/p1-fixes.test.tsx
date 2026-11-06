import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { track, setAnalyticsSender, resetAnalyticsMemory, analyticsConfig } from '@/lib/analytics';
import RouteTracker from '@/components/RouteTracker';
import { fixBlogProductLinks } from '@/lib/blogInlineProducts';
import { localWebpSrcSet } from '@/lib/responsiveImage';
import ResponsiveImage from '@/components/ResponsiveImage';

const calls: string[] = [];
let consent = false;
beforeEach(() => {
  calls.length = 0; consent = false; resetAnalyticsMemory();
  setAnalyticsSender((_c, name) => { calls.push(name); });
  Object.assign(analyticsConfig, { ga4MeasurementId: 'G-TEST', consentGranted: () => consent, publicHost: () => true });
});

describe('late consent', () => {
  it('a page view blocked without consent is not consumed', () => {
    track.pageView('/catalogo', 'k1');
    expect(calls).toEqual([]);
    consent = true;
    track.pageView('/catalogo', 'k1');
    track.pageView('/catalogo', 'k1');
    expect(calls).toEqual(['page_view']);
  });
  it('accepting cookies measures the current page once', () => {
    render(<MemoryRouter initialEntries={['/catalogo']}><RouteTracker /></MemoryRouter>);
    expect(calls).toEqual([]);
    consent = true;
    act(() => { window.dispatchEvent(new Event('sam-consent-change')); });
    act(() => { window.dispatchEvent(new Event('sam-consent-change')); });
    expect(calls).toEqual(['page_view']);
  });
  it('refusing cookies keeps sending nothing', () => {
    render(<MemoryRouter initialEntries={['/']}><RouteTracker /></MemoryRouter>);
    act(() => { window.dispatchEvent(new Event('sam-consent-change')); });
    expect(calls).toEqual([]);
  });
});

describe('blog product links', () => {
  const active = new Set(['pinca-nagaraku-n07-acoplar', 'higrometro', 'cola-x']);
  it('known aliases point to the active product', () => {
    const out = fixBlogProductLinks('<p><a href="/produto/pinca-nagaraku-n07">N07</a> <a href="https://samestheticlash.shop/produto/higrometro-pequeno">H</a></p>', active);
    expect(out).toContain('href="/produto/pinca-nagaraku-n07-acoplar"');
    expect(out).toContain('href="/produto/higrometro"');
  });
  it('alias is not applied when the destination is not active', () => {
    const out = fixBlogProductLinks('<p><a href="/produto/pinca-nagaraku-n07">N07</a></p>', new Set(['cola-x']));
    expect(out).toBe('<p><span>N07</span></p>');
  });
  it('missing product loses the link but keeps its text', () => {
    expect(fixBlogProductLinks('<p>Use <a href="/produto/sumiu">a cola Y</a>.</p>', active)).toBe('<p>Use <span>a cola Y</span>.</p>');
  });
  it('active and external links are kept', () => {
    const html = '<p><a href="/produto/cola-x">A</a><a href="https://instagram.com/produto/sumiu">B</a></p>';
    expect(fixBlogProductLinks(html, active)).toBe(html);
  });
  it('catalog not ready: nothing changes', () => {
    const html = '<p><a href="/produto/sumiu">A</a></p>';
    expect(fixBlogProductLinks(html, null)).toBe(html);
  });
});

describe('image fallback', () => {
  it('remote images get no local variant', () => {
    expect(localWebpSrcSet('https://cdn.example.com/products/a.jpg')).toBeNull();
    expect(localWebpSrcSet('/products/nao-existe.jpg')).toBeNull();
  });
  it('local product photo keeps the original as img fallback with a WebP source', () => {
    const { container } = render(<ResponsiveImage src="/products/pote-hermetico.jpg" alt="Pote" />);
    expect(container.querySelector('source')?.getAttribute('srcset')).toContain('/products/opt/pote-hermetico-');
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/products/pote-hermetico.jpg');
    expect(container.querySelector('img')?.getAttribute('loading')).toBe('lazy');
  });
  it('remote image renders plain img with original src', () => {
    const { container } = render(<ResponsiveImage src="https://x.test/a.jpg" alt="" />);
    expect(container.querySelector('picture')).toBeNull();
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://x.test/a.jpg');
  });
});
