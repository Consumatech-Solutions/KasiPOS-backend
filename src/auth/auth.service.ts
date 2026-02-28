import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { OtpService } from '../services/otp.service';
import { User } from '../users/entities/user.entity';
import { StoreAdminResetToken } from './entities/store-admin-reset-token.entity';

@Injectable()
export class AuthService {
  private static readonly RESET_TOKEN_EXPIRY_DAYS = 7;
  private static readonly SHORT_TOKEN_BYTES = 8; // 16 hex chars

  constructor(
    private usersService: UsersService,
    private otpService: OtpService,
    private jwtService: JwtService,
    @InjectRepository(StoreAdminResetToken)
    private storeAdminResetTokenRepository: Repository<StoreAdminResetToken>,
  ) {}

  async requestOtp(phone: string): Promise<{ success: boolean; message: string }> {
    // Check if user exists
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new NotFoundException('User not found. Please contact admin for access.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Send OTP via external service
    const result = await this.otpService.sendOtp(phone);

    if (!result.success) {
      throw new BadRequestException('Failed to send OTP');
    }

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  }

  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{ tempToken: string; hasPassword: boolean; user: Partial<User> }> {
    // Verify OTP with external service
    const isValid = await this.otpService.verifyOtp(phone, code);

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    // Get user
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate temporary token (short-lived, 10 minutes)
    const tempToken = this.jwtService.sign(
      { sub: user.id, phone: user.phone, email: user.email, temp: true },
      { expiresIn: '10m' },
    );

    const hasPassword = !!user.passwordHash;

    return {
      tempToken,
      hasPassword,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        storeId: user.storeId,
      },
    };
  }

  async setPasswordStoreAdmin(
    phone: string,
    temporaryPassword: string,
    newPassword: string,
    resetToken?: string,
  ): Promise<{ accessToken: string; user: User }> {
    if (resetToken) {
      return this.setPasswordWithResetToken(resetToken, newPassword);
    }
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== 'store_admin') {
      throw new UnauthorizedException('This endpoint is for store admins only');
    }
    const valid = await user.validatePassword(temporaryPassword);
    if (!valid) {
      throw new UnauthorizedException('Invalid temporary password');
    }
    await this.usersService.update(user.id, { password: newPassword } as any);
    const updatedUser = await this.usersService.findById(user.id);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    const accessToken = this.generateAccessToken(updatedUser);
    return { accessToken, user: updatedUser };
  }

  /** Set password using short reset token from SMS link. Invalidates token after use. */
  async setPasswordWithResetToken(
    token: string,
    newPassword: string,
  ): Promise<{ accessToken: string; user: User }> {
    const record = await this.storeAdminResetTokenRepository.findOne({
      where: { token: token.trim() },
      relations: ['user'],
    });
    if (!record) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }
    if (new Date() > record.expiresAt) {
      await this.storeAdminResetTokenRepository.remove(record);
      throw new UnauthorizedException('Reset link has expired');
    }
    const user = record.user;
    if (user.role !== 'store_admin') {
      throw new UnauthorizedException('This endpoint is for store admins only');
    }
    await this.usersService.update(user.id, { password: newPassword } as any);
    await this.storeAdminResetTokenRepository.remove(record);
    const updatedUser = await this.usersService.findById(user.id);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    const accessToken = this.generateAccessToken(updatedUser);
    return { accessToken, user: updatedUser };
  }

  async setPassword(
    userId: string,
    password: string,
  ): Promise<{ accessToken: string; user: User }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update password (hashing will be handled by User entity hook)
    // We casts to any to bypass DTO restriction for internal operation
    await this.usersService.update(userId, {
      isActive: true, // Ensure user is active
      passwordHash: password
    } as any);

    // Fetch updated user
    const updatedUser = await this.usersService.findById(userId);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    // Generate access token
    const accessToken = this.generateAccessToken(updatedUser);

    return {
      accessToken,
      user: updatedUser,
    };
  }

  async loginByPhone(phone: string, password: string): Promise<{ accessToken: string; user: User }> {
    const user = await this.usersService.findByPhone(phone);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Please set your password first');
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      user,
    };
  }

  async adminLogin(email: string, password: string): Promise<{ accessToken: string; user: User }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify user is an admin
    if (user.role !== 'admin') {
      throw new UnauthorizedException('Access denied. Admin access required.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Please set your password first');
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      user,
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }

  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      storeId: user.storeId,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Create a short-lived reset token for store admin (stored in DB).
   * Use this for SMS links so the URL stays short.
   */
  async createStoreAdminResetToken(userId: string): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + AuthService.RESET_TOKEN_EXPIRY_DAYS);
    const token = randomBytes(AuthService.SHORT_TOKEN_BYTES).toString('hex');
    await this.storeAdminResetTokenRepository.save({
      userId,
      token,
      expiresAt,
    });
    return token;
  }

  async updateProfile(userId: string, data: { name?: string }): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if there's anything to update
    if (Object.keys(data).length > 0) {
      await this.usersService.update(userId, { name: data.name });
    }

    return this.usersService.findById(userId);
  }

  async logout(userId: string): Promise<{ message: string }> {
    // Ideally we would blacklist the token here if we had a blacklist mechanism
    // For now we just return success
    return { message: 'Logged out successfully' };
  }
}
