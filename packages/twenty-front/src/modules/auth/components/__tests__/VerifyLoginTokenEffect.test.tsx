import { act, render, waitFor } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { MemoryRouter, useSearchParams } from 'react-router-dom';

import { VerifyLoginTokenEffect } from '@/auth/components/VerifyLoginTokenEffect';
import { isCookieAuthActiveState } from '@/auth/states/isCookieAuthActiveState';
import { clearSubmittedLoginTokens } from '@/auth/utils/submittedLoginTokens';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';
import { AppPath } from 'twenty-shared/types';

const mockVerifyLoginToken = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@/auth/hooks/useVerifyLogin', () => ({
  useVerifyLogin: () => ({ verifyLoginToken: mockVerifyLoginToken }),
}));

jest.mock('~/hooks/useNavigateApp', () => ({
  useNavigateApp: () => mockNavigate,
}));

const LocationSearch = () => {
  const [searchParams] = useSearchParams();

  return <div data-testid="search">{searchParams.toString()}</div>;
};

const Harness = ({
  showEffect,
  initialEntry,
}: {
  showEffect: boolean;
  initialEntry: string;
}) => (
  <JotaiProvider store={jotaiStore}>
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationSearch />
      {showEffect ? <VerifyLoginTokenEffect /> : <div>approval-loading</div>}
    </MemoryRouter>
  </JotaiProvider>
);

const renderEffect = (initialEntry: string, showEffect = true) =>
  render(<Harness showEffect={showEffect} initialEntry={initialEntry} />);

describe('VerifyLoginTokenEffect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    resetJotaiStore();
    clearSubmittedLoginTokens();
    mockVerifyLoginToken.mockResolvedValue(undefined);
    jotaiStore.set(isCookieAuthActiveState.atom, false);
  });

  it('exchanges a login token once when the approval gate remounts the page', async () => {
    const view = renderEffect(
      '/verify?loginToken=single-use-token&returnToPath=%2Fobjects%2Fpeople',
    );

    await waitFor(() => {
      expect(mockVerifyLoginToken).toHaveBeenCalledTimes(1);
    });
    expect(mockVerifyLoginToken).toHaveBeenCalledWith('single-use-token');
    await waitFor(() => {
      expect(view.getByTestId('search').textContent).toBe(
        'returnToPath=%2Fobjects%2Fpeople',
      );
    });

    await act(async () => {
      jotaiStore.set(isCookieAuthActiveState.atom, true);
    });

    view.rerender(
      <Harness
        showEffect={false}
        initialEntry="/verify?loginToken=single-use-token&returnToPath=%2Fobjects%2Fpeople"
      />,
    );
    view.rerender(
      <Harness
        showEffect
        initialEntry="/verify?loginToken=single-use-token&returnToPath=%2Fobjects%2Fpeople"
      />,
    );

    await waitFor(() => {
      expect(view.getByTestId('search').textContent).not.toContain(
        'loginToken',
      );
    });
    expect(mockVerifyLoginToken).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();

    view.unmount();
    renderEffect(
      '/verify?loginToken=single-use-token&returnToPath=%2Fobjects%2Fpeople',
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockVerifyLoginToken).toHaveBeenCalledTimes(1);
  });

  it('sends a visitor without a login token to the sign-in page', async () => {
    renderEffect('/verify');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(AppPath.SignInUp);
    });
    expect(mockVerifyLoginToken).not.toHaveBeenCalled();
  });

  it('leaves an authenticated visit without a login token on the page', async () => {
    jotaiStore.set(isCookieAuthActiveState.atom, true);

    renderEffect('/verify');

    await waitFor(() => {
      expect(mockVerifyLoginToken).not.toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
