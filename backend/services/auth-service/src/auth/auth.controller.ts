import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtGuard } from './guards/jwt.guard';
import { Request } from 'express';
import { RefreshDto } from './dto/refresh.dto';
import {
  EmailDto,
  LogoutDto,
  PasswordResetDto,
  TokenDto,
} from './dto/token.dto';
import { GoogleIdTokenDto } from './dto/google.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.context(req));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, this.context(req));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.authService.refresh(dto.refreshToken, this.context(req));
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @Body() dto: LogoutDto,
    @Req()
    req: Request & { user: { userId: string; jti: string; exp?: number } },
  ) {
    return this.authService.logout(
      req.user.userId,
      dto.refreshToken,
      req.user,
      this.context(req),
    );
  }

  @Post('google/login')
  @HttpCode(HttpStatus.OK)
  googleLogin(@Body() dto: GoogleIdTokenDto, @Req() req: Request) {
    return this.authService.googleLogin(dto.idToken, this.context(req));
  }

  @UseGuards(JwtGuard)
  @Post('google/link')
  @HttpCode(HttpStatus.OK)
  linkGoogle(
    @Body() dto: GoogleIdTokenDto,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.authService.linkGoogle(
      req.user.userId,
      dto.idToken,
      this.context(req),
    );
  }

  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: TokenDto, @Req() req: Request) {
    return this.authService.verifyEmail(dto.token, this.context(req));
  }

  @Post('email/resend')
  @HttpCode(HttpStatus.OK)
  resendEmail(@Body() dto: EmailDto, @Req() req: Request) {
    return this.authService.resendVerification(dto.email, this.context(req));
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: EmailDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto.email, this.context(req));
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: PasswordResetDto, @Req() req: Request) {
    return this.authService.resetPassword(
      dto.token,
      dto.password,
      this.context(req),
    );
  }

  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req: Request & { user: { userId: string } }) {
    return this.authService.getUser(req.user.userId);
  }

  private context(req: Request) {
    return { ip: req.ip, userAgent: req.get('user-agent') };
  }
}
