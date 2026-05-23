import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { SetPasswordStoreAdminDto } from './dto/set-password-store-admin.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifySignupDto } from './dto/verify-signup.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('request-otp')
  @ApiOperation({
    summary: 'Request OTP code',
    description:
      "Send a one-time password (OTP) to the user's phone number via SMS. User must exist in the system.",
  })
  @ApiBody({ type: RequestOtpDto })
  @ApiResponse({
    status: 201,
    description: 'OTP sent successfully',
    schema: {
      example: {
        success: true,
        message: 'OTP sent successfully',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found. Please contact admin for access.',
  })
  @ApiResponse({ status: 401, description: 'User account is inactive' })
  @ApiResponse({ status: 400, description: 'Failed to send OTP' })
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(requestOtpDto.phone);
  }

  @Post('signup')
  @ApiOperation({
    summary: 'Start merchant signup',
    description:
      'Register with email, owner name, store name, and password. Sends a 6-digit verification code to the email via Resend.',
  })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: 'Verification code sent',
    schema: {
      example: {
        success: true,
        message: 'Verification code sent to your email',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email or phone already registered' })
  @ApiResponse({ status: 400, description: 'Failed to send verification email' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.initiateSignup(signupDto);
  }

  @Post('signup/verify')
  @ApiOperation({
    summary: 'Complete merchant signup',
    description:
      'Verify the 6-digit email code. Creates the store and store_admin user, then returns an access token.',
  })
  @ApiBody({ type: VerifySignupDto })
  @ApiResponse({
    status: 201,
    description: 'Signup completed',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid-here',
          email: 'owner@example.com',
          name: 'Jane Doe',
          role: 'store_admin',
          storeId: 'uuid-here',
          isActive: true,
        },
        store: {
          id: 'uuid-here',
          name: "Jane's Shop",
          ownerId: 'uuid-here',
          status: 'active',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired verification code' })
  @ApiResponse({ status: 409, description: 'Email or phone already registered' })
  async verifySignup(@Body() verifySignupDto: VerifySignupDto) {
    return this.authService.completeSignup(verifySignupDto);
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify OTP code',
    description:
      "Verify the OTP code sent to the user's phone. Returns a temporary token and user information.",
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
          phone: '0812345678',
          email: 'admin@kasipos.demo',
          name: 'John Doe',
          role: 'staff',
          storeId: 'uuid-here',
        },
      },
    },
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
    description:
      'Set password for a new user. Requires a temporary token obtained from OTP verification.',
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
          storeId: 'uuid-here',
          isActive: true,
          createdAt: '2026-01-20T08:00:00.000Z',
          updatedAt: '2026-01-20T08:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing temporary token',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async setPassword(@Request() req, @Body() setPasswordDto: SetPasswordDto) {
    return this.authService.setPassword(req.user.id, setPasswordDto.password);
  }

  @Post('set-password-store-admin')
  @ApiOperation({
    summary: 'Set password for store admin',
    description:
      'Store admin provides phone, temporary password (from SMS), and new password. Returns access token.',
  })
  @ApiBody({ type: SetPasswordStoreAdminDto })
  @ApiResponse({
    status: 201,
    description: 'Password set successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid-here',
          email: 'storeadmin-1@kasipos.local',
          name: 'John Doe',
          role: 'store_admin',
          storeId: 'uuid-here',
          isActive: true,
          createdAt: '2026-01-20T08:00:00.000Z',
          updatedAt: '2026-01-20T08:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid temporary password or not a store admin',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async setPasswordStoreAdmin(@Body() dto: SetPasswordStoreAdminDto) {
    if (dto.token) {
      return this.authService.setPasswordStoreAdmin(
        '',
        '',
        dto.newPassword,
        dto.token,
      );
    }
    if (!dto.phone || !dto.temporaryPassword) {
      throw new BadRequestException(
        'Provide either token (from reset link) or phone + temporaryPassword',
      );
    }
    return this.authService.setPasswordStoreAdmin(
      dto.phone,
      dto.temporaryPassword,
      dto.newPassword,
    );
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with email or phone and password',
    description:
      'Authenticate with email and/or phone plus password. No verification code required. Returns JWT access token immediately.',
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
          email: 'owner@example.com',
          phone: '0812345678',
          name: 'John Doe',
          role: 'store_admin',
          storeId: 'uuid-here',
          isActive: true,
          createdAt: '2026-01-20T08:00:00.000Z',
          updatedAt: '2026-01-20T08:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or user account is inactive',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('admin/login')
  @ApiOperation({
    summary: 'Admin login with email and password',
    description:
      'Authenticate admin user with email and password. Returns JWT access token. Only admin users can use this endpoint.',
  })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({
    status: 201,
    description: 'Admin login successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid-here',
          email: 'admin@kasipos.demo',
          name: 'System Administrator',
          role: 'admin',
          storeId: 'uuid-here',
          isActive: true,
          createdAt: '2026-01-20T08:00:00.000Z',
          updatedAt: '2026-01-20T08:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      'Invalid credentials, user account is inactive, or access denied (non-admin user)',
  })
  async adminLogin(@Body() adminLoginDto: AdminLoginDto) {
    return this.authService.adminLogin(
      adminLoginDto.email,
      adminLoginDto.password,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      "Retrieve the authenticated user's profile information. Requires valid JWT token.",
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
        storeId: 'uuid-here',
        isActive: true,
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getProfile(@Request() req) {
    return req.user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      "Update the authenticated user's profile information (e.g. name).",
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
        storeId: 'uuid-here',
        isActive: true,
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:05:00.000Z',
      },
    },
  })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout user',
    description: 'Invalidate user session (server-side if applicable).',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }
}
