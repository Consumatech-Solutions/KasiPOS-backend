import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';

describe('AuthService.initiateSignup', () => {
  const baseDto: SignupDto = {
    email: 'owner@example.com',
    name: 'Jane Doe',
    storeName: "Jane's Shop",
    password: 'SecurePass123',
    countryCode: 'ZA',
    phoneNumber: '27812345678',
  };

  let authService: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    findByPhone: jest.Mock;
  };
  let signupVerificationService: {
    normalizeEmail: jest.Mock;
    createPending: jest.Mock;
  };
  let smsService: { send: jest.Mock };
  let emailService: { sendVerificationCode: jest.Mock };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findByPhone: jest.fn().mockResolvedValue(null),
    };
    signupVerificationService = {
      normalizeEmail: jest.fn((e: string) => e.trim().toLowerCase()),
      createPending: jest.fn().mockReturnValue({ code: '123456' }),
    };
    smsService = {
      send: jest.fn().mockResolvedValue({ success: true }),
    };
    emailService = {
      sendVerificationCode: jest.fn().mockResolvedValue({
        success: true,
        emailSent: true,
        message: 'Email sent successfully',
      }),
    };

    authService = new AuthService(
      usersService as never,
      {} as never,
      emailService as never,
      smsService as never,
      signupVerificationService as never,
      {} as never,
      {} as never,
      { get: jest.fn() } as never,
      {} as never,
      {} as never,
    );
  });

  it('sends SMS and returns sms channel for South Africa', async () => {
    const result = await authService.initiateSignup(baseDto);

    expect(smsService.send).toHaveBeenCalledWith(
      '27812345678',
      'Your KasiPOS verification code is 123456.',
    );
    expect(emailService.sendVerificationCode).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      message: 'Verification code sent to your mobile number',
      verificationChannel: 'sms',
    });
  });

  it('sends email and returns email channel for non-SA countries', async () => {
    const result = await authService.initiateSignup({
      ...baseDto,
      countryCode: 'GB',
      phoneNumber: '447911123456',
    });

    expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
      'owner@example.com',
      '123456',
    );
    expect(smsService.send).not.toHaveBeenCalled();
    expect(result.verificationChannel).toBe('email');
  });

  it('throws when SMS delivery fails for South Africa', async () => {
    smsService.send.mockResolvedValue({ success: false });

    await expect(authService.initiateSignup(baseDto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws when email delivery fails for non-SA countries', async () => {
    emailService.sendVerificationCode.mockResolvedValue({ success: false });

    await expect(
      authService.initiateSignup({ ...baseDto, countryCode: 'GB' }),
    ).rejects.toThrow(BadRequestException);
  });
});
