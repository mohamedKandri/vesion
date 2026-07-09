import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { TestimonialsController } from './testimonials.controller';
import { FaqController } from './faq.controller';
import { PortfolioService } from './portfolio.service';

@Module({
  controllers: [PortfolioController, TestimonialsController, FaqController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
