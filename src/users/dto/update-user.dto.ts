import { PartialType, OmitType } from '@nestjs/swagger';
import { RegisterDto } from 'src/auth/dto/register.dto';

// password는 해싱 로직 없이 그대로 저장되면 안 되므로 제외 (비밀번호 변경은 ChangePasswordDto 사용)
export class UpdateUserDto extends PartialType(
  OmitType(RegisterDto, ['password'] as const),
) {}
