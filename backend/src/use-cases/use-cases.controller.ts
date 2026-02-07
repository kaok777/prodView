import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UseCasesService } from './use-cases.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Public, CurrentUser, Roles } from '../common/decorators';

@Controller('use-cases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UseCasesController {
  constructor(private readonly useCasesService: UseCasesService) {}

  @Public()
  @Get()
  getAllUseCases() {
    return this.useCasesService.getAllUseCases();
  }

  @Public()
  @Get(':id')
  getUseCaseById(@Param('id') id: string) {
    return this.useCasesService.getUseCaseById(id);
  }

  @Roles('admin')
  @Post()
  createUseCase(
    @CurrentUser() user: any,
    @Body() createUseCaseDto: { name: string },
  ) {
    return this.useCasesService.createUseCase(user.id, createUseCaseDto.name);
  }
}
