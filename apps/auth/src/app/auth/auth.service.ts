import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginInput, LoginOutput } from './dto/login.input';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokensOutput } from './dto/tokens-input';
import { TwoFactorInput, TwoFactorOutput } from './dto/two-factor.input';
import * as speakeasy from 'speakeasy';
import {
  ToggleTwoFactorAuthInput,
  ToggleTwoFactorAuthOutput,
} from './dto/toggle-two-factor-auth.input';
import QRCode = require('qrcode');
import { TokenPayload } from '@nx-backend/graphql';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {}

  private calculateExpirationDate(expirationKey: string): Date {
    const expirationDuration = this.configService.getOrThrow(expirationKey);
    const expirationDate = new Date();
    expirationDate.setTime(
      expirationDate.getTime() + expirationDuration * 1000
    ); // 밀리초 단위로 변환
    return expirationDate;
  }

  generateTokens(
    tokenPayload: TokenPayload,
    rememberMe: boolean
  ): {
    accessToken: string;
    accessExpirationDate: Date;
  } {
    const accessTokenKey = rememberMe
      ? 'AUTH_JWT_REMEMBER_ME_ACCESS_EXPIRATION'
      : 'AUTH_JWT_ACCESS_EXPIRATION';

    const accessExpirationDate = this.calculateExpirationDate(accessTokenKey);
    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow('AUTH_JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow(accessTokenKey)}s`,
    });
    return {
      accessToken,
      accessExpirationDate,
    };
  }

  private setHttpOnlyCookie(
    response: Response,
    tokenName: string,
    tokenValue: string,
    expirationDate: Date
  ): void {
    response.cookie(tokenName, tokenValue, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      expires: expirationDate,
    });
  }

  private async verifyUser(
    email: string,
    password: string,
    rememberMe: boolean
  ) {
    try {
      const user = await this.usersService.getUser({ email });
      await this.usersService.validateUserPassword(user, password);
      await this.usersService.updateUserRememberMe(user.id, rememberMe);
      return user;
    } catch (err) {
      throw new UnauthorizedException('자격증명이 유효하지 않습니다.');
    }
  }

  private async generateAndSaveTokens(
    tokenPayload: TokenPayload,
    rememberMe: boolean
  ): Promise<{
    accessToken: string;
    accessExpirationDate: Date;
  }> {
    // Generate tokens
    return this.generateTokens(tokenPayload, rememberMe);
  }

  async preCheckLogin(email: string, password: string, rememberMe: boolean) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      include: { activation: true },
    });
    await this.usersService.validateUserExists(
      user.email,
      '사용자가 없습니다.'
    );
    await this.verifyUser(email, password, rememberMe);
    await this.usersService.validateUserPassword(user, password);
    // 3. 반환 (사용자 정보 및 2FA 여부)
    return {
      user,
      twoFactorActivated: user.activation.twoFactorActivated ?? false,
    };
  }

  async login(
    loginInput: LoginInput,
    res: Response,
    redirect = false
  ): Promise<LoginOutput> {
    try {
      const { email, password, rememberMe } = loginInput;
      const { twoFactorActivated } = await this.preCheckLogin(
        email,
        password,
        rememberMe
      );
      await this.usersService.validateUserExists(email, '사용자가 없습니다.');
      const user = await this.verifyUser(email, password, rememberMe);
      if (!user.isActive) {
        return { ok: false, error: '이메일 인증이 안 되었습니다.' };
      }

      const activation = await this.prismaService.activation.findUnique({
        where: { activationUserId: user.id },
      });
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { rememberMe },
      });
      const tokenPayload: TokenPayload = { userId: user.id };
      const tokens = await this.generateAndSaveTokens(tokenPayload, rememberMe);
      this.setHttpOnlyCookie(
        res,
        'Authentication',
        tokens.accessToken,
        tokens.accessExpirationDate
      );

      if (redirect) {
        res.redirect(this.configService.getOrThrow('AUTH_UI_REDIRECT'));
      }
      // 2FA 활성화 여부 확인
      if (twoFactorActivated) {
        // 2FA가 활성화된 경우: 임시 2FA 토큰 발급
        const twoFactorToken = this.jwtService.sign(
          {
            id: user.id,
            isTwoFactorPending: true,
          },
          {
            secret: this.configService.getOrThrow(
              'AUTH_JWT_ACTIVATION_TOKEN_SECRET'
            ),
            expiresIn: `${this.configService.getOrThrow(
              'AUTH_JWT_ACTIVATION_EXPIRATION'
            )}m`,
          }
        );
        return {
          ok: true,
          user,
          activation,
          twoFactorRequired: true,
          twoFactorToken, // 클라이언트에서 이를 통해 2FA 인증 페이지로 이동
        };
      }
      return { ok: true, ...tokens, twoFactorRequired: false, user };
    } catch (e) {
      console.error('Login error:', e); // 디버깅을 위한 로깅
      // NestJS HttpException 처리
      if (e instanceof BadRequestException) {
        return { ok: false, error: e.message }; // validateUser exists '사용자가 없습니다.' 반환
      }
      if (e instanceof UnauthorizedException) {
        return { ok: false, error: e.message };
      }
      return { ok: false, error: '메일 또는 비밀번호가 틀립니다.' };
    }
  }

  /**
   * 사용자별 2FA 시크릿 키 생성
   */
  async generateTwoFactorSecret(userId: number) {
    try {
      const secret = speakeasy.generateSecret({
        name: `Starcoex (${userId})`,
      });
      // 4. QR 코드 이미지 생성 (선택적)
      const qrCodeImage = await QRCode.toDataURL(secret.otpauth_url); // base64 인코딩된 QR 이미지

      await this.prismaService.user.update({
        where: { id: userId },
        data: {
          activation: {
            update: {
              twoFactorSecret: secret.base32,
            },
          },
        },
      });
      return {
        ok: true,
        secret: secret.base32,
        qrCode: secret.otpauth_url,
        qrCodeImage, // base64 QR 코드 이미지 반환 (선택사항)
      };
    } catch (e) {
      console.error('Generate two factor secret error:', e);
      return { ok: false, error: e };
    }
  }

  async verifyTwoFactor(
    twoFactorInput: TwoFactorInput,
    res: Response,
    redirect = false
  ): Promise<TwoFactorOutput> {
    try {
      const { twoFactorToken, otp, rememberMe } = twoFactorInput;
      const decodedToken = this.jwtService.verify(twoFactorToken, {
        secret: this.configService.getOrThrow(
          'AUTH_JWT_ACTIVATION_TOKEN_SECRET'
        ),
      });

      if (
        !decodedToken ||
        !decodedToken.id ||
        !decodedToken.isTwoFactorPending
      ) {
        return { ok: false, error: '유효하지 않은 임시 토큰입니다.' };
      }

      // 2. 사용자 조회 및 2FA 코드 검증
      const user = await this.prismaService.user.findUnique({
        where: { id: decodedToken.id },
        include: { activation: true },
      });
      if (!user || !user.activation?.twoFactorSecret) {
        return { ok: false, error: '2FA 설정 정보가 없습니다.' };
      }

      const verified = speakeasy.totp.verify({
        secret: user.activation.twoFactorSecret,
        encoding: 'base32',
        token: otp,
        window: 1,
      });
      if (!verified) {
        return { ok: false, error: '잘못된 2FA 코드입니다.' };
      }
      const tokenPayload: TokenPayload = { userId: user.id };
      const tokens = await this.generateAndSaveTokens(tokenPayload, rememberMe);

      await this.prismaService.user.update({
        where: { id: user.id },
        data: { rememberMe },
      });
      this.setHttpOnlyCookie(
        res,
        'Authentication',
        tokens.accessToken,
        tokens.accessExpirationDate
      );
      if (redirect) {
        res.redirect(this.configService.getOrThrow('AUTH_UI_REDIRECT'));
      }

      return { ok: true, ...tokens };
    } catch (error) {
      console.error('Verify two factor error:', error);
    }
  }

  async toggleTwoFactorAuthentication(
    userId: number,
    toggleTwoFactorAuthInput: ToggleTwoFactorAuthInput
  ): Promise<ToggleTwoFactorAuthOutput> {
    try {
      const { twoFactorActivated } = toggleTwoFactorAuthInput;
      // 1. 현재 사용자의 Activation 정보 가져오기
      const activation = await this.prismaService.activation.findUnique({
        where: { activationUserId: userId },
      });

      if (!activation) {
        return { ok: false, error: '사용자 활성화 정보를 찾을 수 없습니다.' };
      }

      if (twoFactorActivated) {
        const secret = speakeasy.generateSecret({
          name: `MyApp (${userId})`,
        });
        // Activation 테이블 업데이트: 2FA Secret 및 활성화 상태 저장
        const activation = await this.prismaService.activation.update({
          where: { activationUserId: userId },
          data: {
            twoFactorSecret: secret.base32,
            twoFactorActivated: true,
          },
        });

        return {
          ok: true,
          activation,
          secret: secret.base32,
          qrCode: secret.otpauth_url,
        };
      }

      // 3. 비활성화 처리
      if (!twoFactorActivated) {
        if (!activation.twoFactorActivated) {
          return { ok: false, error: '2FA가 이미 비활성화된 상태입니다.' };
        }
        const newActivation = await this.prismaService.activation.update({
          where: { activationUserId: userId },
          data: {
            twoFactorSecret: null,
            twoFactorActivated: false,
          },
        });

        return {
          ok: true,
          activation: newActivation,
          secret: null, // 비활성화 시 null
          qrCode: null, // 비활성화 시 null
          error: null,
        };
      }

      // 4. 유효하지 않은 입력 처리
      return { ok: false, error: '잘못된 요청입니다.' };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async logout(res: Response, id: number) {
    try {
      const user = await this.prismaService.user.update({
        where: { id },
        data: { accessToken: null, refreshToken: null },
      });
      res.clearCookie('Authentication');
      res.clearCookie('Refresh');
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
}
