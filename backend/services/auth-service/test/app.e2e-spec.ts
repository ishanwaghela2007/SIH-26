import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Auth HTTP API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('does not reveal whether an email exists during password recovery', () => {
    return request(app.getHttpServer())
      .post('/auth/password/forgot')
      .send({ email: 'unknown@example.com' })
      .expect(200)
      .expect(({ body }: { body: { message: string } }) => {
        expect(body.message).toBe(
          'If an account exists, password reset instructions have been requested.',
        );
      });
  });
});
