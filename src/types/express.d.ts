import { UserInstance } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user: UserInstance | undefined;
    }
  }
}

export {}; 