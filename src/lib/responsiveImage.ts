import { LOCAL_PRODUCT_IMAGE_VARIANTS } from './localImageVariants';

export const IMAGE_VARIANT_VERSION = 'v1';

/**
 * WebP srcset for a local /products/<file> image; null for remote or unknown images,
 * which are always rendered as-is (remote files are never rewritten).
 */
export function localWebpSrcSet(src: string | undefined | null): string | null {
  if (!src) return null;
  const m = src.match(/^\/products\/([^/?#]+\.(?:jpe?g|png))$/i);
  if (!m) return null;
  const widths = LOCAL_PRODUCT_IMAGE_VARIANTS[m[1]];
  if (!widths?.length) return null;
  const base = m[1].replace(/\.[^.]+$/, '');
  return widths.map(w => `/products/opt/${encodeURIComponent(base)}-${w}.${IMAGE_VARIANT_VERSION}.webp ${w}w`).join(', ');
}
