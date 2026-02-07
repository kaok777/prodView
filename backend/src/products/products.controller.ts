import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Public, CurrentUser, Roles } from '../common/decorators';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get('latest')
  getLatestProducts(@Query('limit') limit: string) {
    return this.productsService.getLatestProducts(parseInt(limit) || 10);
  }

  @Public()
  @Get('search')
  searchProducts(
    @Query('keyword') keyword: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Ip() ip: string,
  ) {
    return this.productsService.searchProducts(
      keyword,
      parseInt(page) || 1,
      parseInt(pageSize) || 100,
      ip,
    );
  }

  @Public()
  @Get('category/:categoryId')
  getProductsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    return this.productsService.getProductsByCategory(
      categoryId,
      parseInt(page) || 1,
      parseInt(pageSize) || 100,
    );
  }

  @Public()
  @Get('use-case/:useCaseId')
  getProductsByUseCase(
    @Param('useCaseId') useCaseId: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    return this.productsService.getProductsByUseCase(
      useCaseId,
      parseInt(page) || 1,
      parseInt(pageSize) || 100,
    );
  }

  @Public()
  @Get(':id')
  getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Roles('admin')
  @Get('admin/all')
  getAllProductsForAdmin(
    @CurrentUser() user: any,
    @Query('limit') limit: string,
  ) {
    return this.productsService.getAllProductsForAdmin(
      user.id,
      parseInt(limit) || 100,
    );
  }

  @Roles('admin')
  @Post()
  createProduct(@CurrentUser() user: any, @Body() createProductDto: any) {
    return this.productsService.createProduct(user.id, createProductDto);
  }

  @Roles('admin')
  @Put(':id')
  updateProduct(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateProductDto: any,
  ) {
    return this.productsService.updateProduct(user.id, id, updateProductDto);
  }

  @Roles('admin')
  @Delete(':id')
  deleteProduct(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productsService.deleteProduct(user.id, id);
  }
}
