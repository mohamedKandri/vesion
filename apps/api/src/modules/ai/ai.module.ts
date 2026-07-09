import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AssistantEngine } from './assistant-engine';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { PortfolioModule } from '../portfolio/portfolio.module';

@Module({
  imports: [KnowledgeBaseModule, PortfolioModule],
  controllers: [AiController],
  providers: [AiService, AssistantEngine],
})
export class AiModule {}
