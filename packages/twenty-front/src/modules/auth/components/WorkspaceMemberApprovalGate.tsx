import { WaitingForWorkspaceMemberApproval } from '@/auth/components/WaitingForWorkspaceMemberApproval';
import { useIsLogged } from '@/auth/hooks/useIsLogged';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { isMatchingLocation } from '~/utils/isMatchingLocation';

const CURRENT_WORKSPACE_MEMBER_APPROVAL = gql`
  query CurrentWorkspaceMemberApproval {
    currentWorkspaceMemberApproval {
      approvalStatus
      isMemberApprovalRequired
    }
  }
`;

type CurrentWorkspaceMemberApprovalQuery = {
  currentWorkspaceMemberApproval: {
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    isMemberApprovalRequired: boolean;
  };
};

type WorkspaceMemberApprovalGateProps = {
  children: ReactNode;
};

export const WorkspaceMemberApprovalGate = ({
  children,
}: WorkspaceMemberApprovalGateProps) => {
  const isLogged = useIsLogged();
  const location = useLocation();
  const { data, loading, error, refetch } =
    useQuery<CurrentWorkspaceMemberApprovalQuery>(
      CURRENT_WORKSPACE_MEMBER_APPROVAL,
      {
        skip: !isLogged,
        fetchPolicy: 'network-only',
      },
    );

  if (!isLogged) {
    return children;
  }

  const approvalStatus = data?.currentWorkspaceMemberApproval.approvalStatus;
  const isPending =
    approvalStatus === 'PENDING' || approvalStatus === 'REJECTED';
  const isApprovalUnresolved =
    !isPending && !error && (loading || !isDefined(approvalStatus));

  // /verify is exchanging a single-use login token. Replacing it with the
  // loader remounts the page and submits that token a second time.
  if (isApprovalUnresolved && isMatchingLocation(location, AppPath.Verify)) {
    return children;
  }

  if (isApprovalUnresolved) {
    return (
      <WaitingForWorkspaceMemberApproval
        isLoading
        onCheckAgain={() => {
          void refetch();
        }}
      />
    );
  }

  if (isPending || isDefined(error)) {
    return (
      <WaitingForWorkspaceMemberApproval
        onCheckAgain={() => {
          void refetch();
        }}
      />
    );
  }

  return children;
};
