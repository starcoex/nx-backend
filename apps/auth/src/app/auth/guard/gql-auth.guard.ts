import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): Request {
    const gqlContext = GqlExecutionContext.create(context);
    const contextObject = gqlContext.getContext();
    return contextObject.req;
  }
}
