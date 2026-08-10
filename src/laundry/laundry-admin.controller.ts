import {
  Controller,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LaundryService } from './laundry.service';
import { UpdateLaundryDto } from './dto/update-laundry.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/laundry/machines')
export class LaundryAdminController {
  constructor(private readonly laundryService: LaundryService) {}

  // PATCH /admin/laundry/machines/:id
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  updateMachineStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLaundryDto,
  ) {
    return this.laundryService.updateMachineStatus(id, dto);
  }
}
