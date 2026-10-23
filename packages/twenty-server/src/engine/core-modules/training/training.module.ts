import { Module } from '@nestjs/common';

import { TokenModule } from 'src/engine/core-modules/auth/token/token.module';
import { JwtModule } from 'src/engine/core-modules/jwt/jwt.module';
import { TrainingController } from 'src/engine/core-modules/training/controllers/training.controller';
import { TrainingService } from 'src/engine/core-modules/training/services/training.service';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';

@Module({
  imports: [JwtModule, TokenModule, WorkspaceCacheStorageModule],
  controllers: [TrainingController],
  providers: [TrainingService],
})
export class TrainingModule {}
