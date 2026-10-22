import { AuthExceptionCode } from 'src/engine/core-modules/auth/auth.exception';
import {
  assertEmailDomainIsAllowed,
  isEmailInAllowedDomains,
} from 'src/engine/core-modules/auth/utils/assert-email-domain-is-allowed.util';

const ALLOWED_DOMAINS = ['iosei.co', 'mstecnologia.med.br', 'i-rad.co'];

describe('isEmailInAllowedDomains', () => {
  it('allows every domain when the allowlist is empty or unset', () => {
    expect(
      isEmailInAllowedDomains({
        email: 'person@gmail.com',
        allowedDomains: [],
      }),
    ).toBe(true);
    expect(
      isEmailInAllowedDomains({
        email: 'person@gmail.com',
        allowedDomains: undefined,
      }),
    ).toBe(true);
  });

  it('allows an exact match on each configured domain', () => {
    expect(
      isEmailInAllowedDomains({
        email: 'Ana@IOSEI.co',
        allowedDomains: [' @iosei.co '],
      }),
    ).toBe(true);

    for (const domain of ALLOWED_DOMAINS) {
      expect(
        isEmailInAllowedDomains({
          email: `person@${domain}`,
          allowedDomains: ALLOWED_DOMAINS,
        }),
      ).toBe(true);
    }
  });

  it('rejects a different domain, a subdomain, and a lookalike suffix', () => {
    expect(
      isEmailInAllowedDomains({
        email: 'person@gmail.com',
        allowedDomains: ALLOWED_DOMAINS,
      }),
    ).toBe(false);
    expect(
      isEmailInAllowedDomains({
        email: 'person@mail.iosei.co',
        allowedDomains: ALLOWED_DOMAINS,
      }),
    ).toBe(false);
    expect(
      isEmailInAllowedDomains({
        email: 'person@notiosei.co',
        allowedDomains: ALLOWED_DOMAINS,
      }),
    ).toBe(false);
    expect(
      isEmailInAllowedDomains({
        email: 'person@iosei.co.attacker.com',
        allowedDomains: ALLOWED_DOMAINS,
      }),
    ).toBe(false);
    expect(
      isEmailInAllowedDomains({
        email: 'not-an-email',
        allowedDomains: ALLOWED_DOMAINS,
      }),
    ).toBe(false);
  });
});

describe('assertEmailDomainIsAllowed', () => {
  it('throws FORBIDDEN_EXCEPTION when the domain is outside the allowlist', () => {
    expect(() =>
      assertEmailDomainIsAllowed({
        email: 'person@gmail.com',
        allowedDomains: ALLOWED_DOMAINS,
      }),
    ).toThrow(
      expect.objectContaining({
        message: 'Email domain is not allowed',
        code: AuthExceptionCode.FORBIDDEN_EXCEPTION,
      }),
    );
  });

  it('does not throw for an allowed domain', () => {
    expect(() =>
      assertEmailDomainIsAllowed({
        email: 'person@i-rad.co',
        allowedDomains: ALLOWED_DOMAINS,
      }),
    ).not.toThrow();
  });
});
