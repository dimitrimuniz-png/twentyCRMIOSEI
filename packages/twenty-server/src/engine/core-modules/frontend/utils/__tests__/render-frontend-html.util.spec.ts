import { readFileSync } from 'fs';
import { join } from 'path';

import { type ClientConfig } from 'src/engine/core-modules/client-config/client-config.entity';
import { renderFrontendHtml } from 'src/engine/core-modules/frontend/utils/render-frontend-html.util';

const clientConfig = {
  apiUrl: 'https://crm-iosei.com/graphql',
} as ClientConfig;

const indexHtmlPath = join(
  __dirname,
  '../../../../../../../twenty-front/index.html',
);

describe('renderFrontendHtml', () => {
  it('absolutizes the IOSEI preview image from the request origin', () => {
    const html = renderFrontendHtml(
      readFileSync(indexHtmlPath, 'utf8'),
      clientConfig,
      'https://crm-iosei.com/',
    );

    expect(
      html.match(
        /content="https:\/\/crm-iosei\.com\/images\/og\/iosei-og\.png"/g,
      ),
    ).toHaveLength(2);
    expect(html).toContain(
      '<meta property="og:url" content="https://crm-iosei.com/" />',
    );
    expect(html).toContain('<meta property="og:site_name" content="IOSEI" />');
    expect(html).toContain('<meta property="og:title" content="CRM IOSEI" />');
    expect(html).toContain(
      '<meta property="og:description" content="CRM da IOSEI Global Operations" />',
    );
    expect(html).toContain('<title>CRM IOSEI</title>');
    expect(html).toContain('href="/images/icons/iosei/favicon-32.png"');
    expect(html).toContain('href="/images/icons/iosei/apple-touch-icon.png"');
    expect(html).not.toContain('__SERVER_BASE_URL__');
    expect(html).not.toContain('raw.githubusercontent.com');
    expect(html).not.toContain('A modern open-source CRM');
    expect(html).toContain('"apiUrl":"https://crm-iosei.com/graphql"');
    expect(html).toContain('window._env_ = {}');
  });

  it('escapes a hostile host inside the preview URL', () => {
    const html = renderFrontendHtml(
      '<meta property="og:image" content="__SERVER_BASE_URL__/images/og/iosei-og.png" /></head>',
      clientConfig,
      'https://evil.example/"><script>',
    );

    expect(html).toContain(
      'content="https://evil.example/&quot;&gt;&lt;script&gt;/images/og/iosei-og.png"',
    );
    expect(html).not.toContain('"><script>');
  });

  it('does not expand replacement patterns in the origin', () => {
    const html = renderFrontendHtml(
      '<meta property="og:image" content="__SERVER_BASE_URL__/images/og/iosei-og.png" /></head>',
      clientConfig,
      'https://crm-iosei.com/$&',
    );

    expect(html).toContain(
      'content="https://crm-iosei.com/$&amp;/images/og/iosei-og.png"',
    );
    expect(html).not.toContain('__SERVER_BASE_URL__');
  });
});
