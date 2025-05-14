import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateUserInput } from './dto/update-user.input';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma-clients/auth';
import { CreateUserInput, CreateUserOutput } from './dto/create-user.input';
import { compare, hashSync } from 'bcryptjs';
import { AsYouType, isValidPhoneNumber } from 'libphonenumber-js';
import { User } from './entities/user.entity';
import {
  NOTIFICATIONS_SERVICE_NAME,
  NotificationsServiceClient,
  Packages,
} from '@nx-backend/grpc';
import { ClientGrpc } from '@nestjs/microservices';
import { join } from 'path';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  VerifyChangeEmailInput,
  VerifyChangeEmilOutput,
  VerifyEmailInput,
  VerifyEmailOutput,
} from './dto/verity-email.input';
import {
  ForgotPasswordEmailInput,
  ForgotPasswordResponse,
} from './dto/forgot-password.input';
import {
  ResetPasswordInput,
  ResetPasswordOutput,
} from './dto/reset-password.input';
import { ChangeEmailInput, ChangeEmailOutput } from './dto/change-email.input';
import {
  ResendVerificationCodeInput,
  ResendVerificationCodeOutput,
} from './dto/resend-verification-code.input';
import {
  PasswordChangeInput,
  PasswordChangeOutput,
} from './dto/password-change.input';

