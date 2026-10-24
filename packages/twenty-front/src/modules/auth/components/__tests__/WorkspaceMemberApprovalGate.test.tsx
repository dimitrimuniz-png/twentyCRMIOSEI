import { render, screen } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { MemoryRouter } from 'react-router-dom';

import { WorkspaceMemberApprovalGate } from '@/auth/components/WorkspaceMemberApprovalGate';
import { isCookieAuthActiveState } from '@/auth/states/isCookieAuthActiveState';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';

const mockUseQuery = jest.fn();

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('@/auth/components/WaitingForWorkspaceMemberApproval', () => ({
  WaitingForWorkspaceMemberApproval: ({
    isLoading = false,
  }: {
    isLoading?: boolean;
  }) => <div>{isLoading ? 'approval-loading' : 'approval-blocked'}</div>,
}));

const renderGate = (path: string) =>
  render(
    <JotaiProvider store={jotaiStore}>
      <MemoryRouter initialEntries={[path]}>
        <WorkspaceMemberApprovalGate>
          <div>app</div>
        </WorkspaceMemberApprovalGate>
      </MemoryRouter>
    </JotaiProvider>,
  );

describe('WorkspaceMemberApprovalGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    resetJotaiStore();
    jotaiStore.set(isCookieAuthActiveState.atom, false);
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: jest.fn(),
    });
  });

  it('renders the app before a session exists', () => {
    renderGate('/verify?loginToken=token');

    expect(screen.getByText('app')).toBeInTheDocument();
    expect(screen.queryByText('approval-loading')).not.toBeInTheDocument();
  });

  it('keeps /verify mounted while approval is still loading', () => {
    jotaiStore.set(isCookieAuthActiveState.atom, true);

    renderGate('/verify?loginToken=token');

    expect(screen.getByText('app')).toBeInTheDocument();
    expect(screen.queryByText('approval-loading')).not.toBeInTheDocument();
  });

  it('blocks the rest of the app while approval is loading', () => {
    jotaiStore.set(isCookieAuthActiveState.atom, true);

    renderGate('/objects/people');

    expect(screen.getByText('approval-loading')).toBeInTheDocument();
    expect(screen.queryByText('app')).not.toBeInTheDocument();
  });

  it('shows the approval screen to a pending member, including on /verify', () => {
    jotaiStore.set(isCookieAuthActiveState.atom, true);
    mockUseQuery.mockReturnValue({
      data: {
        currentWorkspaceMemberApproval: {
          approvalStatus: 'PENDING',
          isMemberApprovalRequired: true,
        },
      },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    renderGate('/verify?loginToken=token');

    expect(screen.getByText('approval-blocked')).toBeInTheDocument();
    expect(screen.queryByText('app')).not.toBeInTheDocument();
  });

  it('renders the app for an approved member', () => {
    jotaiStore.set(isCookieAuthActiveState.atom, true);
    mockUseQuery.mockReturnValue({
      data: {
        currentWorkspaceMemberApproval: {
          approvalStatus: 'APPROVED',
          isMemberApprovalRequired: true,
        },
      },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    renderGate('/objects/people');

    expect(screen.getByText('app')).toBeInTheDocument();
  });
});
