import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { FeatureModulesModule } from './modules/feature-modules.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { JobsSyncModule } from './jobs/jobs-sync.module';

@Module({
  imports: [
    FeatureModulesModule,
    DatabaseModule,
    IntegrationsModule,
    JobsSyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