@Injectable()
export class UsersService {
  private notificationsService: NotificationsServiceClient;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService // @Inject(Packages.NOTIFICATIONS) private readonly client: ClientGrpc
  ) {}

  // onModuleInit() {
  //   this.notificationsService =
  //     this.client.getService<NotificationsServiceClient>(
  //       NOTIFICATIONS_SERVICE_NAME
  //     );
  // }

  private validatePassword(
    password: string,
    passwordConfirmation?: string
  ): void {
    if (passwordConfirmation && password !== passwordConfirmation) {
      throw new BadRequestException('비밀번호 확인이 일치하지 않습니다.');
    }
  }
  private async hashPassword(password: string): Promise<string> {
    return hashSync(password, 12);
  }

  private async ensureUserDoesNotExist(
    identifier: string,
    errorMessage: string
  ): Promise<void> {
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: identifier },
    });
    if (existingUser) {
      throw new ConflictException(errorMessage);
    }
  }

  private async ensureUserDoesNotExistByPhoneNumber(
    phoneNumber: string,
    errorMessage: string
  ): Promise<void> {
    const existingUser = await this.prismaService.user.findUnique({
      where: { phoneNumber },
    });
    if (existingUser) {
      throw new BadRequestException(errorMessage);
    }
  }

  private validatePhoneNumber(
    phoneNumber: string,
    PHONE_REGEX: RegExp
  ): string {
    if (!isValidPhoneNumber(phoneNumber)) {
      throw new BadRequestException('전화번호 양식이 틀립니다.');
    }

    const formatter = new AsYouType();
    formatter.input(phoneNumber);
    const numberInfo = formatter.getNumber();

    if (!PHONE_REGEX.test(numberInfo.nationalNumber)) {
      throw new BadRequestException(
        '전화번호 형식이 올바르지 않습니다. (010-XXXX-XXXX)'
      );
    }

    return numberInfo.number;
  }

  async create(createUserInput: CreateUserInput): Promise<CreateUserOutput> {
    try {
      const {
        email,
        password,
        passwordConfirmation,
        phoneNumber,
        name,
        roles,
      } = createUserInput;
      // 이메일 중복 확인
      await this.ensureUserDoesNotExist(email, '메일이 이미 존재합니다.');

      // 전화번호 검증 및 포매팅
      const formattedPhoneNumber = this.validatePhoneNumber(
        phoneNumber,
        /^10-?(\d{4}-?\d{4})$/
      );
      // 전화번호 중복 확인
      await this.ensureUserDoesNotExistByPhoneNumber(
        formattedPhoneNumber,
        '번호가 존재합니다.'
      );

      // 비밀번호 해싱
      const passwordHash = await this.hashPassword(password);

      // 비밀번호 검증
      this.validatePassword(password, passwordConfirmation);

      const user = await this.prismaService.user.create({
        data: {
          email,
          phoneNumber: formattedPhoneNumber,
          password: passwordHash,
          name,
          roles,
        },
      });
      const { activationToken, activationCode } =
        await this.createActivationToken(user.id);
      await this.prismaService.activation.create({
        data: {
          activationCode,
          activationToken,
          activationUserId: user.id,
        },
      });
      // await this.notifyEmailVerification(
      //   user,
      //   activationCode,
      //   'TEXT2',
      //   join(__dirname, '../../', '/email-templates/activation-mail.ejs')
      // ).catch((e) =>
      //   console.error(
      //     `이메일 전송에 실패했습니다. 유저 ID: ${user.id}, 오류:`,
      //     e
      //   )
      // );

      return { ok: true, user, activationCode, activationToken };
    } catch (e) {
      return {
        ok: false,
        error:
          e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }

  // 사용자 비밀번호 검증 로직
  async validateUserPassword(user: User, password: string) {
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 유효하지 않습니다.');
    }
  }

  // rememberMe 상태 업데이트
  async updateUserRememberMe(userId: number, rememberMe: boolean) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { rememberMe: !!rememberMe },
    });
  }

  // 활성화 코드 생성 로직
  async createActivationToken(userId: number) {
    const activationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const activationToken = this.jwtService.sign(
      { id: userId, activationCode },
      {
        secret: this.configService.getOrThrow(
          'AUTH_JWT_ACTIVATION_TOKEN_SECRET'
        ),
        expiresIn: `${this.configService.getOrThrow(
          'AUTH_JWT_ACTIVATION_EXPIRATION'
        )}m`,
      }
    );
    return { activationToken, activationCode };
  }

  // 비동기 이메일 전송 처리 로직
  async notifyEmailVerification(
    user: User,
    activationCode: string,
    text: string,
    templatePath: string
  ) {
    try {
      this.notificationsService
        .notifyEmail({
          email: user.email,
          name: user.name,
          subject: '당신에 게정을 활성화 시키세요',
          templatePath,
          activationCode,
          text,
          data: { title: 'title1', content: 'content1' },
        })
        .subscribe(() => console.log('활성화 메일이 전송 되었습니다.  '));
    } catch (e) {
      console.error('이메일 인증 알림 전송 실패:', e);
      throw new Error('이메일 알림 전송 실패');
    }
  }

  // Decode activation token and handle expiration
  async decodeActivationToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.getOrThrow(
          'AUTH_JWT_ACTIVATION_TOKEN_SECRET'
        ),
      });
    } catch (error) {
      console.log(error);
      if (error.name === 'TokenExpiredError') {
        return null;
      }
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  async verifyEmail(
    verifyEmailInput: VerifyEmailInput
  ): Promise<VerifyEmailOutput> {
    try {
      const { activationToken, activationCode } = verifyEmailInput;
      const decodedToken = await this.decodeActivationToken(activationToken);
      if (!decodedToken) {
        return {
          ok: false,
          error: '토큰이 만료되어서 재발급을 받으세요',
        };
      }

      if (decodedToken.activationCode !== activationCode) {
        return { ok: false, error: '유효하지 않은 활성화 코드입니다.' };
      }
      const user = await this.getUser({ id: decodedToken.id });
      const verifyUser = await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          isActive: true,
          activation: { update: { activationCode: '', activationToken: '' } },
        },
      });
      return { ok: true, user: verifyUser };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        // 토큰 만료 오류에 대한 처리
        console.error('Token Expired:', error.expiredAt); // 만료된 시간 출력
        return {
          ok: false,
          error: '토큰이 만료되었습니다. 다시 요청해주세요.',
        };
      } else {
        // 기타 예외 처리
        console.error('Token verification error:', error.message);
        return { ok: false, error: '유효하지 않은 토큰입니다.' };
      }
    }
  }

  async verifyChangeEmail(
    verifyChangeEmailInput: VerifyChangeEmailInput,
    userId: number
  ): Promise<VerifyChangeEmilOutput> {
    try {
      const { activationToken, activationCode } = verifyChangeEmailInput;
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        include: { activation: true },
      });
      await this.ensureUserDoesNotExist(
        user.email,
        '사용자를 찾을 수 없습니다.'
      );
      const decodedToken = await this.decodeActivationToken(activationToken);
      if (decodedToken.activationCode !== activationCode) {
        return { ok: false, error: '유효하지 않은 활성화 코드입니다.' };
      }
      if (!decodedToken) {
        return {
          ok: false,
          error: '토큰이 만료되어서 재발급을 받으세요',
        };
      }
      const newEmail = user.activation.requestedEmail;
      if (!newEmail) {
        return { ok: false, error: '변경할 이메일이 요청되지 않았습니다.' };
      }

      const verifyUser = await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          isActive: true,
          activation: {
            update: {
              activationCode: '',
              activationToken: '',
              requestedEmail: null,
            },
          },
        },
      });

      return { ok: true, user: verifyUser };
    } catch (error) {
      console.error('Error verifying email change:', error.message);
      return { ok: false, error: '이메일 변경 중 오류가 발생했습니다.' };
    }
  }

  async resendVerificationCode(
    resendVerificationCodeInput: ResendVerificationCodeInput
  ): Promise<ResendVerificationCodeOutput> {
    try {
      const { email } = resendVerificationCodeInput;
      const user = await this.prismaService.user.findUnique({
        where: { email },
      });
      // 이미 사용자가 활성화된 경우
      if (user.isActive) {
        return {
          ok: false,
          error: '계정이 이미 활성화되어 있습니다.',
        };
      }
      // 새로운 activationToken 및 activationCode 생성
      const { activationToken: newActivationToken, activationCode } =
        await this.createActivationToken(user.id);

      // 데이터베이스에 업데이트
      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          activation: {
            update: {
              activationToken: newActivationToken,
              activationCode,
            },
          },
        },
      });

      // 이메일 전송 (GRPC NotificationsService 활용)
      await this.notifyEmailVerification(
        user,
        activationCode,
        '이메일 인증 코드 재전송',
        join(__dirname, '../../', '/email-templates/activation-mail.ejs')
      ).catch((e) =>
        console.error(
          `이메일 전송에 실패했습니다. 유저 ID: ${user.id}, 오류:`,
          e
        )
      );

      return {
        ok: true,
        user,
        activationCode,
        activationToken: newActivationToken,
      };
    } catch (error) {
      console.error('Verification code resend error: ', error.message);
      return {
        ok: false,
        error: '이메일 인증 코드 재전송에 실패하였습니다.',
      };
    }
  }

  async sendChangeEmailVerificationCode(
    changeEmailInput: ChangeEmailInput,
    userId: number
  ): Promise<ChangeEmailOutput> {
    try {
      const { email: newEmail } = changeEmailInput;
      const user = await this.getUser({ id: userId });
      await this.ensureUserDoesNotExist(
        newEmail,
        '해당 이메일은 이미 사용 중입니다.'
      );
      const { activationToken, activationCode } =
        await this.createActivationToken(userId);
      await this.prismaService.activation.upsert({
        where: { activationUserId: userId },
        create: {
          activationCode,
          activationToken,
          activationUserId: userId,
          requestedEmail: newEmail,
        },
        update: {
          activationCode,
          activationToken,
          requestedEmail: newEmail,
        },
      });
      // 이메일 전송 (GRPC NotificationsService 활용)
      await this.notifyEmailVerification(
        user,
        activationCode,
        '이메일 변경 인증 코드',
        join(__dirname, '../../', '/email-templates/activation-mail.ejs')
      ).catch((e) =>
        console.error(
          `이메일 전송에 실패했습니다. 유저 ID: ${user.id}, 오류:`,
          e
        )
      );
      return { ok: true };
    } catch (error) {
      console.error('Error verifying email change:', error);
      return { ok: false, error: '이메일 변경 중 오류가 발생했습니다.' };
    }
  }

  async generateForgotPasswordLink(user: User) {
    return this.jwtService.sign(
      { id: user.id },
      {
        secret: this.configService.getOrThrow(
          'AUTH_JWT_FORGOT_PASSWORD_TOKEN_SECRET'
        ),
        expiresIn: `${this.configService.getOrThrow(
          'AUTH_JWT_FORGOT_PASSWORD_EXPIRATION'
        )}m`,
      }
    );
  }

  async validateUserExists(email: string, errorMessage: string) {
    const user = await this.getUser({ email });
    if (!user) {
      throw new BadRequestException(errorMessage);
    }
    return user;
  }

  private validateTokenExpiration(decodedToken: any): void {
    const currentTime = Date.now();
    if (!decodedToken || decodedToken.exp * 1000 < currentTime) {
      throw new BadRequestException('토큰이 만료되었습니다.');
    }
  }

  async forgotPassword(
    forgotPasswordEmailInput: ForgotPasswordEmailInput
  ): Promise<ForgotPasswordResponse> {
    try {
      const { email } = forgotPasswordEmailInput;
      const user = await this.validateUserExists(
        email,
        '이 이메일로 사용자를 찾을 수 없습니다.'
      );
      const forgotPasswordToken = await this.generateForgotPasswordLink(user);
      const resetPasswordUrl =
        this.configService.getOrThrow('CLIENT_URL') +
        `/auth/reset-password?verify=${forgotPasswordToken}`;

      // 이메일 전송 (GRPC NotificationsService 활용)
      await this.notifyEmailVerification(
        user,
        resetPasswordUrl,
        '패스워드 초기화',
        join(__dirname, '../../', '/email-templates/forgot-password.ejs')
      ).catch((error) =>
        console.error(
          `이메일 전송에 실패했습니다. 유저 ID: ${user.id}, 오류:`,
          error
        )
      );
      return {
        ok: true,
        statusMessage: '비밀번호를 잊어버리셨습니까? 요청이 성공했습니다!',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        return { ok: false, error: error.message };
      }
      console.error('Password forgot message:', error);
      return { ok: false, error: '비밀번호 초기화중  오류가 발생했습니다.' };
    }
  }

  async resetPassword(
    resetPasswordInput: ResetPasswordInput
  ): Promise<ResetPasswordOutput> {
    try {
      const { password, passwordConfirmation, activationToken } =
        resetPasswordInput;
      const decoded = this.jwtService.decode(activationToken);
      this.validateTokenExpiration(decoded);
      // 비밀번호 해싱
      const passwordHash = await this.hashPassword(password);

      // 비밀번호 검증
      this.validatePassword(password, passwordConfirmation);

      const user = await this.prismaService.user.update({
        where: { id: decoded.id },
        data: {
          password: passwordHash,
          activation: { update: { activationCode: '', activationToken: '' } },
        },
      });

      return { ok: true, user };
    } catch (error) {
      if (error instanceof BadRequestException) {
        return { ok: false, error: error.message };
      }
      console.error('Password forgot message:', error);
      return { ok: false, error: '패스워드 초기화중  오류가 발생했습니다.' };
    }
  }

  private async validateCurrentPassword(
    inputPassword: string,
    storedPassword: string,
    errorMessage: string
  ): Promise<void> {
    const isPasswordValid = await compare(inputPassword, storedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException(errorMessage);
    }
  }

  async passwordChange(
    passwordChangeInput: PasswordChangeInput,
    userId: number
  ): Promise<PasswordChangeOutput> {
    const { currentPassword, newPassword, newPasswordConfirmation } =
      passwordChangeInput;
    try {
      const user = await this.getUser({ id: userId });

      await this.validateCurrentPassword(
        currentPassword,
        user.password,
        '현재 비밀번호가 잘못되었습니다.'
      );

      // 비밀번호 검증
      this.validatePassword(newPassword, newPasswordConfirmation);

      // 비밀번호 해싱
      const passwordHash = await this.hashPassword(newPassword);
      const newUser = await this.prismaService.user.update({
        where: { id: user.id },
        data: { password: passwordHash },
      });

      return { ok: true, user: newUser };
    } catch (error) {
      console.error('Password change message:', error);
      if (error instanceof UnauthorizedException) {
        return { ok: false, error: error.message };
      }
      return { ok: false, error: '패스워드 변경중  오류가 발생했습니다.' };
    }
  }

  async getUser(args: Prisma.UserWhereUniqueInput) {
    return this.prismaService.user.findUniqueOrThrow({ where: args });
  }

  async getLoggedInUser(userId: number) {
    return await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { activation: true, avatar: true },
    });
    // const verification = await this.prismaService.activation.findUnique({
    //   where: { activationUserId: user.id },
    // });
    // return { ok: true, user, verification };
  }

  async getUsers() {
    return this.prismaService.user.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async updateProfile(
    updateUserInput: UpdateUserInput,
    userId: number
  ): Promise<User> {
    const { name, email, phoneNumber } = updateUserInput;
    // 이메일 중복 확인
    await this.ensureUserDoesNotExist(email, '메일이 이미 존재합니다.');

    // 전화번호 검증 및 포매팅
    const formattedPhoneNumber = this.validatePhoneNumber(
      phoneNumber,
      /^10-?(\d{4}-?\d{4})$/
    );
    // 전화번호 중복 확인
    await this.ensureUserDoesNotExistByPhoneNumber(
      formattedPhoneNumber,
      '번호가 존재합니다.'
    );

    return await this.prismaService.user.update({
      where: { id: userId },
      data: {
        name: name,
        email: email,
        phoneNumber: formattedPhoneNumber,
      },
    });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
