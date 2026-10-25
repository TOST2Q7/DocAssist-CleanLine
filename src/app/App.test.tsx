import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { APP_VERSION } from '@/shared/env';
import { App } from './App';

describe('App shell', () => {
  it('renders the app version', () => {
    expect(renderToString(<App />)).toContain(`v${APP_VERSION}`);
  });
});
