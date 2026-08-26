import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

interface AuthUser {
  username: string;
  email: string;
}

@ApiTags('contact')
@ApiBearerAuth()
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @ApiOperation({ summary: '문의 메일 발송' })
  @Post()
  @UseGuards(JwtAuthGuard)
  sendContactMail(@GetUser() user: AuthUser, @Body() dto: CreateContactDto) {
    return this.contactService.sendContactMail(user, dto);
  }
}
