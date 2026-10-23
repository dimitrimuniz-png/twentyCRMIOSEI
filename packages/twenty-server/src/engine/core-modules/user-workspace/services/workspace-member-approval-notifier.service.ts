import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { msg } from '@lingui/core/macro';
import { PermissionFlagType } from 'twenty-shared/constants';
import { SOURCE_LOCALE } from 'twenty-shared/translations';
import { isDefined } from 'twenty-shared/utils';
import { In, type Repository } from 'typeorm';

import { EmailService } from 'src/engine/core-modules/email/email.service';
import { I18nService } from 'src/engine/core-modules/i18n/i18n.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { type UserEntity } from 'src/engine/core-modules/user/user.entity';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { resolveUserWorkspaceIdsWithPermissionFlag } from 'src/engine/metadata-modules/permissions/utils/resolve-user-workspace-ids-with-permission-flag.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

@Injectable()
export class WorkspaceMemberApprovalNotifierService {
  private readonly logger = new Logger(
    WorkspaceMemberApprovalNotifierService.name,
  );

  constructor(
    private readonly emailService: EmailService,
    private readonly i18nService: I18nService,
    private readonly twentyConfigService: TwentyConfigService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
  ) {}

  async notifyAdminsOfPendingMember({
    workspace,
    pendingUser,
  }: {
    workspace: Pick<WorkspaceEntity, 'id' | 'displayName'>;
    pendingUser: Pick<UserEntity, 'email' | 'firstName' | 'lastName'>;
  }): Promise<void> {
    try {
      const { flatRoleMaps, flatRolePermissionFlagMaps, flatRoleTargetMaps } =
        await this.workspaceCacheService.getOrRecompute(workspace.id, [
          'flatRoleMaps',
          'flatRolePermissionFlagMaps',
          'flatRoleTargetMaps',
        ]);

      const adminUserWorkspaceIds = resolveUserWorkspaceIdsWithPermissionFlag({
        permissionFlag: PermissionFlagType.WORKSPACE_MEMBERS,
        flatRoleMaps,
        flatRolePermissionFlagMaps,
        flatRoleTargetMaps,
      });

      if (adminUserWorkspaceIds.length === 0) {
        return;
      }

      const adminUserWorkspaces = await this.userWorkspaceRepository.find({
        where: {
          id: In(adminUserWorkspaceIds),
          workspaceId: workspace.id,
        },
        relations: { user: true },
      });

      const pendingUserLabel = [pendingUser.firstName, pendingUser.lastName]
        .filter(isDefined)
        .join(' ')
        .trim();
      const displayName =
        pendingUserLabel.length > 0 ? pendingUserLabel : pendingUser.email;
      const workspaceName = workspace.displayName ?? 'workspace';

      await Promise.all(
        adminUserWorkspaces.map(async (adminUserWorkspace) => {
          const admin = adminUserWorkspace.user;

          if (!isDefined(admin?.email) || admin.email === pendingUser.email) {
            return;
          }

          const locale = admin.locale ?? SOURCE_LOCALE;
          const isPortuguese = String(locale).toLowerCase().startsWith('pt');
          const i18n = this.i18nService.getI18nInstance(locale);
          const subject = isPortuguese
            ? 'Novo membro aguardando aprovação'
            : i18n._(msg`New member waiting for approval`);
          const text = isPortuguese
            ? `${displayName} (${pendingUser.email}) está aguardando aprovação para entrar em ${workspaceName}. Abra Configurações > Membros para aprovar ou recusar.`
            : i18n._(
                msg`${displayName} (${pendingUser.email}) is waiting for approval to join ${workspaceName}. Open Settings > Members to approve or reject them.`,
              );

          await this.emailService.send({
            from: `${this.twentyConfigService.get('EMAIL_FROM_NAME')} <${this.twentyConfigService.get('EMAIL_FROM_ADDRESS')}>`,
            to: admin.email,
            subject,
            text,
          });
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify admins of a pending member: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
