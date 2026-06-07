import { PartialType } from '@nestjs/mapped-types';
import { CreateMorningSongDto } from './create-morning-song.dto';

export class UpdateMorningSongDto extends PartialType(CreateMorningSongDto) {}
