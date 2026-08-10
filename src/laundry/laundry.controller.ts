import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LaundryService } from './laundry.service';
import { CreateLaundryDto } from './dto/create-laundry.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('laundry')
export class LaundryController {
  constructor(private readonly laundryService: LaundryService) {}

  // GET /laundry
  @Get()
  findAllMachines() {
    return this.laundryService.findAllMachines();
  }

  // POST /laundry/requests
  @Post('requests')
  createReservation(
    @Body() dto: CreateLaundryDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.laundryService.createReservation(dto, user.id);
  }

  // GET /laundry/requests/me
  @Get('requests/me')
  findMyReservations(@CurrentUser() user: { id: number }) {
    return this.laundryService.findMyReservations(user.id);
  }

  // DELETE /laundry/reservations/:id
  @Delete('reservations/:id')
  cancelReservation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.laundryService.cancelReservation(id, user.id);
  }
}
