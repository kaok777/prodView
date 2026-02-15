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
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Public, CurrentUser, Roles } from '../common/decorators';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto, LimitDto, SearchDto } from '../common/dto/pagination.dto';

/**
 * ProductsController
 *
 * Handles both public and admin product routes with clear separation:
 * - Public routes: GET /products/latest, /products/search, /products/category/:id, etc.
 * - Admin routes: GET /products/admin/all, /products/admin/:id, POST /products, PUT /products/:id, DELETE /products/:id
 *
 * Fixed: MEDIUM-B4 - Inconsistent Route Protection Patterns
 * All admin routes are clearly marked with @Roles('admin') decorator
 * Public routes are clearly marked with @Public() decorator
 *
 * Note: Route order is critical to prevent path shadowing
 */
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ==========================================
  // PUBLIC ROUTES (no authentication required)
  // ==========================================
  // IMPORTANT: Route order matters to prevent shadowing
  // Specific routes (latest, search, category/:id, use-case/:id, admin/all) must come BEFORE generic /:id
  // Do not reorder without careful consideration

  @Public()
  @Get('latest')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  getLatestProducts(@Query() paginationDto: PaginationDto) {
    return this.productsService.getLatestProducts(
      paginationDto.pageSize || 40,
      paginationDto.page || 1,
    );
  }

  @Public()
  @Get('search')
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  searchProducts(
    @Query() searchDto: SearchDto,
    @Ip() ip: string,
  ) {
    return this.productsService.searchProducts(
      searchDto.keyword || '',
      searchDto.page || 1,
      searchDto.pageSize || 20,
      ip,
    );
  }

  @Public()
  @Get('category/:categoryId')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  getProductsByCategory(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.productsService.getProductsByCategory(
      categoryId,
      paginationDto.page || 1,
      paginationDto.pageSize || 20,
      paginationDto.sortBy || 'latest',
    );
  }

  @Public()
  @Get('use-case/:useCaseId')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  getProductsByUseCase(
    @Param('useCaseId', new ParseUUIDPipe({ version: '4' })) useCaseId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.productsService.getProductsByUseCase(
      useCaseId,
      paginationDto.page || 1,
      paginationDto.pageSize || 20,
      paginationDto.sortBy || 'latest',
    );
  }

  // ==========================================
  // ADMIN ROUTES (requires authentication + admin role)
  // ==========================================

  @Roles('admin')
  @Get('admin/all')
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  getAllProductsForAdmin(
    @CurrentUser() user: any,
    @Query() limitDto: LimitDto,
  ) {
    return this.productsService.getAllProductsForAdmin(
      user.id,
      limitDto.limit || 100,
    );
  }

  @Roles('admin')
  @Get('admin/:id')
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  getProductByIdAdmin(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string
  ) {
    return this.productsService.getProductByIdAdmin(id);
  }

  @Public()
  @Get(':id')
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  getProductById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.productsService.getProductById(id);
  }

  @Roles('admin')
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createProduct(
    @CurrentUser() user: any,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.createProduct(user.id, createProductDto);
  }

  @Roles('admin')
  @Put(':id')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  updateProduct(
    @CurrentUser() user: any,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(user.id, id, updateProductDto);
  }

  @Roles('admin')
  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  deleteProduct(
    @CurrentUser() user: any,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.productsService.deleteProduct(user.id, id);
  }
}
