import type { Preview, Decorator } from '@storybook/react-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import { ThemeProvider } from 'next-themes';
import { MemoryRouter } from 'react-router';
import { Toaster } from '@mockups/web-ui';
import './tailwind.css';

/**
 * `withThemeByClassName` owns the `.dark` class on <html> — that's the repo
 * convention, and the web token layer keys its dark variant off exactly that
 * class. next-themes is mounted alongside it in `forcedTheme` mode purely so
 * components that *read* the theme keep working (ThemeToggle, and AppShell's
 * light/dark logo swap). It's told what the addon already decided rather than
 * being allowed to decide for itself, so the two can't disagree.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme === 'Dark' ? 'dark' : 'light';
  return (
    <ThemeProvider attribute="class" forcedTheme={theme} enableSystem={false}>
      <MemoryRouter>
        <Story />
        <Toaster />
      </MemoryRouter>
    </ThemeProvider>
  );
};

/** Fullscreen stories (app shell, list page) own their padding and height. */
const withSurface: Decorator = (Story, context) =>
  context.parameters.layout === 'fullscreen' ? (
    <div className="bg-background text-foreground h-screen">
      <Story />
    </div>
  ) : (
    <div className="bg-background text-foreground" style={{ padding: 24, minWidth: 320 }}>
      <Story />
    </div>
  );

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i }, expanded: true },
    backgrounds: { disable: true },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Foundations',
          ['Colors', 'Typography', 'Space & shape'],
          'Primitives',
          'Patterns',
          'Layout',
        ],
      },
    },
    a11y: { test: 'todo' },
  },
  decorators: [
    withSurface,
    withTheme,
    withThemeByClassName({
      themes: { Light: '', Dark: 'dark' },
      defaultTheme: 'Light',
      parentSelector: 'html',
    }),
  ],
  tags: ['autodocs'],
};

export default preview;
