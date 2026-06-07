import { Module } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';

@Module({
  controllers: [SuggestionsController],
  providers: [SuggestionsService],
})
export class SuggestionsModule {}
