import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { act, render, waitFor } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import { SOURCE_LOCALE } from 'twenty-shared/translations';
import { AppPath } from 'twenty-shared/types';
import { ThemeProvider } from 'twenty-ui/theme';
import { type PublicWorkspaceData } from '~/generated-metadata/graphql';

import { VerifyEmail } from '@/auth/components/VerifyEmail';
import { workspacePublicDataState } from '@/auth/states/workspacePublicDataState';
import { clientConfigApiStatusState } from '@/client-config/states/clientConfigApiStatusState';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

const navigateMock = jest.fn();
const verifyEmailAndGetWorkspaceAgnosticTokenMock = jest.fn();
const verifyEmailAndGetLoginTokenMock = jest.fn();
const verifyLoginTokenMock = jest.fn();
const redirectToWorkspaceDomainMock = jest.fn();

let isOnAWorkspaceValue = false;
let isPublicWorkspaceDataSettledValue = true;

const publicWorkspaceData = {
  id: 'workspace-id',
} as PublicWorkspaceData;

jest.mock('@/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    verifyEmailAndGetWorkspaceAgnosticToken:
      verifyEmailAndGetWorkspaceAgnosticTokenMock,
    verifyEmailAndGetLoginToken: verifyEmailAndGetLoginTokenMock,
  }),
}));

jest.mock('@/auth/hooks/useVerifyLogin', () => ({
  useVerifyLogin: () => ({ verifyLoginToken: verifyLoginTokenMock }),
}));

jest.mock('@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace', () => ({
  useIsCurrentLocationOnAWorkspace: () => ({
    isOnAWorkspace: isOnAWorkspaceValue,
  }),
}));

jest.mock('@/domain-manager/hooks/useGetPublicWorkspaceDataByDomain', () => ({
  useGetPublicWorkspaceDataByDomain: () => ({
    isPublicWorkspaceDataSettled: isPublicWorkspaceDataSettledValue,
  }),
}));

jest.mock('@/domain-manager/hooks/useRedirectToWorkspaceDomain', () => ({
  useRedirectToWorkspaceDomain: () => ({
    redirectToWorkspaceDomain: redirectToWorkspaceDomainMock,
  }),
}));

jest.mock('~/hooks/useNavigateApp', () => ({
  useNavigateApp: () => navigateMock,
}));

const mockEnqueueToast = jest.fn();

jest.mock('twenty-ui/components/feedback', () => ({
  ...jest.requireActual('twenty-ui/components/feedback'),
  useToast: () => ({ enqueueToast: mockEnqueueToast }),
}));

jest.mock(
  '@/auth/sign-in-up/hooks/useHandleResendEmailVerificationToken',
  () => ({
    useHandleResendEmailVerificationToken: () => ({
      handleResendEmailVerificationToken: () => () => {},
      loading: false,
    }),
  }),
);

dynamicActivate(SOURCE_LOCALE);

const VERIFY_EMAIL_URL =
  '/verify-email?email=user%40example.com&emailVerificationToken=valid-token';

const renderVerifyEmail = (initialEntry: string) =>
  render(
    <JotaiProvider store={jotaiStore}>
      <ThemeProvider colorScheme="light">
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={[initialEntry]}>
            <VerifyEmail />
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>
    </JotaiProvider>,
  );

describe('VerifyEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    resetJotaiStore();
    isOnAWorkspaceValue = false;
    isPublicWorkspaceDataSettledValue = true;
    // The verification effect is gated on the client config having loaded.
    jotaiStore.set(clientConfigApiStatusState.atom, {
      isLoadedOnce: true,
      isLoading: false,
      isErrored: false,
      isSaved: false,
    });
  });

  it('navigates to the SignInUp page after a successful workspace-agnostic verification on the central domain', async () => {
    verifyEmailAndGetWorkspaceAgnosticTokenMock.mockResolvedValue(undefined);

    renderVerifyEmail(VERIFY_EMAIL_URL);

    await waitFor(() => {
      expect(verifyEmailAndGetWorkspaceAgnosticTokenMock).toHaveBeenCalledWith(
        'valid-token',
        'user@example.com',
      );
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(AppPath.SignInUp);
    });
    expect(mockEnqueueToast).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success' }),
    );
  });

  it('does not hand off to the SignInUp page when the verification fails', async () => {
    verifyEmailAndGetWorkspaceAgnosticTokenMock.mockRejectedValue(
      new Error('verification failed'),
    );

    renderVerifyEmail(VERIFY_EMAIL_URL);

    await waitFor(() => {
      expect(mockEnqueueToast).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'error' }),
      );
    });
    expect(navigateMock).not.toHaveBeenCalledWith(AppPath.SignInUp);
  });

  it('keeps the workspace-scoped verification path untouched when already on a workspace', async () => {
    isOnAWorkspaceValue = true;
    jotaiStore.set(workspacePublicDataState.atom, publicWorkspaceData);
    verifyEmailAndGetLoginTokenMock.mockResolvedValue({
      loginToken: { token: 'login-token' },
      workspaceUrls: { subdomainUrl: 'https://foo.twenty.com/' },
    });

    renderVerifyEmail(VERIFY_EMAIL_URL);

    await waitFor(() => {
      expect(verifyEmailAndGetLoginTokenMock).toHaveBeenCalledWith(
        'valid-token',
        'user@example.com',
      );
    });

    expect(verifyEmailAndGetWorkspaceAgnosticTokenMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalledWith(AppPath.SignInUp);
  });

  it('uses the workspace-agnostic path when single-workspace mode has no workspace yet', async () => {
    isOnAWorkspaceValue = true;
    verifyEmailAndGetWorkspaceAgnosticTokenMock.mockResolvedValue(undefined);

    renderVerifyEmail(VERIFY_EMAIL_URL);

    await waitFor(() => {
      expect(verifyEmailAndGetWorkspaceAgnosticTokenMock).toHaveBeenCalledWith(
        'valid-token',
        'user@example.com',
      );
    });
    expect(verifyEmailAndGetLoginTokenMock).not.toHaveBeenCalled();
  });

  it('waits until public workspace data has settled before verifying', async () => {
    isPublicWorkspaceDataSettledValue = false;

    renderVerifyEmail(VERIFY_EMAIL_URL);

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
    });

    expect(verifyEmailAndGetWorkspaceAgnosticTokenMock).not.toHaveBeenCalled();
    expect(verifyEmailAndGetLoginTokenMock).not.toHaveBeenCalled();
  });

  it('exchanges the login token without redirecting when already on the workspace origin', async () => {
    isOnAWorkspaceValue = true;
    jotaiStore.set(workspacePublicDataState.atom, publicWorkspaceData);
    verifyEmailAndGetLoginTokenMock.mockResolvedValue({
      loginToken: { token: 'login-token' },
      workspaceUrls: { subdomainUrl: `${window.location.origin}/` },
    });

    renderVerifyEmail(VERIFY_EMAIL_URL);

    await waitFor(() => {
      expect(verifyLoginTokenMock).toHaveBeenCalledWith('login-token');
    });
    expect(redirectToWorkspaceDomainMock).not.toHaveBeenCalled();
  });
});
