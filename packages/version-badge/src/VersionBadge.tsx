import { badgeStyle, type Corner } from './style';
import { APP_COMMIT, APP_VERSION_LABEL } from './version';

/**
 * A small fixed pill showing the deployed version: `v1.2.3`, `dev-8abf53d`
 * or `local`. Hover for the commit. Mount it once, next to the app root in
 * main.tsx — outside any router or phone frame — so it is on every screen.
 *
 * Move it with `corner` if a screen has something living bottom-right.
 */
export function VersionBadge({ corner = 'bottom-right' }: { corner?: Corner }) {
  return (
    <div
      data-testid="version-badge"
      title={APP_COMMIT ? `build ${APP_COMMIT}` : undefined}
      style={badgeStyle(corner)}
    >
      {APP_VERSION_LABEL}
    </div>
  );
}
