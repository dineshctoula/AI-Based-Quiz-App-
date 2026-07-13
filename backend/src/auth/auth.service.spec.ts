import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt module to avoid read-only property redefinition errors
// Read-only property redefinition errors रोक्न bcrypt module लाई mock गरेको
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const signUpDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should successfully register a new user', async () => {
      // Mock UsersService finding no existing email
      // यो इमेल पहिले नै register नभएको mock गर्ने
      usersService.findByEmail.mockResolvedValue(null);
      
      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const dbUser = {
        id: 1,
        email: signUpDto.email,
        password: hashedPassword,
        name: signUpDto.name,
        role: 'USER',
        createdAt: new Date(),
      };
      usersService.create.mockResolvedValue(dbUser);

      const result = await service.register(signUpDto);

      // Verify that the services were called with the correct arguments
      // Service हरू सही data सहित कल भएको निश्चित गर्ने
      expect(usersService.findByEmail).toHaveBeenCalledWith(signUpDto.email);
      expect(usersService.create).toHaveBeenCalledWith({
        email: signUpDto.email,
        password: hashedPassword,
        name: signUpDto.name,
      });
      expect(result).toEqual({
        id: 1,
        email: signUpDto.email,
        name: signUpDto.name,
        role: 'USER',
        createdAt: dbUser.createdAt,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      // Mock existing user found
      // पहिले नै user भएको mock गर्ने
      usersService.findByEmail.mockResolvedValue({
        id: 1,
        email: signUpDto.email,
        password: 'existingPassword',
        name: 'Existing User',
        role: 'USER',
        createdAt: new Date(),
      });

      await expect(service.register(signUpDto)).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should validate user with correct credentials and return user details without password', async () => {
      const dbUser = {
        id: 1,
        email: loginDto.email,
        password: 'hashedPassword',
        name: 'Test User',
        role: 'USER',
        createdAt: new Date(),
      };
      usersService.findByEmail.mockResolvedValue(dbUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(loginDto);

      // Verify DB checks and bcrypt password comparison
      // Database र password comparison दुवै pass भएको check गर्ने
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, dbUser.password);
      expect(result).toEqual({
        id: 1,
        email: loginDto.email,
        name: dbUser.name,
        role: 'USER',
        createdAt: dbUser.createdAt,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const dbUser = {
        id: 1,
        email: loginDto.email,
        password: 'hashedPassword',
        name: 'Test User',
        role: 'USER',
        createdAt: new Date(),
      };
      usersService.findByEmail.mockResolvedValue(dbUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return a signed JWT token and user info', async () => {
      const user = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      };
      const mockToken = 'mockJwtToken';
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(user);

      // Verify JWT token is generated with correct payload
      // सही payload सहित JWT token बनेको verify गर्ने
      expect(jwtService.sign).toHaveBeenCalledWith({ email: user.email, sub: user.id });
      expect(result).toEqual({
        accessToken: mockToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    });
  });
});
