import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import {
  EnterpriseLicenseInfoDTO,
  EnterpriseSubscriptionStatusDTO,
} from 'src/engine/core-modules/enterprise/dtos/enterprise-license-info.dto';
import { EnterprisePlanService } from 'src/engine/core-modules/enterprise/services/enterprise-plan.service';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';

// The key is not stored. Validity stays whatever EnterprisePlanService reports,
// which is closed on this fork, so the workspace cap is unchanged.
@MetadataResolver()
export class EnterpriseResolver {
  constructor(private readonly enterprisePlanService: EnterprisePlanService) {}

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: false,
      oauthClient: false,
      application: false,
    }),
    NoPermissionGuard,
  )
  @Mutation(() => EnterpriseLicenseInfoDTO)
  setEnterpriseKey(
    @Args('enterpriseKey', { type: () => String })
    _enterpriseKey: string,
  ): EnterpriseLicenseInfoDTO {
    return this.inactiveLicense();
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: false,
      oauthClient: false,
      application: false,
    }),
    NoPermissionGuard,
  )
  @Mutation(() => EnterpriseLicenseInfoDTO)
  releaseEnterpriseServerBinding(): EnterpriseLicenseInfoDTO {
    return this.inactiveLicense();
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: false,
      oauthClient: false,
      application: false,
    }),
    NoPermissionGuard,
  )
  @Mutation(() => Boolean)
  refreshEnterpriseValidityToken(): boolean {
    return this.enterprisePlanService.hasValidEnterpriseValidityToken();
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: false,
      oauthClient: false,
      application: false,
    }),
    NoPermissionGuard,
  )
  @Query(() => String, { nullable: true })
  enterpriseCheckoutSession(
    @Args('billingInterval', { type: () => String, nullable: true })
    _billingInterval?: string,
  ): string | null {
    return null;
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: false,
      oauthClient: false,
      application: false,
    }),
    NoPermissionGuard,
  )
  @Query(() => String, { nullable: true })
  enterprisePortalSession(
    @Args('returnUrlPath', { type: () => String, nullable: true })
    _returnUrlPath?: string,
  ): string | null {
    return null;
  }

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: false,
      oauthClient: false,
      application: false,
    }),
    NoPermissionGuard,
  )
  @Query(() => EnterpriseSubscriptionStatusDTO, { nullable: true })
  enterpriseSubscriptionStatus(): EnterpriseSubscriptionStatusDTO | null {
    return null;
  }

  private inactiveLicense(): EnterpriseLicenseInfoDTO {
    return {
      isValid: this.enterprisePlanService.isValid(),
      licensee: null,
      expiresAt: null,
      subscriptionId: null,
    };
  }
}
