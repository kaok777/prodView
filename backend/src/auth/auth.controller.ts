import { Controller, Post, Body, Ip, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: { email: string; password: string },
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
  async setupFirstAdmin() {
    return this.authService.setupFirstAdmin();
  }
}
