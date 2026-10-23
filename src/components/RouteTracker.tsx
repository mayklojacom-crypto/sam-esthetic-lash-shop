import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '@/lib/analytics';

/** One GA4 page_view per SPA navigation; query strings (e.g. order reference) are left out. */
const RouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    track.pageView(location.pathname, location.key);
  }, [location.key, location.pathname]);
  return null;
};
export default RouteTracker;
