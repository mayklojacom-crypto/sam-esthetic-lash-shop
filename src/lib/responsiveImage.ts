import { LOCAL_PRODUCT_IMAGE_VARIANTS } from './localImageVariants';
import { REMOTE_IMAGE_VARIANTS } from './remoteImageVariants';

export const IMAGE_VARIANT_VERSION = 'v1';

/**
 * WebP srcset for an image we hold lighter local copies of:
 * - local /products/<file> photos, or
 * - an EXACT known public store URL (remote originals are never rewritten).
 * Returns null for anything unknown, which then renders as-is.
 */
export function localWebpSrcSet(src: string | undefined | null): string | null {
  if (!src) return null;
  const remote = REMOTE_IMAGE_VARIANTS[src];
  if (remote) {
    return remote.widths
      .map(w => `/products/opt-remote/${encodeURIComponent(remote.base)}-${w}.${IMAGE_VARIANT_VERSION}.webp ${w}w`)
      .join(', ');
  }
  const m = src.match(/^\/products\/([^/?#]+\.(?:jpe?g|png))$/i);
  if (!m) return null;
  const widths = LOCAL_PRODUCT_IMAGE_VARIANTS[m[1]];
  if (!widths?.length) return null;
  const base = m[1].replace(/\.[^.]+$/, '');
  return widths.map(w => `/products/opt/${encodeURIComponent(base)}-${w}.${IMAGE_VARIANT_VERSION}.webp ${w}w`).join(', ');
}

/** Intrinsic size of a known remote image, for explicit width/height. */
export function knownImageSize(src: string | undefined | null): { width: number; height: number } | null {
  const v = src ? REMOTE_IMAGE_VARIANTS[src] : undefined;
  return v ? { width: v.width, height: v.height } : null;
}
