import { useLocation } from 'react-router';

// Query routes keep the same document path under /builds/<branch>/<commit>/.
// The hash remains available for the website's section links.
export function siteHref(href: string): string {
  if (href === '/') return '?';
  if (href.startsWith('/#')) return `?${href.slice(1)}`;
  if (href === '/how-it-works' || href === '/about-qwipo') return `?page=${href.slice(1)}`;
  return href;
}

export function useSitePathname(): string {
  const { search } = useLocation();
  const page = new URLSearchParams(search).get('page');
  return page ? `/${page}` : '/';
}
