import { useMutation } from '@apollo/client/react';

import { UpsertRowLevelPermissionPredicatesDocument } from '~/generated-metadata/graphql';

export const useUpsertRowLevelPermissionPredicatesMutation = () =>
  useMutation(UpsertRowLevelPermissionPredicatesDocument);
