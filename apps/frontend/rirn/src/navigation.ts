import { Link2, MapPin } from 'lucide-react';
import type { NavItem } from '@mockups/web-ui';

/**
 * Company console navigation — deliberately two items.
 *
 * The whole company workflow is "find a retailer, attach my ID". Anything
 * else on this sidebar would be inventing scope the PRD hasn't asked for.
 */
export const navigation: NavItem[] = [
  { name: 'Discover retailers', href: '/', icon: MapPin },
  { name: 'My mappings', href: '/mappings', icon: Link2 },
];

export function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/mappings')) return 'My mappings';
  return 'Discover retailers';
}
