import { Request } from 'express';
import { UserRole } from '../entities/user.entity';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
    websitesLimit: number;
    websitesCreated: number;
    isActive: boolean;
  };
}
