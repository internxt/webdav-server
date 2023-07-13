import { HTTPRequestContext } from '../../server';
import { IUser } from '../IUser';

export interface HTTPAuthentication {
  askForAuthentication(ctx: HTTPRequestContext): {
    [headeName: string]: string;
  };
  getUser(
    ctx: HTTPRequestContext,
    callback: (error: Error, user?: IUser) => void
  ): void;
}
