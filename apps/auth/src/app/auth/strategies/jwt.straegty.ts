import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { TokenPayload } from '@nx-backend/graphql';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          if (request.cookies.Authentication) {
            return request.cookies.Authentication || request.accessToken;
          }
          const authorization = request.headers.authorization;
          // if (authorization && authorization.startsWith('Bearer ')) {
          //   return authorization.slice(7, authorization.length);
          // }
          if (authorization && authorization.startsWith('Bearer')) {
            return authorization.substring(7, authorization.length);
          }
        },
        // request?.cookies?.Authentication || request.accessToken,
      ]),
      secretOrKey: configService.getOrThrow('AUTH_JWT_SECRET'),
    });
  }

  async validate(payload: TokenPayload) {
    return payload;
  }
}
