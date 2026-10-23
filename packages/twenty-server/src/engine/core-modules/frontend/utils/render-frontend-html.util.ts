import { CLIENT_CONFIG_BOOTSTRAP_ELEMENT_ID } from 'twenty-shared/constants';

import { type ClientConfig } from 'src/engine/core-modules/client-config/client-config.entity';

const SERVER_BASE_URL_TOKEN = '__SERVER_BASE_URL__';

const escapeHtmlAttribute = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const renderFrontendHtml = (
  template: string,
  clientConfig: ClientConfig,
  baseUrl: string,
): string => {
  const serializedConfig = JSON.stringify(clientConfig)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  const absoluteBaseUrl = escapeHtmlAttribute(baseUrl.replace(/\/+$/, ''));

  // Crawlers read this document before JS, so preview URLs must be absolute.
  return template
    .replaceAll(SERVER_BASE_URL_TOKEN, () => absoluteBaseUrl)
    .replace(
      /<!-- BEGIN: Twenty Config -->[\s\S]*?<!-- END: Twenty Config -->/,
      '<script id="twenty-env-config">window._env_ = {};</script>',
    )
    .replace(
      '</head>',
      () =>
        `<script id="${CLIENT_CONFIG_BOOTSTRAP_ELEMENT_ID}" type="application/json">${serializedConfig}</script></head>`,
    );
};
