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
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Public, CurrentUser, Roles } from '../common/decorators';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  getAllCategories() {
    return this.categoriesService.getAllCategories();
  }

  @Public()
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  getCategoryById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.categoriesService.getCategoryById(id);
  }

  @Roles('admin')
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createCategory(
    @CurrentUser() user: any,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.createCategory(
      user.id,
      createCategoryDto.name,
      createCategoryDto.parentCategoryId,
    );
  }

  @Roles('admin')
  @Put(':id')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  updateCategory(
    @CurrentUser() user: any,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(user.id, id, updateCategoryDto);
  }

  @Roles('admin')
  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  deleteCategory(
    @CurrentUser() user: any,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.categoriesService.deleteCategory(user.id, id);
  }
}
