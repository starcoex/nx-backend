import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { LoginInput, LoginOutput } from './dto/login.input';
import { UseGuards } from '@nestjs/common';
import { GqlCurrentUser } from './decorators/gql-current-user.decorator';
import { GqlContext } from '@nx-backend/graphql';
import { TwoFactorInput, TwoFactorOutput } from './dto/two-factor.input';
import {
  ToggleTwoFactorAuthInput,
  ToggleTwoFactorAuthOutput,
} from './dto/toggle-two-factor-auth.input';
import { GenerateTwoFactorOutput } from './dto/generate-two-factor.input';
import { UserLogoutOutput } from './dto/logout.input';
import { GqlAuthGuard } from './guard/gql-auth.guard';

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

  @UseGuards(GqlAuthGuard)
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
  @UseGuards(GqlAuthGuard)
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
  @UseGuards(GqlAuthGuard)
  async logout(
    @Context() context: GqlContext,
    @GqlCurrentUser() user: User
  ): Promise<UserLogoutOutput> {
    return this.authService.logout(context.res, user.id);
  }
}
