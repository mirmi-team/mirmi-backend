import { PartialType } from '@nestjs/mapped-types';
import { CreateMeritLogDto } from './create-merit-log.dto';

export class UpdateMeritLogDto extends PartialType(CreateMeritLogDto) {}
