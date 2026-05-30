import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UseCasesService } from './use-cases.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Public, CurrentUser, Roles } from '../common/decorators';
import { CreateUseCaseDto } from './dto/create-use-case.dto';
import { UpdateUseCaseDto } from './dto/update-use-case.dto';

@Controller('use-cases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UseCasesController {
  constructor(private readonly useCasesService: UseCasesService) {}

  @Public()
  @Get()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  getAllUseCases() {
    return this.useCasesService.getAllUseCases();
  }

  @Public()
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  getUseCaseById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.useCasesService.getUseCaseById(id);
  }

  @Roles('admin')
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createUseCase(
    @CurrentUser() user: any,
    @Body() createUseCaseDto: CreateUseCaseDto,
  ) {
    return this.useCasesService.createUseCase(user.id, createUseCaseDto.name);
  }

  @Roles('admin')
  @Put(':id')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  updateUseCase(
    @CurrentUser() user: any,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateUseCaseDto: UpdateUseCaseDto,
  ) {
    return this.useCasesService.updateUseCase(user.id, id, updateUseCaseDto);
  }

  @Roles('admin')
  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  deleteUseCase(
    @CurrentUser() user: any,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.useCasesService.deleteUseCase(user.id, id);
  }
}
