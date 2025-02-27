import { Controller, Post, Body, UseGuards, Get, HttpStatus, HttpCode, Request, ValidationPipe, UsePipes } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/auth/register.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';

@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true }))
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req) {
        return this.authService.getCurrentUser(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getCurrentUser(@Request() req) {
        return this.authService.getCurrentUser(req.user.sub);
    }
}
