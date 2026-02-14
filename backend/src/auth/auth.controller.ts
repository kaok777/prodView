import { Controller, Post, Body, Ip, Headers, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
      ip,
      userAgent,
    );

    const isProduction = process.env.NODE_ENV === 'production';

    // Set httpOnly cookies for access and refresh tokens
    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Return user data only (not tokens)
    return {
      adminId: result.adminId,
      email: result.email,
      role: result.role,
    };
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      response.status(401);
      return { message: 'No refresh token provided' };
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    const isProduction = process.env.NODE_ENV === 'production';

    // Set new httpOnly cookies
    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { message: 'Token refreshed successfully' };
  }

  @Public()
  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    // Clear cookies
    response.clearCookie('accessToken', { path: '/' });
    response.clearCookie('refreshToken', { path: '/' });

    return { message: 'Logged out successfully' };
  }
}
