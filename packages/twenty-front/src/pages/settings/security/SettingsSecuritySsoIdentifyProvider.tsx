import { useState } from 'react';

import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { useMutation, useQuery } from '@apollo/client/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { v4 } from 'uuid';
import { Button } from 'twenty-ui/primitives/input';
import { Section } from 'twenty-ui/components/layout';
import { useToast } from 'twenty-ui/components/feedback';
import {
  CreateOidcIdentityProviderDocument,
  CreateSamlIdentityProviderDocument,
  GetSsoIdentityProvidersDocument,
  IdentityProviderType,
} from '~/generated-metadata/graphql';

export const SettingsSecuritySsoIdentifyProvider = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const providers = useQuery(GetSsoIdentityProvidersDocument);
  const [createSaml] = useMutation(CreateSamlIdentityProviderDocument);
  const [createOidc] = useMutation(CreateOidcIdentityProviderDocument);
  const [protocol, setProtocol] = useState<'SAML' | 'OIDC'>('SAML');
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [ssoUrl, setSsoUrl] = useState('');
  const [certificate, setCertificate] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const save = async () => {
    try {
      if (protocol === 'SAML') {
        await createSaml({
          variables: {
            input: {
              id: v4(),
              name,
              issuer,
              ssoURL: ssoUrl,
              certificate,
            },
          },
          refetchQueries: [GetSsoIdentityProvidersDocument],
        });
      } else {
        await createOidc({
          variables: {
            input: {
              name,
              issuer,
              clientID: clientId,
              clientSecret,
            },
          },
          refetchQueries: [GetSsoIdentityProvidersDocument],
        });
      }

      enqueueToast({ status: 'success', children: t`Identity provider saved` });
    } catch {
      enqueueToast({ status: 'error', children: t`An error occurred.` });
    }
  };

  return (
    <SettingsPageLayout
      title={t`Single sign-on`}
      links={[
        {
          children: t`Workspace`,
          href: getSettingsPath(SettingsPath.General),
        },
        {
          children: t`Security`,
          href: getSettingsPath(SettingsPath.Security),
        },
        { children: t`New identity provider` },
      ]}
    >
      <SettingsPageContainer>
        <Section.Root>
          <Section.Header title={t`Identity providers`} />
          <ul>
            {providers.data?.getSSOIdentityProviders.map((provider) => (
              <li key={provider.id}>
                {provider.name} ({provider.type}) — {provider.status}
              </li>
            ))}
          </ul>
          <label>
            <Trans>Protocol</Trans>
            <select
              value={protocol}
              onChange={(event) =>
                setProtocol(event.target.value as 'SAML' | 'OIDC')
              }
            >
              <option value="SAML">SAML</option>
              <option value="OIDC">OIDC</option>
            </select>
          </label>
          <SettingsTextInput
            instanceId="sso-name"
            label={t`Name`}
            value={name}
            onChange={setName}
          />
          <SettingsTextInput
            instanceId="sso-issuer"
            label={t`Issuer`}
            value={issuer}
            onChange={setIssuer}
          />
          {protocol === IdentityProviderType.SAML ? (
            <>
              <SettingsTextInput
                instanceId="sso-url"
                label={t`SSO URL`}
                value={ssoUrl}
                onChange={setSsoUrl}
              />
              <SettingsTextInput
                instanceId="sso-certificate"
                label={t`Certificate`}
                value={certificate}
                onChange={setCertificate}
              />
            </>
          ) : (
            <>
              <SettingsTextInput
                instanceId="sso-client-id"
                label={t`Client ID`}
                value={clientId}
                onChange={setClientId}
              />
              <SettingsTextInput
                instanceId="sso-client-secret"
                label={t`Client secret`}
                value={clientSecret}
                onChange={setClientSecret}
                type="password"
              />
            </>
          )}
          <Button onClick={save}>{t`Save`}</Button>
        </Section.Root>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
