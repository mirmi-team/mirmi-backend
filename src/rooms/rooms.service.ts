import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

interface RoomStudentRow {
  room_id: number;
  room_number: number;
  floor: number | null;
  student_id: number | null;
  username: string | null;
  grade: number | null;
  class_no: number | null;
  total_merit_score: number | null;
  profile_image: string | null;
}

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  /**
   * 호실별 학생 목록 (관리자용). 한 번의 조인 쿼리로 조회한다.
   * role 조건은 WHERE가 아닌 LEFT JOIN의 ON에 두어 학생이 없는 호실도 포함한다.
   */
  async findAllWithStudents(floor?: number) {
    const qb = this.roomRepository
      .createQueryBuilder('r')
      .leftJoin(User, 'u', 'u.room_id = r.id AND u.role = :role', {
        role: UserRole.STUDENT,
      })
      .select([
        'r.id AS room_id',
        'r.room_number AS room_number',
        'r.floor AS floor',
        'u.id AS student_id',
        'u.username AS username',
        'u.grade AS grade',
        'u.class_no AS class_no',
        'u.total_merit_score AS total_merit_score',
        'u.profile_image AS profile_image',
      ]);

    if (floor !== undefined) {
      qb.where('r.floor = :floor', { floor });
    }

    const rows = await qb
      .orderBy('r.room_number', 'ASC')
      .addOrderBy('u.grade', 'ASC', 'NULLS LAST')
      .addOrderBy('u.class_no', 'ASC', 'NULLS LAST')
      .addOrderBy('u.username', 'ASC', 'NULLS LAST')
      .getRawMany<RoomStudentRow>();

    // 행이 호실 순으로 정렬돼 있으므로 호실별로 묶는다.
    const rooms = new Map<
      number,
      {
        room_id: number;
        room_number: number;
        floor: number | null;
        students: {
          id: number;
          username: string;
          grade: number | null;
          class_no: number | null;
          total_merit_score: number;
          profile_image: string | null;
        }[];
      }
    >();
    for (const row of rows) {
      let room = rooms.get(row.room_id);
      if (!room) {
        room = {
          room_id: row.room_id,
          room_number: row.room_number,
          floor: row.floor,
          students: [],
        };
        rooms.set(row.room_id, room);
      }
      if (row.student_id !== null) {
        room.students.push({
          id: row.student_id,
          username: row.username as string,
          grade: row.grade,
          class_no: row.class_no,
          total_merit_score: row.total_merit_score as number,
          profile_image: row.profile_image,
        });
      }
    }
    return [...rooms.values()];
  }

  create(createRoomDto: CreateRoomDto) {
    return 'This action adds a new room';
  }

  findAll() {
    return `This action returns all rooms`;
  }

  findOne(id: number) {
    return `This action returns a #${id} room`;
  }

  update(id: number, updateRoomDto: UpdateRoomDto) {
    return `This action updates a #${id} room`;
  }

  remove(id: number) {
    return `This action removes a #${id} room`;
  }
}
