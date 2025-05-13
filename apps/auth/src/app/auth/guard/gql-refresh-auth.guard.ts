import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  getRequest(context: ExecutionContext): Request {
    const gqlContext = GqlExecutionContext.create(context);
    const contextObject = gqlContext.getContext();
    return contextObject.req;
  }
}
