import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';
import { UsersModule } from '../users/users.module';
import { TokensModule } from '../tokens/token.module';

@Module({
  imports: [PassportModule, UsersModule, TokensModule],
  providers: [GoogleStrategy],
})
export class OAuthModule {}
