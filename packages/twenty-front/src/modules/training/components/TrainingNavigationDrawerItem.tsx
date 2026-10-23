import { useMatch } from 'react-router-dom';
import { t } from '@lingui/core/macro';
import { AppPath } from 'twenty-shared/types';
import { IconVideo } from 'twenty-ui/icon';

import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';

export const TrainingNavigationDrawerItem = () => {
  const isActive = Boolean(useMatch(AppPath.TrainingPage));

  return (
    <NavigationDrawerItem
      label={t`Treinamento`}
      to={AppPath.TrainingPage}
      Icon={IconVideo}
      active={isActive}
    />
  );
};
