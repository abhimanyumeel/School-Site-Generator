import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDto } from '../dto/auth/register.dto';
import { LoginDto } from '../dto/auth/login.dto';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string }> {
    console.log('Registration attempt with:', registerDto);

    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.hashPassword(registerDto.password);

    const user = this.userRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      role: UserRole.SINGLE_SCHOOL,
      websitesLimit: 1,
      websitesCreated: 0,
      isActive: true
    });

    const savedUser = await this.userRepository.save(user);
    console.log('Saved user:', savedUser);

    const token = this.generateToken(savedUser);
    console.log('Generated token payload:', this.jwtService.decode(token));

    return { access_token: token };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string, user: any }> {
    console.log('Login attempt with email:', loginDto.email);

    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    console.log('Found user during login:', user);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePasswords(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('User found during login:', user);

    await this.userRepository.update(user.id, {
      lastLoginAt: new Date()
    });

    const token = this.generateToken(user);
    console.log('Login token payload:', this.jwtService.decode(token));

    // Return both token and user data
    return { 
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        websitesLimit: user.websitesLimit,
        websitesCreated: user.websitesCreated,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt
      }
    };
  }

  async getCurrentUser(id: string): Promise<Omit<User, 'password'>> {
    console.log('Getting user with ID:', id);
    
    const user = await this.userRepository.findOne({ 
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        websitesLimit: true,
        websitesCreated: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('Found user in getCurrentUser:', user);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      websitesLimit: user.websitesLimit,
      websitesCreated: user.websitesCreated,
      isActive: user.isActive
    };
    console.log('Generating token with payload:', payload);
    return this.jwtService.sign(payload);
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  private async comparePasswords(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'role', 'websitesLimit', 'websitesCreated', 'isActive'] 
    });

    if (user && (await this.comparePasswords(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
} 