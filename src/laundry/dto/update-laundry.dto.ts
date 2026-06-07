import { PartialType } from '@nestjs/mapped-types';
import { CreateLaundryDto } from './create-laundry.dto';

export class UpdateLaundryDto extends PartialType(CreateLaundryDto) {}
