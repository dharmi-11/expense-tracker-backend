import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let authService: AuthService;

  type SerializableUser = {
    id: string;
    name: string;
    email: string;
    currency: string;
  };

  const usersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    serialize: jest.fn((user: SerializableUser) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
    })),
    findById: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(() => 'signed-token'),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    jest.clearAllMocks();
  });

  it('registers a new user', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({
      id: 'user-1',
      name: 'Demo User',
      email: 'demo@expensetracker.pro',
      currency: 'USD',
    });

    const result = await authService.register({
      name: 'Demo User',
      email: 'demo@expensetracker.pro',
      password: 'Passw0rd!2026',
    });

    expect(result.token).toBe('signed-token');
    expect(usersService.create).toHaveBeenCalled();
  });

  it('rejects duplicate emails on registration', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'user-1' });

    await expect(
      authService.register({
        name: 'Demo User',
        email: 'demo@expensetracker.pro',
        password: 'Passw0rd!2026',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid credentials on login', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'demo@expensetracker.pro',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
