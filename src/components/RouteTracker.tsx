import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '@/lib/analytics';

/** One GA4 page_view per SPA navigation; query strings (e.g. order reference) are left out. */
const RouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    const measure = () => track.pageView(location.pathname, location.key);
    measure();
    // Late consent: measure only the current page; once() keeps it to one per navigation.
    window.addEventListener('sam-consent-change', measure);
    return () => window.removeEventListener('sam-consent-change', measure);
  }, [location.key, location.pathname]);
  return null;
};
export default RouteTracker;
