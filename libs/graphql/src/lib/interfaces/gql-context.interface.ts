import { Request } from 'express';

export interface GqlContext {
  req: Request;
  res: any;
}
