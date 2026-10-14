import { badgeCss, versionLabel, type Corner } from './style';

/**
 * Storybook's manager — the sidebar and toolbar shell — is not one of our
 * React trees, so <VersionBadge /> cannot be mounted there. Instead the badge
 * goes in as a script through `managerHead` in .storybook/main.ts:
 *
 *   managerHead: (head) => head + versionBadgeManagerHead(),
 *
 * main.ts runs in Node at build time, where the VITE_APP_VERSION and
 * VITE_APP_COMMIT the Dockerfile sets are plain environment variables. Under
 * `storybook dev` neither is set and the badge reads `local`, exactly like
 * the apps.
 *
 * Bottom-left by default: the manager's own bottom-right corner is where the
 * addons panel toggle lives.
 */
export function versionBadgeManagerHead(corner: Corner = 'bottom-left'): string {
  const version = process.env.VITE_APP_VERSION || 'local';
  const commit = process.env.VITE_APP_COMMIT || '';
  const label = versionLabel(version);
  const title = commit ? `build ${commit}` : '';

  // The head is parsed before <body> exists, so mounting waits for the DOM.
  return [
    '<script>',
    '(function () {',
    '  function mount() {',
    "    var badge = document.createElement('div');",
    "    badge.setAttribute('data-testid', 'version-badge');",
    `    badge.setAttribute('style', ${JSON.stringify(badgeCss(corner))});`,
    `    badge.textContent = ${JSON.stringify(label)};`,
    title ? `    badge.title = ${JSON.stringify(title)};` : '',
    '    document.body.appendChild(badge);',
    '  }',
    "  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);",
    '})();',
    '</script>',
  ]
    .filter(Boolean)
    .join('\n');
}
