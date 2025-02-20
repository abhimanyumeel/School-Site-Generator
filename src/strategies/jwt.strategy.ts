import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  websitesLimit: number;
  websitesCreated: number;
  isActive: boolean;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    try {
      console.log('Validating JWT payload:', payload);

      // Verify the token's user exists in the database
      const user = await this.authService.getCurrentUser(payload.sub);
      
      if (!user) {
        console.error('User not found for token:', payload.sub);
        throw new UnauthorizedException('User not found');
      }

      // Verify that the token data matches the current user data
      if (user.email !== payload.email || 
          user.role !== payload.role || 
          !user.isActive) {
        console.error('Token data mismatch or user inactive:', {
          tokenEmail: payload.email,
          userEmail: user.email,
          tokenRole: payload.role,
          userRole: user.role,
          userActive: user.isActive
        });
        throw new UnauthorizedException('Invalid token data or user inactive');
      }

      console.log('JWT validation successful for user:', user.id);

      // Return the user object that will be attached to the request
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        websitesLimit: user.websitesLimit,
        websitesCreated: user.websitesCreated,
        isActive: user.isActive
      };
    } catch (error) {
      console.error('JWT validation error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
} 