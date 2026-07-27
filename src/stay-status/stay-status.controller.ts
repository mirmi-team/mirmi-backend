import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StayStatusService } from './stay-status.service';
import { CreateStayStatusDto } from './dto/create-stay-status.dto';
import { UpdateStayStatusDto } from './dto/update-stay-status.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';

@Controller('stay-status')
export class StayStatusController {
  constructor(private readonly stayStatusService: StayStatusService) {}

  @Post()
  create(@Body() createStayStatusDto: CreateStayStatusDto) {
    return this.stayStatusService.create(createStayStatusDto);
  }

  @Get()
  findAll() {
    return this.stayStatusService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stayStatusService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStayStatusDto: UpdateStayStatusDto) {
    return this.stayStatusService.update(+id, updateStayStatusDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.stayStatusService.remove(+id);
  }
}
