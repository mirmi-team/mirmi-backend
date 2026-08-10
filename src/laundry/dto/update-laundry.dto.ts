import { IsEnum } from 'class-validator';

export enum LaundryMachineStatus {
  AVAILABLE = 'AVAILABLE',
  BROKEN = 'BROKEN',
}

// 관리자가 세탁기 자체의 상태(고장 여부)를 바꾸는 것이라
// 예약(CreateLaundryDto)과는 완전히 다른 필드라 PartialType으로 상속받지 않고
// 별도로 정의
export class UpdateLaundryDto {
  @IsEnum(LaundryMachineStatus, {
    message: 'status는 AVAILABLE, BROKEN 중 하나여야 합니다.',
  })
  status: LaundryMachineStatus;
}
