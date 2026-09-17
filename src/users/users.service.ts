import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { extname } from 'path';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SupabaseService } from '../common/supabase/supabase.service';
import { Room } from 'src/rooms/entities/room.entity';

const PROFILE_IMAGE_BUCKET = 'profile-image';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private readonly supabaseService: SupabaseService,
  ) {}

  async findMe(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { room: true }, // 한 번에 조인
    });
    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    const { password, room, ...result } = user;
    return {
      ...result,
      room_number: room?.room_number,
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 1. 현재 비밀번호가 맞는지 확인
    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('현재 비밀번호가 일치하지 않습니다.');
    }

    // 2. 새 비밀번호 해시해서 저장
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);

    return { message: '비밀번호가 변경되었습니다.' };
  }

  async updateProfileImage(userId: number, file: Express.Multer.File) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const storagePath = `id_${userId}${extname(file.originalname)}`;
    const bucket =
      this.supabaseService.client.storage.from(PROFILE_IMAGE_BUCKET);

    const { error: uploadError } = await bucket.upload(
      storagePath,
      file.buffer,
      { contentType: file.mimetype, upsert: true },
    );
    if (uploadError) {
      throw new BadRequestException(
        `프로필 사진 업로드에 실패했습니다: ${uploadError.message}`,
      );
    }

    const {
      data: { publicUrl },
    } = bucket.getPublicUrl(storagePath);

    // 확장자가 바뀌어 이전과 다른 오브젝트로 저장된 경우, 기존 오브젝트는 정리
    const oldStoragePath = this.extractStoragePath(user.profile_image);
    if (oldStoragePath && oldStoragePath !== storagePath) {
      await bucket.remove([oldStoragePath]);
    }

    // 경로가 같으면 URL도 같아 CDN/브라우저 캐시에 이전 이미지가 남으므로 버전 쿼리로 무효화
    user.profile_image = `${publicUrl}?v=${Date.now()}`;
    await this.userRepository.save(user);

    return {
      message: '프로필 사진이 변경되었습니다.',
      profile_image: user.profile_image,
    };
  }

  async update(userId: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (dto.email !== undefined && dto.email !== user.email) {
      const emailExists = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
      user.email = dto.email;
    }

    if (dto.room_number !== undefined) {
      const room = await this.roomRepository.findOne({
        where: { room_number: dto.room_number },
      });
      if (!room) {
        throw new NotFoundException('존재하지 않는 방 번호입니다.');
      }
      user.room_id = room.id;
    }

    if (dto.username !== undefined) user.username = dto.username;
    if (dto.can_staying !== undefined) user.can_staying = dto.can_staying;
    if (dto.grade !== undefined) user.grade = dto.grade;
    if (dto.class_no !== undefined) user.class_no = dto.class_no;
    if (dto.gender !== undefined) user.gender = dto.gender;

    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }

  private extractStoragePath(publicUrl: string | null): string | null {
    if (!publicUrl) return null;
    const marker = `/object/public/${PROFILE_IMAGE_BUCKET}/`;
    const index = publicUrl.indexOf(marker);
    if (index === -1) return null;
    return publicUrl.slice(index + marker.length).split('?')[0];
  }
}
