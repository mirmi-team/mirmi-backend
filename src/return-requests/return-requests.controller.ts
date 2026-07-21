import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ReturnRequestsService } from './return-requests.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnRequestDto } from './dto/update-return-request.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';

@Controller('return-requests')
export class ReturnRequestsController {
  constructor(private readonly returnRequestsService: ReturnRequestsService) {}

  @Post()
  create(@Body() createReturnRequestDto: CreateReturnRequestDto) {
    return this.returnRequestsService.create(createReturnRequestDto);
  }

  @Get()
  findAll() {
    return this.returnRequestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.returnRequestsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReturnRequestDto: UpdateReturnRequestDto) {
    return this.returnRequestsService.update(+id, updateReturnRequestDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.returnRequestsService.remove(+id);
  }
}
