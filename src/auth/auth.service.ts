import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const room = await this.roomRepository.findOne({
      where: { room_number: dto.room_number },
    });
    if (!room) {
      throw new NotFoundException('존재하지 않는 방 번호입니다.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      email: dto.email,
      username: dto.username,
      room_id:room.id,
      password: hashedPassword,
      can_staying: dto.can_staying,
      grade: dto.grade,
      class_no: dto.class_no,
    });
    const saved = await this.userRepository.save(user);

    const { password, ...result } = saved;
    return result;
  }
}
