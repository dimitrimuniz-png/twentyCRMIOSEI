import { Helmet } from '@dr.pogodin/react-helmet';

const IOSEI_FAVICON_PATH = '/images/icons/iosei/favicon-32.png';

export const PageFavicon = () => {
  // Workspace logos stay in the product UI. The tab icon is the IOSEI mark.
  return (
    <Helmet>
      <link rel="icon" type="image/png" href={IOSEI_FAVICON_PATH} />
    </Helmet>
  );
};
