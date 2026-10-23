import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { PublicDomainEntity } from 'src/engine/core-modules/public-domain/public-domain.entity';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

describe('WorkspaceDomainsService', () => {
  it('returns undefined in single-workspace mode when no workspace exists yet', async () => {
    const module = await Test.createTestingModule({
      providers: [
        WorkspaceDomainsService,
        {
          provide: DomainServerConfigService,
          useValue: {
            getSubdomainAndCustomDomainFromUrl: () => ({
              subdomain: undefined,
              customDomain: undefined,
              isUnderPublicDomainUrl: false,
            }),
          },
        },
        {
          provide: TwentyConfigService,
          useValue: {
            get: (key: string) =>
              key === 'IS_MULTIWORKSPACE_ENABLED' ? false : undefined,
          },
        },
        {
          provide: getRepositoryToken(WorkspaceEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(PublicDomainEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    const service = module.get(WorkspaceDomainsService);

    await expect(
      service.getWorkspaceByOriginOrDefaultWorkspace('https://crm.example.com'),
    ).resolves.toBeUndefined();
  });
});
