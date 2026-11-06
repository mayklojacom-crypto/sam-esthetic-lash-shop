import { forwardRef, type ImgHTMLAttributes } from 'react';
import { localWebpSrcSet } from '@/lib/responsiveImage';

type Props = ImgHTMLAttributes<HTMLImageElement> & { src: string; sizes?: string; priority?: boolean };

/**
 * <picture> with a local WebP srcset when available; the original src stays as the <img>
 * fallback, so browsers without WebP (or a missing variant) still get the original photo.
 */
const ResponsiveImage = forwardRef<HTMLImageElement, Props>(({ src, sizes, priority, loading, ...img }, ref) => {
  const webp = localWebpSrcSet(src);
  const el = (
    <img
      ref={ref}
      src={src}
      loading={priority ? 'eager' : loading ?? 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      {...(priority ? { fetchpriority: 'high' } : {})}
      {...img}
    />
  );
  if (!webp) return el;
  return (
    <picture>
      <source type="image/webp" srcSet={webp} sizes={sizes} />
      {el}
    </picture>
  );
});
ResponsiveImage.displayName = 'ResponsiveImage';
export default ResponsiveImage;
