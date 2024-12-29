import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    console.log('JWT Strategy - Received payload:', payload);
    
    try {
      const user = await this.authService.getCurrentUser(payload.sub);
      console.log('JWT Strategy - Validated user:', user);
      
      if (!user) {
        console.log('JWT Strategy - No user found');
        throw new UnauthorizedException();
      }
      return user;
    } catch (error) {
      console.error('JWT Strategy - Validation error:', error);
      throw new UnauthorizedException();
    }
  }
} 