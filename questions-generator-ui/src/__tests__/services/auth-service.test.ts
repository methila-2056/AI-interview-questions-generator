import { loginUser, registerUser, API_ENDPOINTS } from '../../services/auth-service';

const createMockResponse = (
    body: unknown,
    status = 200,
    ok = status >= 200 && status < 300
): Response => {
    const json = jest.fn().mockResolvedValue(body);
    const text = jest.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body));

    return {
        ok,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        json,
        text,
        clone: () => ({ ...createMockResponse(body, status, ok) }),
    } as unknown as Response;
};

describe('auth-service', () => {
    let originalFetch: typeof fetch;

    beforeAll(() => {
        originalFetch = global.fetch;
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'info').mockImplementation(() => {});
    });

    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    describe('loginUser', () => {
        it('successful login → returns user object', async () => {
            const mockUser = { email: 'test@example.com', name: 'Test User' };
            (global.fetch as jest.Mock).mockResolvedValue(createMockResponse(mockUser));

            const result = await loginUser('test@example.com', 'secret123');

            expect(result).toEqual(mockUser);
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'test@example.com', password: 'secret123' }),
            });
        });

        it('401 unauthorized → throws error with status', async () => {
            (global.fetch as jest.Mock).mockResolvedValue(createMockResponse('Unauthorized', 401, false));

            await expect(loginUser('bad@email.com', 'wrong')).rejects.toThrow('Unauthorized');
        });

        it('400 with error message from server → throws that message', async () => {
            (global.fetch as jest.Mock).mockResolvedValue(
                createMockResponse('Email or password invalid', 400, false)
            );

            await expect(loginUser('test@email.com', '123')).rejects.toThrow('Email or password invalid');
        });
    });

    describe('registerUser', () => {
        it('successful registration → returns user object', async () => {
            const mockUser = { email: 'new@example.com', name: 'New User' };
            (global.fetch as jest.Mock).mockResolvedValue(createMockResponse(mockUser, 201));

            const result = await registerUser('New User', 'new@example.com', 'pass456');

            expect(result).toEqual(mockUser);
            expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.REGISTER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'new@example.com',
                    userName: 'New User',
                    password: 'pass456',
                }),
            });
        });

        it('409 conflict (email exists) → throws server message', async () => {
            (global.fetch as jest.Mock).mockResolvedValue(
                createMockResponse('Email already in use', 409, false)
            );

            await expect(
                registerUser('Duplicate', 'exists@email.com', 'pass')
            ).rejects.toThrow('Email already in use');
        });
    });
});