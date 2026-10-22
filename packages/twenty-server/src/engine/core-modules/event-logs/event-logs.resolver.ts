import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { EventLogQueryInput } from 'src/engine/core-modules/event-logs/dtos/event-log-query.input';
import { EventLogQueryResult } from 'src/engine/core-modules/event-logs/dtos/event-log-result.dto';
import { EventLogsService } from 'src/engine/core-modules/event-logs/event-logs.service';
import { EventLogsGraphqlApiExceptionFilter } from 'src/engine/core-modules/event-logs/filters/event-logs-graphql-api-exception.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { validateEventLogFieldFilterOrThrow } from 'src/engine/core-modules/event-logs/utils/validate-event-log-field-filter-or-throw.util';

@MetadataResolver()
@UseFilters(AuthGraphqlApiExceptionFilter, EventLogsGraphqlApiExceptionFilter)
@UsePipes(ResolverValidationPipe)
export class EventLogsResolver {
  constructor(private readonly eventLogsService: EventLogsService) {}

  @UseGuards(
    AuthPrincipalGuard({
      userSession: {
        standard: true,
        impersonated: true,
        playground: true,
        workspaceAgnostic: false,
      },
      apiKey: true,
      oauthClient: true,
      application: true,
    }),
    SettingsPermissionGuard(PermissionFlagType.SECURITY),
  )
  @Query(() => EventLogQueryResult)
  async eventLogs(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: EventLogQueryInput,
  ): Promise<EventLogQueryResult> {
    await this.eventLogsService.validateAccess(workspace.id, input.table);

    input.filters?.fieldFilters?.forEach((fieldFilter) =>
      validateEventLogFieldFilterOrThrow({
        fieldFilter,
        table: input.table,
      }),
    );

    return this.eventLogsService.query({
      workspaceId: workspace.id,
      input,
    });
  }
}
