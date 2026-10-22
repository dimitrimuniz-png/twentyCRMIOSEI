import {
  buildOidcCallbackPath,
  buildServerUrl,
} from '@/settings/security/utils/buildServerUrl';

describe('buildOidcCallbackPath', () => {
  it('matches the path SsoService registers on the OIDC client', () => {
    expect(buildOidcCallbackPath('3f1c2a7e-1111-4111-8111-111111111111')).toBe(
      '/auth/oidc/callback/3f1c2a7e-1111-4111-8111-111111111111',
    );
  });
});

describe('buildServerUrl', () => {
  it('appends the pathname to the server url', () => {
    expect(
      buildServerUrl({
        serverUrl: 'https://api.example.com',
        pathname: '/auth/saml/login/idp-id',
      }),
    ).toBe('https://api.example.com/auth/saml/login/idp-id');
  });

  it('drops a default port the way the server does', () => {
    expect(
      buildServerUrl({
        serverUrl: 'https://crm.example.com:443',
        pathname: '/auth/oidc/callback',
      }),
    ).toBe('https://crm.example.com/auth/oidc/callback');
  });

  it('builds the OIDC callback path the server registers', () => {
    expect(
      buildServerUrl({
        serverUrl: 'https://crm.iosei.co/',
        pathname: '/auth/oidc/callback/3f1c2a7e-1111-4111-8111-111111111111',
      }),
    ).toBe(
      'https://crm.iosei.co/auth/oidc/callback/3f1c2a7e-1111-4111-8111-111111111111',
    );
  });

  it('replaces a path prefix instead of appending to it', () => {
    expect(
      buildServerUrl({
        serverUrl: 'https://crm.example.com/api/',
        pathname: '/auth/saml/callback/idp-id',
      }),
    ).toBe('https://crm.example.com/auth/saml/callback/idp-id');
  });
});
