import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CleaningDutyService } from './cleaning-duty.service';
import { CreateCleaningDutyDto } from './dto/create-cleaning-duty.dto';
import { UpdateCleaningDutyDto } from './dto/update-cleaning-duty.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';

@Controller('cleaning-duty')
export class CleaningDutyController {
  constructor(private readonly cleaningDutyService: CleaningDutyService) {}

  @Post()
  create(@Body() createCleaningDutyDto: CreateCleaningDutyDto) {
    return this.cleaningDutyService.create(createCleaningDutyDto);
  }

  @Get()
  findAll() {
    return this.cleaningDutyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cleaningDutyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCleaningDutyDto: UpdateCleaningDutyDto) {
    return this.cleaningDutyService.update(+id, updateCleaningDutyDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.cleaningDutyService.remove(+id);
  }
}
