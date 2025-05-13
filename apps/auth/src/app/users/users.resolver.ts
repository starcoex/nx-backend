import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { CreateUserInput, CreateUserOutput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guard/gql-auth.guard';
import { GqlCurrentUser } from '../auth/decorators/gql-current-user.decorator';
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
  VerifyChangeEmailInput,
  VerifyChangeEmilOutput,
  VerifyEmailInput,
  VerifyEmailOutput,
} from './dto/verity-email.input';
import {
  ResendVerificationCodeInput,
  ResendVerificationCodeOutput,
} from './dto/resend-verification-code.input';
import {
  PasswordChangeInput,
  PasswordChangeOutput,
} from './dto/password-change.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => CreateUserOutput)
  createUser(
    @Args('createUserInput') createUserInput: CreateUserInput
  ): Promise<CreateUserOutput> {
    return this.usersService.create(createUserInput);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => User)
  getLoggedInUser(@GqlCurrentUser() user: User) {
    return this.usersService.getLoggedInUser(user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [User])
  getUsers() {
    return this.usersService.getUsers();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOne(id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => User)
  updateProfile(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @GqlCurrentUser() user: User
  ): Promise<User> {
    return this.usersService.updateProfile(updateUserInput, user.id);
  }

  @Mutation(() => ForgotPasswordResponse)
  forgetPassword(
    @Args('forgotPasswordInput')
    forgotPasswordEmailInput: ForgotPasswordEmailInput
  ): Promise<ForgotPasswordResponse> {
    return this.usersService.forgotPassword(forgotPasswordEmailInput);
  }

  @Mutation(() => ResetPasswordOutput)
  resetPassword(
    @Args('resetPasswordInput') resetPasswordInput: ResetPasswordInput
  ): Promise<ResetPasswordOutput> {
    return this.usersService.resetPassword(resetPasswordInput);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => ChangeEmailOutput)
  sendChangeEmailVerificationCode(
    @Args('changeEmailInput') changeEmailInput: ChangeEmailInput,
    @GqlCurrentUser() user: User
  ): Promise<ChangeEmailOutput> {
    return this.usersService.sendChangeEmailVerificationCode(
      changeEmailInput,
      user.id
    );
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => VerifyChangeEmilOutput)
  verifyChangeEmail(
    @Args('verifyChangeEmailInput')
    verifyChangeEmailInput: VerifyChangeEmailInput,
    @GqlCurrentUser() user: User
  ) {
    return this.usersService.verifyChangeEmail(verifyChangeEmailInput, user.id);
  }

  @Mutation(() => VerifyEmailOutput)
  verifyEmail(
    @Args('verifyEmailInput') verifyEmailInput: VerifyEmailInput
  ): Promise<VerifyEmailOutput> {
    return this.usersService.verifyEmail(verifyEmailInput);
  }

  @Mutation(() => ResendVerificationCodeOutput)
  resendVerificationCode(
    @Args('resendVerificationCodeInput')
    resendVerificationCodeInput: ResendVerificationCodeInput
  ): Promise<ResendVerificationCodeOutput> {
    return this.usersService.resendVerificationCode(
      resendVerificationCodeInput
    );
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.remove(id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PasswordChangeOutput)
  passwordChange(
    @Args('passwordChangeInput') passwordChangeInput: PasswordChangeInput,
    @GqlCurrentUser() user: User
  ): Promise<PasswordChangeOutput> {
    return this.usersService.passwordChange(passwordChangeInput, user.id);
  }
}
