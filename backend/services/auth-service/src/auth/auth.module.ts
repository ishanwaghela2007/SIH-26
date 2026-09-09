import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGrpcController } from './auth.grpc.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtGuard } from './guards/jwt.guard';
import { UsersModule } from '../users/users.module';
import { TokensModule } from '../tokens/token.module';
import { AdminBootstrapService } from './admin-bootstrap.service';

@Module({
  imports: [PassportModule, UsersModule, TokensModule],
  controllers: [AuthController, AuthGrpcController],
  providers: [AuthService, JwtStrategy, JwtGuard, AdminBootstrapService],
  exports: [AuthService],
})
export class AuthModule {}
