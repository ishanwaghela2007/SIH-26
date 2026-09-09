import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { AuthClientService } from './auth-client.service';
import { AuthGuard } from './auth.guard';

export const AUTH_PACKAGE = 'AUTH_PACKAGE';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUTH_PACKAGE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'auth',
            protoPath: join(process.cwd(), 'proto/auth.proto'),
            url: config.getOrThrow<string>('AUTH_GRPC_URL'),
          },
        }),
      },
    ]),
  ],
  providers: [AuthClientService, AuthGuard],
  exports: [AuthClientService, AuthGuard],
})
export class AuthModule {}
