import type { AnchorHTMLAttributes } from 'react';
import { Link } from 'react-router';
import { siteHref } from '../lib/navigation';
import { useMotion } from '../lib/motion-context';

export function SiteLink({ href = '/', ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const motion = useMotion();
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) {
    return <a {...props} href={href} />;
  }
  return <Link {...props} to={siteHref(href)} viewTransition={motion} />;
}
