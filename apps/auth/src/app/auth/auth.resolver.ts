import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { LoginInput, LoginOutput } from './dto/login.input';
import { RefreshTokensOutput } from './dto/tokens-input';
import { UseGuards } from '@nestjs/common';
import { GqlRefreshAuthGuard } from './guard/gql-refresh-auth.guard';
import { GqlCurrentUser } from './decorators/gql-current-user.decorator';
import { GqlContext } from '@starcoex-backend/graphql';
import { TwoFactorInput, TwoFactorOutput } from './dto/two-factor.input';
import {
  ToggleTwoFactorAuthInput,
  ToggleTwoFactorAuthOutput,
} from './dto/toggle-two-factor-auth.input';
import { GenerateTwoFactorOutput } from './dto/generate-two-factor.input';
import { UserLogoutOutput } from './dto/logout.input';

@Resolver(() => User)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => LoginOutput)
  login(
    @Args('loginInput') loginInput: LoginInput,
    @Context() context: GqlContext
  ) {
    return this.authService.login(loginInput, context.res);
  }

  @Mutation(() => RefreshTokensOutput)
  @UseGuards(GqlRefreshAuthGuard)
  async refreshToken(
    @GqlCurrentUser() user: User,
    @Context() context: GqlContext
  ): Promise<RefreshTokensOutput> {
    return this.authService.refreshToken(user.id, user.rememberMe, context.res);
  }

  @UseGuards(GqlRefreshAuthGuard)
  @Mutation(() => TwoFactorOutput)
  verityTwoFactor(
    @Args('twoFactorInput') twoFactorInput: TwoFactorInput,
    @Context() context: GqlContext
  ): Promise<TwoFactorOutput> {
    return this.authService.verifyTwoFactor(twoFactorInput, context.res);
  }

  // 2FA 활성화 요청
  @Mutation(() => GenerateTwoFactorOutput)
  async generateTwoFactorSecret(
    @Args('userId') userId: number
  ): Promise<GenerateTwoFactorOutput> {
    return this.authService.generateTwoFactorSecret(userId);
  }

  @Mutation(() => ToggleTwoFactorAuthOutput)
  @UseGuards(GqlRefreshAuthGuard)
  async toggleTwoFactorAuthentication(
    @GqlCurrentUser() user: User,
    @Args('toggleTwoFactorAuthInput')
    toggleTwoFactorAuthInput: ToggleTwoFactorAuthInput
  ): Promise<ToggleTwoFactorAuthOutput> {
    return this.authService.toggleTwoFactorAuthentication(
      user.id,
      toggleTwoFactorAuthInput
    );
  }

  @Query(() => UserLogoutOutput)
  @UseGuards(GqlRefreshAuthGuard)
  async logout(
    @Context() context: GqlContext,
    @GqlCurrentUser() user: User
  ): Promise<UserLogoutOutput> {
    return this.authService.logout(context.res, user.id);
  }
}
