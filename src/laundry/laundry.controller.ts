import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { LaundryService } from './laundry.service';
import { CreateLaundryDto } from './dto/create-laundry.dto';
import { UpdateLaundryDto } from './dto/update-laundry.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';

@Controller('laundry')
export class LaundryController {
  constructor(private readonly laundryService: LaundryService) {}

  @Post()
  create(@Body() createLaundryDto: CreateLaundryDto) {
    return this.laundryService.create(createLaundryDto);
  }

  @Get()
  findAll() {
    return this.laundryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.laundryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLaundryDto: UpdateLaundryDto) {
    return this.laundryService.update(+id, updateLaundryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.laundryService.remove(+id);
  }
}
