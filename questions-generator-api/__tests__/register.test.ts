import { handler } from '../src/auth/register/index';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

jest.mock('bcryptjs');

const ddbMock = mockClient(DynamoDBClient);
const docMock = mockClient(DynamoDBDocumentClient);

describe('Register – minimal smoke tests', () => {
  beforeEach(() => {
    ddbMock.reset();
    docMock.reset();
    jest.clearAllMocks();
  });

  it('handles OPTIONS', async () => {
    const res = await handler({
      httpMethod: 'OPTIONS',
      headers: { origin: '*' },
      body: '',
      isBase64Encoded: false,
    });

    expect(res.statusCode).toBe(200);
  });

  it('returns 405 on wrong method', async () => {
    const res = await handler({
      httpMethod: 'GET',
      headers: { origin: '*' },
      body: '',
      isBase64Encoded: false,
    });

    expect(res.statusCode).toBe(405);
  });

  it('returns 400 when body missing', async () => {
    const res = await handler({
      httpMethod: 'POST',
      headers: { origin: '*' },
      body: null,
      isBase64Encoded: false,
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when fields missing', async () => {
    const res = await handler({
      httpMethod: 'POST',
      headers: { origin: '*' },
      body: JSON.stringify({ email: 'a@b.com' }),
      isBase64Encoded: false,
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 on invalid email', async () => {
    const res = await handler({
      httpMethod: 'POST',
      headers: { origin: '*' },
      body: JSON.stringify({
        email: 'not-email',
        userName: 'usr',
        password: '12345678',
      }),
      isBase64Encoded: false,
    });

    expect(res.statusCode).toBe(400);
  });
});