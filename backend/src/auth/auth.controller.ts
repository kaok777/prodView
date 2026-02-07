import { Controller, Post, Body, Ip, Headers, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(
      loginDto.email,
      loginDto.password,
      ip,
      userAgent,
    );
  }

  @Post('setup-first-admin')
  @Throttle({ default: { limit: 1, ttl: 3600000 } })
  async setupFirstAdmin() {
    return this.authService.setupFirstAdmin();
  }
}
