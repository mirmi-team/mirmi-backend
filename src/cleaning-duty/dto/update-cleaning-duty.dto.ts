import { PartialType } from '@nestjs/mapped-types';
import { CreateCleaningDutyDto } from './create-cleaning-duty.dto';

export class UpdateCleaningDutyDto extends PartialType(CreateCleaningDutyDto) {}
