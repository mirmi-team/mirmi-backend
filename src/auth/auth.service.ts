import { ConflictException, Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  //1. 이메일 중복 체크
  async register(dto: RegisterDto) {
    const exists = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    //2. 비밀번호 해시
    const hashedPassworld = await bcrypt.hash(dto.password, 10);

    //3, 저장
    const user = this.userRepository.create({
      email: dto.email,
      username: dto.username,
      room_id: dto.room_id,
      password: hashedPassworld,
    });
    const saved = await this.userRepository.save(user);

    const { password, ...result } = saved;
    return result;
  }
}
