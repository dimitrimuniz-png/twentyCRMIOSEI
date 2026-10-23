import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { I18nProvider } from '@lingui/react';
import { i18n } from '@lingui/core';
import { Provider as JotaiProvider } from 'jotai';
import { SOURCE_LOCALE } from 'twenty-shared/translations';

import { currentUserState } from '@/auth/states/currentUserState';
import { useSettingsAdminTabs } from '@/settings/admin-panel/hooks/useSettingsAdminTabs';
import { SETTINGS_ADMIN_TABS } from '@/settings/admin-panel/constants/SettingsAdminTabs';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';
import { OnboardingStatus } from '~/generated-metadata/graphql';
import { messages } from '~/locales/generated/en';

i18n.load({
  [SOURCE_LOCALE]: messages,
});
i18n.activate(SOURCE_LOCALE);

const Wrapper = ({ children }: { children: ReactNode }) => (
  <JotaiProvider store={jotaiStore}>
    <I18nProvider i18n={i18n}>{children}</I18nProvider>
  </JotaiProvider>
);

describe('useSettingsAdminTabs', () => {
  beforeEach(() => {
    resetJotaiStore();
    jotaiStore.set(currentUserState.atom, {
      id: 'user-id',
      email: 'admin@iosei.co',
      supportUserHash: null,
      canAccessFullAdminPanel: true,
      canImpersonate: true,
      onboardingStatus: OnboardingStatus.COMPLETED,
      previousOnboardingStatus: null,
      isWorkspaceCreator: true,
      userVars: {},
      firstName: 'Admin',
      lastName: 'User',
      hasPassword: true,
    });
  });

  it('keeps the enterprise key screen out of the admin panel', () => {
    const { result } = renderHook(() => useSettingsAdminTabs(), {
      wrapper: Wrapper,
    });

    expect(result.current.map((tab) => tab.id)).toEqual([
      SETTINGS_ADMIN_TABS.GENERAL,
      SETTINGS_ADMIN_TABS.APPS,
      SETTINGS_ADMIN_TABS.AI,
      SETTINGS_ADMIN_TABS.CONFIG_VARIABLES,
      SETTINGS_ADMIN_TABS.HEALTH_STATUS,
    ]);
  });
});
