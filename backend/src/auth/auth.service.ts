import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RateLimitService } from '../common/rate-limit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
    private rateLimitService: RateLimitService,
  ) {}

  async validateAdmin(email: string, password: string): Promise<any> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin) {
      return null;
    }

    const validPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!validPassword) {
      return null;
    }

    const { passwordHash, ...result } = admin;
    return result;
  }

  async login(
    email: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ) {
    const rateLimitKey = `login:${email}:${ip || 'unknown'}`;
    const rateCheck = await this.rateLimitService.checkRateLimit(
      rateLimitKey,
      15 * 60 * 1000,
      5,
    );

    if (!rateCheck.allowed) {
      await this.auditService.logAction(
        null,
        'login_rate_limited',
        'auth',
        email,
        { ip, userAgent },
      );
      throw new UnauthorizedException('Too many login attempts. Please try again later.');
    }

    if (!this.validateEmail(email)) {
      throw new UnauthorizedException('Invalid email format');
    }

    if (!this.validatePassword(password)) {
      throw new UnauthorizedException('Invalid password format');
    }

    await this.rateLimitService.recordAttempt(rateLimitKey, ip, userAgent);

    const admin = await this.validateAdmin(email, password);

    if (!admin) {
      await this.auditService.logAction(
        null,
        'login_failed_invalid_credentials',
        'auth',
        email,
        { ip, userAgent },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    await this.auditService.logAction(
      admin.id,
      'login_success',
      'auth',
      email,
      { ip, userAgent },
    );

    const payload = { sub: admin.id, email: admin.email, role: admin.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      accessToken,
    };
  }

  async setupFirstAdmin(): Promise<any> {
    const existingAdmins = await this.prisma.adminUser.count();

    if (existingAdmins > 0) {
      throw new UnauthorizedException('Admin users already exist.');
    }

    const defaultEmail = 'vibrationconnect@gmail.com';
    const defaultPassword = 'Cxserfd345;';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

    const admin = await this.prisma.adminUser.create({
      data: {
        email: defaultEmail,
        passwordHash,
        role: 'admin',
      },
    });

    return {
      adminId: admin.id,
      email: defaultEmail,
      password: defaultPassword,
      message: 'First admin created successfully.',
    };
  }

  async createAdmin(email: string, password: string): Promise<string> {
    if (!this.validateEmail(email)) {
      throw new UnauthorizedException('Invalid email');
    }

    if (!this.validatePassword(password)) {
      throw new UnauthorizedException('Invalid password');
    }

    const existingAdmin = await this.prisma.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingAdmin) {
      throw new UnauthorizedException('Admin already exists');
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const admin = await this.prisma.adminUser.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'admin',
      },
    });

    return admin.id;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  validatePassword(password: string): boolean {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const minLength = password.length >= 8;
    const maxLength = password.length <= 128;

    return hasUpper && hasLower && hasNumber && hasSpecial && minLength && maxLength;
  }
}
