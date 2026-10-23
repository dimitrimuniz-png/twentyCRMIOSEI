import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { styled } from '@linaria/react';
import { type Meta, type StoryObj } from '@storybook/react-vite';
import { useLayoutEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { DEFAULT_TRAINING_CATALOG } from 'twenty-shared/constants';
import { AppPath } from 'twenty-shared/types';
import {
  IconBox,
  IconBuildingSkyscraper,
  IconChartBar,
  IconCheckbox,
  IconNotes,
  IconSearch,
  IconTargetArrow,
  IconUser,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

import { TrainingNavigationDrawerItem } from '@/training/components/TrainingNavigationDrawerItem';
import { TrainingPageContent } from '@/training/components/TrainingPageContent';
import { APP_HEADER_HEIGHT } from '@/ui/layout/constants/AppHeaderHeight';
import { NavigationDrawer } from '@/ui/navigation/navigation-drawer/components/NavigationDrawer';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerScrollableContent } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerScrollableContent';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { navigationDrawerWidthState } from '@/ui/navigation/states/navigationDrawerWidthState';
import { jotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';

import sampleTrainingVideoUrl from './sample-training.mp4';

const DRAWER_WIDTH = 240;

const WORKSPACE_ITEMS = [
  {
    label: 'Empresas',
    to: '/objects/companies',
    Icon: IconBuildingSkyscraper,
  },
  { label: 'Pessoas', to: '/objects/people', Icon: IconUser },
  {
    label: 'Oportunidades',
    to: '/objects/opportunities',
    Icon: IconTargetArrow,
  },
  { label: 'Tarefas', to: '/objects/tasks', Icon: IconCheckbox },
  { label: 'Notas', to: '/objects/notes', Icon: IconNotes },
  { label: 'Painéis', to: '/objects/dashboards', Icon: IconChartBar },
  {
    label: 'Empresas do grupo',
    to: '/objects/group-companies',
    Icon: IconBuildingSkyscraper,
  },
  { label: 'Produtos', to: '/objects/products', Icon: IconBox },
];

const StyledShell = styled.div`
  background: ${themeCssVariables.grayScale.gray3};
  display: flex;
  height: 100vh;
  overflow: hidden;
  width: 100%;
`;

const StyledMain = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
`;

const StyledHeaderRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  box-sizing: border-box;
  display: flex;
  height: ${APP_HEADER_HEIGHT}px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledWorkspaceName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type TrainingPageStoryProps = {
  activeFileName: string | null;
  activeMediaUrl: string | null;
};

const TrainingPageStory = ({
  activeFileName,
  activeMediaUrl,
}: TrainingPageStoryProps) => {
  useLayoutEffect(() => {
    jotaiStore.set(isNavigationDrawerExpandedState.atom, true);
    jotaiStore.set(navigationDrawerWidthState.atom, DRAWER_WIDTH);
  }, []);

  return (
    <HelmetProvider>
      <MemoryRouter initialEntries={[AppPath.TrainingPage]}>
        <StyledShell>
          <NavigationDrawer
            header={
              <StyledHeaderRow>
                <StyledWorkspaceName>IOSEI</StyledWorkspaceName>
              </StyledHeaderRow>
            }
          >
            <NavigationDrawerSection>
              <NavigationDrawerItem label="Buscar" Icon={IconSearch} />
            </NavigationDrawerSection>
            <NavigationDrawerScrollableContent>
              <NavigationDrawerSection>
                <NavigationDrawerSectionTitle label="Workspace" />
                {WORKSPACE_ITEMS.map((item) => (
                  <NavigationDrawerItem
                    key={item.to}
                    label={item.label}
                    to={item.to}
                    Icon={item.Icon}
                  />
                ))}
                <TrainingNavigationDrawerItem />
              </NavigationDrawerSection>
            </NavigationDrawerScrollableContent>
          </NavigationDrawer>
          <StyledMain>
            <TrainingPageContent
              catalog={DEFAULT_TRAINING_CATALOG}
              isLoading={false}
              hasError={false}
              activeFileName={activeFileName}
              activeMediaUrl={activeMediaUrl}
              isMediaLoading={false}
              hasMediaError={false}
              videoMuted
              showInformationBanner={false}
              onSelectModule={() => undefined}
              onVideoError={() => undefined}
            />
          </StyledMain>
        </StyledShell>
      </MemoryRouter>
    </HelmetProvider>
  );
};

const meta: Meta<typeof TrainingPageStory> = {
  title: 'Pages/Training/TrainingPage',
  component: TrainingPageStory,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof TrainingPageStory>;

const firstModule = DEFAULT_TRAINING_CATALOG.modules[0];

export const Default: Story = {
  args: {
    activeFileName: null,
    activeMediaUrl: null,
  },
};

export const Playing: Story = {
  args: {
    activeFileName: firstModule.fileName,
    activeMediaUrl: sampleTrainingVideoUrl,
  },
};
