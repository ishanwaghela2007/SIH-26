import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', ''),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', ''),
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3001/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { emails, displayName } = profile;
    const email = emails?.[0]?.value ?? '';

    const verified =
      (profile._json as { email_verified?: boolean } | undefined)
        ?.email_verified === true;
    if (!profile.id || !email || !verified) {
      done(null, false);
      return;
    }

    // Account creation/linking is deliberately handled by AuthService after
    // server-side identity verification; this strategy never links by email.
    done(null, {
      providerId: profile.id,
      email: email.trim().toLowerCase(),
      name: displayName,
    });
  }
}
