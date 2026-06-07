import { PartialType } from '@nestjs/mapped-types';
import { CreateReturnRequestDto } from './create-return-request.dto';

export class UpdateReturnRequestDto extends PartialType(CreateReturnRequestDto) {}
