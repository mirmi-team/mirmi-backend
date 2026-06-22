import { IsEmail } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  email: string;
}
