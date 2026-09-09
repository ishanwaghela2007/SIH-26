import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../../tokens/token.service';
import { UsersService } from '../../users/users.service';
import { AccessClaims } from '../../tokens/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly tokens: TokenService,
    private readonly users: UsersService,
  ) {
    const privateKey = config
      .get<string>('JWT_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');
    const publicKey = config
      .get<string>('JWT_PUBLIC_KEY')
      ?.replace(/\\n/g, '\n');
    const secret =
      config.get<string>('JWT_ACCESS_SECRET') ??
      config.get<string>('JWT_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: privateKey && publicKey ? publicKey : (secret ?? ''),
      algorithms: privateKey && publicKey ? ['RS256'] : ['HS256'],
    });
  }

  async validate(payload: AccessClaims) {
    if (
      payload.type !== 'access' ||
      (await this.tokens.isAccessJtiRevoked(payload.jti))
    ) {
      throw new UnauthorizedException('INVALID_ACCESS_TOKEN');
    }
    const user = await this.users.findById(payload.sub).catch(() => null);
    if (!user || user.status !== 'ACTIVE')
      throw new UnauthorizedException('INVALID_ACCESS_TOKEN');
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
