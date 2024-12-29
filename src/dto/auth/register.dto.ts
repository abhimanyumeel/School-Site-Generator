import { IsString, IsEmail, MinLength, IsEnum, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone is required' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Entity type is required' })
  entityType: string;

  @IsString()
  @IsNotEmpty({ message: 'Entity ID is required' })
  entityId: string;

  @IsEnum(['admin'], { message: 'Role must be admin' })
  @IsNotEmpty({ message: 'Role is required' })
  role: string;
} 