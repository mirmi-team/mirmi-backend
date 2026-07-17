import { IsInt, IsDateString, IsOptional, IsEnum } from 'class-validator';

export enum ReservationStatus {
  PENDING = 'PENDING',
  IN_USE = 'IN_USE',
  DONE = 'DONE',
  CANCELED = 'CANCELED',
}

export class CreateLaundryDto {
  @IsInt()
  laundry_id: number;

  @IsInt()
  room_number: number;

  @IsDateString()
  start_time: string;

  @IsDateString()
  end_time: string;

  // 명세엔 포함되어 있지만, 서버에서 항상 PENDING으로 고정.
  // 클라이언트가 임의로 DONE 등을 보내지 못하도록 서비스단에서 무시.
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;
}
