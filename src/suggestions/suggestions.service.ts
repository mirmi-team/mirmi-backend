import { Injectable } from '@nestjs/common';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';

@Injectable()
export class SuggestionsService {
  create(createSuggestionDto: CreateSuggestionDto) {
    return 'This action adds a new suggestion';
  }

  findAll() {
    return `This action returns all suggestions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} suggestion`;
  }

  update(id: number, updateSuggestionDto: UpdateSuggestionDto) {
    return `This action updates a #${id} suggestion`;
  }

  remove(id: number) {
    return `This action removes a #${id} suggestion`;
  }
}
