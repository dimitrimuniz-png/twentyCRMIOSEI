import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { type TrainingCatalogDefinition } from 'twenty-shared/constants';
import { isDefined } from 'twenty-shared/utils';
import { Button } from 'twenty-ui/primitives/input';
import { IconDownload, IconPlayerPlay, IconVideo } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';

type TrainingPageContentProps = {
  catalog: TrainingCatalogDefinition | null;
  isLoading: boolean;
  hasError: boolean;
  activeFileName: string | null;
  activeMediaUrl: string | null;
  isMediaLoading: boolean;
  hasMediaError: boolean;
  videoMuted?: boolean;
  showInformationBanner?: boolean;
  onSelectModule: (fileName: string) => void;
  onVideoError: () => void;
};

const StyledScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  width: 100%;
`;

const StyledColumn = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  margin: 0 auto;
  max-width: 960px;
  padding: ${themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledIntro = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  line-height: ${themeCssVariables.text.lineHeight.lg};
  margin: 0;
`;

const StyledStatus = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
  margin: ${themeCssVariables.spacing[6]} 0;
  text-align: center;
`;

const StyledModuleList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledModule = styled.li<{ isActive: boolean }>`
  background: ${({ isActive }) =>
    isActive
      ? themeCssVariables.background.transparent.light
      : themeCssVariables.background.primary};
  border: 1px solid
    ${({ isActive }) =>
      isActive
        ? themeCssVariables.color.blue
        : themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  overflow: hidden;
`;

const StyledModuleButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: flex;
  font: inherit;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]};
  text-align: left;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledOrder = styled.span`
  align-items: center;
  background: ${themeCssVariables.background.transparent.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  height: 28px;
  justify-content: center;
  width: 32px;
`;

const StyledModuleText = styled.span`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledModuleTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledModuleDescription = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: ${themeCssVariables.text.lineHeight.lg};
`;

const StyledPlayIcon = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-shrink: 0;
`;

const StyledPlayer = styled.div`
  padding: 0 ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[3]};
`;

const StyledVideo = styled.video`
  aspect-ratio: 16 / 9;
  background: ${themeCssVariables.grayScale.gray12};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: block;
  width: 100%;
`;

const StyledPlayerStatus = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
`;

export const TrainingPageContent = ({
  catalog,
  isLoading,
  hasError,
  activeFileName,
  activeMediaUrl,
  isMediaLoading,
  hasMediaError,
  videoMuted = false,
  showInformationBanner = true,
  onSelectModule,
  onVideoError,
}: TrainingPageContentProps) => {
  const theme = useTheme();
  const title = t`Treinamento`;
  const manualHref = isDefined(catalog)
    ? `/rest/training/media/${encodeURIComponent(catalog.manual.fileName)}`
    : undefined;

  return (
    <>
      <PageTitle title={title} />
      <PageCardLayout
        showInformationBanner={showInformationBanner}
        header={
          <PageCardHeader
            icon={
              <IconVideo
                size={theme.icon.size.md}
                stroke={theme.icon.stroke.sm}
              />
            }
            title={title}
            actionButton={
              isDefined(manualHref) ? (
                <Button
                  variant="outline"
                  color="neutral"
                  size="sm"
                  href={manualHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={
                    <IconDownload
                      size={theme.icon.size.sm}
                      stroke={theme.icon.stroke.sm}
                    />
                  }
                >
                  {t`Manual em PDF`}
                </Button>
              ) : undefined
            }
          />
        }
      >
        <StyledScroll>
          <StyledColumn>
            <StyledIntro>
              {t`Manual de vendas da equipe comercial. Assista na ordem ou volte ao módulo que precisar.`}
            </StyledIntro>
            {isLoading && (
              <StyledStatus>{t`Carregando treinamento…`}</StyledStatus>
            )}
            {hasError && (
              <StyledStatus>
                {t`Não foi possível carregar o treinamento. Atualize a página e tente de novo.`}
              </StyledStatus>
            )}
            {isDefined(catalog) && (
              <StyledModuleList>
                {catalog.modules.map((module) => {
                  const isActive = module.fileName === activeFileName;

                  return (
                    <StyledModule key={module.fileName} isActive={isActive}>
                      <StyledModuleButton
                        type="button"
                        aria-expanded={isActive}
                        onClick={() => onSelectModule(module.fileName)}
                      >
                        <StyledOrder>
                          {String(module.order).padStart(2, '0')}
                        </StyledOrder>
                        <StyledModuleText>
                          <StyledModuleTitle>{module.title}</StyledModuleTitle>
                          <StyledModuleDescription>
                            {module.description}
                          </StyledModuleDescription>
                        </StyledModuleText>
                        {!isActive && (
                          <StyledPlayIcon>
                            <IconPlayerPlay
                              size={theme.icon.size.md}
                              stroke={theme.icon.stroke.sm}
                            />
                          </StyledPlayIcon>
                        )}
                      </StyledModuleButton>
                      {isActive && (
                        <StyledPlayer>
                          {isMediaLoading && (
                            <StyledPlayerStatus>
                              {t`Carregando vídeo…`}
                            </StyledPlayerStatus>
                          )}
                          {hasMediaError && (
                            <StyledPlayerStatus>
                              {t`O vídeo não carregou. Tente de novo em instantes.`}
                            </StyledPlayerStatus>
                          )}
                          {isDefined(activeMediaUrl) && !hasMediaError && (
                            <StyledVideo
                              key={activeMediaUrl}
                              src={activeMediaUrl}
                              controls
                              autoPlay
                              playsInline
                              muted={videoMuted}
                              preload="metadata"
                              aria-label={module.title}
                              onError={onVideoError}
                            />
                          )}
                        </StyledPlayer>
                      )}
                    </StyledModule>
                  );
                })}
              </StyledModuleList>
            )}
          </StyledColumn>
        </StyledScroll>
      </PageCardLayout>
    </>
  );
};
