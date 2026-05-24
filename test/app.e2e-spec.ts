import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';

process.env.DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/expense_tracker_pro?schema=public';
process.env.JWT_SECRET = 'test-secret';

import { AppModule } from '../src/app.module';

describe('Expense Tracker API (e2e)', () => {
  let app: INestApplication<App>;
  const users = new Map<string, typeof mockUser>();

  const mockUser = {
    id: 'user-1',
    email: 'demo@expensetracker.pro',
    name: 'Demo User',
    passwordHash:
      '$2b$12$1QWfkd7Zw7fvF0s8B9qUae6eTqMiyJ2Ycxw5r1vAnDASzdMR3w6Gm',
    currency: 'USD',
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(
        ({ where }: { where: { email?: string; id?: string } }) => {
          if (where.email) {
            return users.get(where.email) ?? null;
          }
          if (where.id) {
            return (
              Array.from(users.values()).find((user) => user.id === where.id) ??
              null
            );
          }
          return null;
        },
      ),
      create: jest.fn(
        ({
          data,
        }: {
          data: { email: string; name: string; passwordHash: string };
        }) => ({
          ...mockUser,
          email: data.email,
          name: data.name,
          passwordHash: data.passwordHash,
        }),
      ),
      update: jest.fn(
        ({ data }: { data: { name?: string; currency?: string } }) => ({
          ...mockUser,
          ...data,
        }),
      ),
    },
    category: {
      findMany: jest.fn(() => [
        {
          id: 'category-1',
          name: 'Food',
          type: 'EXPENSE',
          color: '#ef4444',
          icon: 'UtensilsCrossed',
        },
      ]),
    },
  };

  mockPrisma.user.create.mockImplementation(
    ({
      data,
    }: {
      data: { email: string; name: string; passwordHash: string };
    }) => {
      const createdUser = {
        ...mockUser,
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
      };
      users.set(data.email, createdUser);
      return createdUser;
    },
  );

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  beforeEach(() => {
    users.clear();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('registers a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Demo User',
        email: 'demo@expensetracker.pro',
        password: 'Passw0rd!2026',
      })
      .expect(201);

    const responseBody = response.body as {
      token: string;
      user: { email: string };
    };

    expect(responseBody.token).toBeDefined();
    expect(responseBody.user.email).toBe('demo@expensetracker.pro');
  });

  it('logs in and fetches categories', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Demo User',
        email: 'demo@expensetracker.pro',
        password: 'Passw0rd!2026',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'demo@expensetracker.pro',
        password: 'Passw0rd!2026',
      })
      .expect(200);

    const loginBody = loginResponse.body as { token: string };

    await request(app.getHttpServer())
      .get('/api/categories')
      .set('Authorization', `Bearer ${loginBody.token}`)
      .expect(200)
      .expect((response) => {
        const responseBody = response.body as Array<{ name: string }>;
        expect(responseBody).toHaveLength(1);
        expect(responseBody[0]?.name).toBe('Food');
      });
  });
});
