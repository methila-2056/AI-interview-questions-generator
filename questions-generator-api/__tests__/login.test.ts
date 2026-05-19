import { handler } from '../src/auth/login/index';

describe('Login handler – basic structure', () => {
  it('returns 200 on OPTIONS', async () => {
    const res = await handler({
      httpMethod: 'OPTIONS',
      headers: {},
      body: '',
      isBase64Encoded: false,
    } as any);
    expect(res.statusCode).toBe(200);
  });

  it('returns 405 on wrong method', async () => {
    const res = await handler({
      httpMethod: 'GET',
      headers: {},
      body: '',
      isBase64Encoded: false,
    } as any);
    expect(res.statusCode).toBe(405);
  });

  it('returns 400 when no body', async () => {
    const res = await handler({
      httpMethod: 'POST',
      headers: {},
      body: null,
      isBase64Encoded: false,
    } as any);
    expect(res.statusCode).toBe(400);
  });
});