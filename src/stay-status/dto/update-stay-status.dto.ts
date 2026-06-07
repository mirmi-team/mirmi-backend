import { PartialType } from '@nestjs/mapped-types';
import { CreateStayStatusDto } from './create-stay-status.dto';

export class UpdateStayStatusDto extends PartialType(CreateStayStatusDto) {}
