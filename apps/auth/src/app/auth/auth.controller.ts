import {
  AuthenticateRequest,
  AuthServiceController,
  AuthServiceControllerMethods,
  GrpcLoggingInterceptor,
  User,
} from '@nx-backend/grpc';
import { Controller, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { TokenPayload } from '@nx-backend/graphql';

@Controller()
@AuthServiceControllerMethods()
@UseInterceptors(GrpcLoggingInterceptor)
export class AuthController implements AuthServiceController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  authenticate(
    request: AuthenticateRequest & { user: TokenPayload }
  ): Promise<User> {
    const user: TokenPayload = request['user'];
    return this.usersService.getUser({ id: user.userId });
  }
}
