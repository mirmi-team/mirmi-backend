import { ApiProperty } from '@nestjs/swagger';

export class RoomStudentDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: '홍길동' })
  username: string;

  @ApiProperty({ example: 2, nullable: true })
  grade: number | null;

  @ApiProperty({ example: 3, nullable: true })
  class_no: number | null;

  @ApiProperty({ example: 5 })
  total_merit_score: number;

  @ApiProperty({
    example: 'https://example.com/profile.png',
    nullable: true,
  })
  profile_image: string | null;
}

export class RoomWithStudentsResponseDto {
  @ApiProperty({ example: 1 })
  room_id: number;

  @ApiProperty({ example: 201 })
  room_number: number;

  @ApiProperty({ example: 2, nullable: true })
  floor: number | null;

  @ApiProperty({
    type: [RoomStudentDto],
    description: '학생(STUDENT)만 포함. 없으면 빈 배열',
  })
  students: RoomStudentDto[];
}
