import type { Product } from '@/data/products';

export type BlogRenderBlock =
  | { type: 'html'; html: string }
  | { type: 'product'; product: Product };

/**
 * Divide o HTML do post em blocos top-level (parágrafos, headings, etc.)
 * e intercala cards de produto em pontos estratégicos.
 *
 * Regras:
 * - Nunca antes do 2º parágrafo.
 * - Preferir inserir logo após um <h2> ou depois de parágrafos longos (>350 chars de texto).
 * - Espaçar as inserções (mínimo 3 blocos entre uma e outra).
 * - Máx. min(produtos.length, 3) inserções inline.
 * - Nunca insere depois do último bloco (o final tem seção própria).
 */
export function buildBlogBlocks(html: string, products: Product[]): {
  blocks: BlogRenderBlock[];
  usedProductIds: string[];
} {
  if (typeof window === 'undefined' || !html) {
    return { blocks: [{ type: 'html', html }], usedProductIds: [] };
  }

  const container = document.createElement('div');
  container.innerHTML = html;

  const nodes = Array.from(container.children) as HTMLElement[];
  if (nodes.length === 0) {
    return { blocks: [{ type: 'html', html }], usedProductIds: [] };
  }

  // Candidatos = índices onde faz sentido inserir DEPOIS do bloco
  const paragraphCountUpTo: number[] = [];
  let pCount = 0;
  nodes.forEach((n, i) => {
    if (n.tagName === 'P') pCount++;
    paragraphCountUpTo[i] = pCount;
  });

  const candidates: { index: number; score: number }[] = [];
  nodes.forEach((n, i) => {
    if (i === nodes.length - 1) return; // nunca após o último
    if (paragraphCountUpTo[i] < 2) return; // pelo menos 2 parágrafos antes

    const tag = n.tagName;
    const text = (n.textContent || '').trim();
    let score = 0;

    if (tag === 'H2') score = 10;
    else if (tag === 'H3') score = 7;
    else if (tag === 'P' && text.length > 350) score = 6;
    else if (tag === 'P' && text.length > 180) score = 3;
    else if (tag === 'UL' || tag === 'OL') score = 4;

    if (score > 0) candidates.push({ index: i, score });
  });

  // Ordena por score desc, mas mantendo índices únicos
  candidates.sort((a, b) => b.score - a.score);

  const maxInserts = Math.min(products.length, 3);
  const chosen: number[] = [];
  const MIN_GAP = 3;

  for (const c of candidates) {
    if (chosen.length >= maxInserts) break;
    if (chosen.every((idx) => Math.abs(idx - c.index) >= MIN_GAP)) {
      chosen.push(c.index);
    }
  }

  // Se não achou pontos suficientes (posts curtos), tenta fallback: depois do 2º parágrafo
  if (chosen.length === 0 && products.length > 0 && paragraphCountUpTo[nodes.length - 1] >= 3) {
    const idx = nodes.findIndex((_, i) => paragraphCountUpTo[i] === 2 && nodes[i].tagName === 'P');
    if (idx > -1 && idx < nodes.length - 1) chosen.push(idx);
  }

  chosen.sort((a, b) => a - b);

  const blocks: BlogRenderBlock[] = [];
  const usedProductIds: string[] = [];
  let productCursor = 0;

  nodes.forEach((n, i) => {
    blocks.push({ type: 'html', html: n.outerHTML });
    if (chosen.includes(i) && productCursor < products.length) {
      const product = products[productCursor++];
      usedProductIds.push(product.id);
      blocks.push({ type: 'product', product });
    }
  });

  return { blocks, usedProductIds };
}

/** Old blog slugs that point to a product now published under another slug (same model only). */
export const BLOG_PRODUCT_SLUG_ALIASES: Record<string, string> = {
  'pinca-nagaraku-n07': 'pinca-nagaraku-n07-acoplar',
  'higrometro-pequeno': 'higrometro',
};

const OWN_HOSTS = new Set(['samestheticlash.shop', 'www.samestheticlash.shop']);

function productSlugFromHref(href: string): string | null {
  let path = href.trim();
  if (/^https?:\/\//i.test(path)) {
    try {
      const u = new URL(path);
      if (!OWN_HOSTS.has(u.hostname.toLowerCase())) return null; // external link: leave alone
      path = u.pathname;
    } catch { return null; }
  }
  const m = path.match(/^\/produto\/([^/?#]+)\/?(?:[?#].*)?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Render-time fix for /produto/ links inside blog HTML (the stored post is not changed).
 * - activeSlugs null = catalog not ready yet: links are left untouched.
 * - Known alias whose destination is active: link points to the destination.
 * - Product not in the active catalog: the link is removed, its text stays.
 * - External links are never touched.
 */
export function fixBlogProductLinks(html: string, activeSlugs: Set<string> | null): string {
  if (!html || !activeSlugs || typeof document === 'undefined') return html;
  const container = document.createElement('div');
  container.innerHTML = html;
  container.querySelectorAll('a[href]').forEach((a) => {
    const slug = productSlugFromHref(a.getAttribute('href') || '');
    if (!slug) return;
    if (activeSlugs.has(slug)) return;
    const alias = BLOG_PRODUCT_SLUG_ALIASES[slug];
    if (alias && activeSlugs.has(alias)) {
      a.setAttribute('href', `/produto/${alias}`);
      return;
    }
    const span = document.createElement('span');
    while (a.firstChild) span.appendChild(a.firstChild);
    a.replaceWith(span);
  });
  return container.innerHTML;
}
