import { Controller, Post, Body, Get, Patch, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('request-otp')
  @ApiOperation({
    summary: 'Request OTP code',
    description: 'Send a one-time password (OTP) to the user\'s phone number via SMS. User must exist in the system.'
  })
  @ApiBody({ type: RequestOtpDto })
  @ApiResponse({
    status: 201,
    description: 'OTP sent successfully',
    schema: {
      example: {
        success: true,
        message: 'OTP sent successfully'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found. Please contact admin for access.' })
  @ApiResponse({ status: 401, description: 'User account is inactive' })
  @ApiResponse({ status: 400, description: 'Failed to send OTP' })
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(requestOtpDto.phone);
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify OTP code',
    description: 'Verify the OTP code sent to the user\'s phone. Returns a temporary token and user information.'
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 201,
    description: 'OTP verified successfully',
    schema: {
      example: {
        tempToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        hasPassword: false,
        user: {
          id: 'uuid-here',
          email: 'admin@kasipos.demo',
          name: 'John Doe',
          role: 'staff',
          storeId: 1
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP code' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.code);
  }

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Set user password',
    description: 'Set password for a new user. Requires a temporary token obtained from OTP verification.'
  })
  @ApiBody({ type: SetPasswordDto })
  @ApiResponse({
    status: 201,
    description: 'Password set successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid-here',
          email: 'admin@kasipos.demo',
          name: 'John Doe',
          role: 'staff',
          storeId: 1,
          isActive: true,
          createdAt: '2026-01-20T08:00:00.000Z',
          updatedAt: '2026-01-20T08:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing temporary token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async setPassword(@Request() req, @Body() setPasswordDto: SetPasswordDto) {
    return this.authService.setPassword(req.user.id, setPasswordDto.password);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Authenticate user with email and password. Returns JWT access token.'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid-here',
          email: 'admin@kasipos.demo',
          name: 'John Doe',
          role: 'staff',
          storeId: 1,
          isActive: true,
          createdAt: '2026-01-20T08:00:00.000Z',
          updatedAt: '2026-01-20T08:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials or user account is inactive' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the authenticated user\'s profile information. Requires valid JWT token.'
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: 'uuid-here',
        email: 'admin@kasipos.demo',
        name: 'John Doe',
        role: 'staff',
        storeId: 1,
        isActive: true,
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getProfile(@Request() req) {
    return req.user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update the authenticated user\'s profile information (e.g. name).'
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      example: {
        id: 'uuid-here',
        email: 'admin@kasipos.demo',
        name: 'John Doe Updated',
        role: 'staff',
        storeId: 1,
        isActive: true,
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:05:00.000Z'
      }
    }
  })
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout user',
    description: 'Invalidate user session (server-side if applicable).'
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      example: {
        message: 'Logged out successfully'
      }
    }
  })
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }
}
