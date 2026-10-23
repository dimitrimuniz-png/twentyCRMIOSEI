import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { DEFAULT_TRAINING_CATALOG } from 'twenty-shared/constants';
import { ThemeProvider } from 'twenty-ui/theme';

import { TrainingPageContent } from '@/training/components/TrainingPageContent';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <HelmetProvider>
    <ThemeProvider colorScheme="light">
      <MemoryRouter>{children}</MemoryRouter>
    </ThemeProvider>
  </HelmetProvider>
);

const renderPage = ({
  activeFileName = null,
  activeMediaUrl = null,
}: {
  activeFileName?: string | null;
  activeMediaUrl?: string | null;
} = {}) => {
  const onSelectModule = jest.fn();

  render(
    <TrainingPageContent
      catalog={DEFAULT_TRAINING_CATALOG}
      isLoading={false}
      hasError={false}
      activeFileName={activeFileName}
      activeMediaUrl={activeMediaUrl}
      isMediaLoading={false}
      hasMediaError={false}
      showInformationBanner={false}
      onSelectModule={onSelectModule}
      onVideoError={jest.fn()}
    />,
    { wrapper: Wrapper },
  );

  return { onSelectModule };
};

describe('TrainingPageContent', () => {
  it('lists every module and links the manual', () => {
    renderPage();

    for (const module of DEFAULT_TRAINING_CATALOG.modules) {
      expect(screen.getByText(module.title)).toBeInTheDocument();
      expect(screen.getByText(module.description)).toBeInTheDocument();
    }

    expect(screen.getByRole('link', { name: 'Manual em PDF' })).toHaveAttribute(
      'href',
      '/rest/training/media/manual-crm-iosei.pdf',
    );
    expect(document.querySelector('video')).toBeNull();
  });

  it('plays only the selected module', async () => {
    const user = userEvent.setup();
    const { onSelectModule } = renderPage({
      activeFileName: '01-visao-geral.mp4',
      activeMediaUrl: 'https://example.com/01-visao-geral.mp4',
    });

    expect(
      screen.getByLabelText('Visão geral da tela e navegação'),
    ).toHaveAttribute('src', 'https://example.com/01-visao-geral.mp4');
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(1);

    await user.click(
      screen.getByRole('button', { name: /Como o CRM está organizado/ }),
    );

    expect(onSelectModule).toHaveBeenCalledWith('02-organizacao.mp4');
  });
});
