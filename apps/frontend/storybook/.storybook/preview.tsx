import type { Preview, Decorator } from '@storybook/react-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import './tailwind.css';

/* Every story sits on the themed surface so tokens (light/dark) are visible. */
const withSurface: Decorator = (Story) => (
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
        order: ['Introduction', 'Foundations', ['Colors', 'Typography'], 'Primitives', 'Components'],
      },
    },
    a11y: { test: 'todo' },
  },
  decorators: [
    withSurface,
    withThemeByClassName({
      themes: { Light: '', Dark: 'dark' },
      defaultTheme: 'Light',
      parentSelector: 'html',
    }),
  ],
  tags: ['autodocs'],
};

export default preview;
