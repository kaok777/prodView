import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Public, CurrentUser, Roles } from '../common/decorators';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  getAllCategories() {
    return this.categoriesService.getAllCategories();
  }

  @Public()
  @Get(':id')
  getCategoryById(@Param('id') id: string) {
    return this.categoriesService.getCategoryById(id);
  }

  @Roles('admin')
  @Post()
  createCategory(
    @CurrentUser() user: any,
    @Body() createCategoryDto: { name: string; parentCategoryId?: string },
  ) {
    return this.categoriesService.createCategory(
      user.id,
      createCategoryDto.name,
      createCategoryDto.parentCategoryId,
    );
  }
}
