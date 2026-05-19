import { fetchAnalyzeDescQueAIFn } from '../../services/question.service';
import { GenerateRequest, QuestionOutput } from '../../services/question.model';

const API_URL = 'https://dle7ki4lf2.execute-api.us-east-1.amazonaws.com/prod/quesgen';

const createMockResponse = (
  body: unknown,
  status = 200,
  ok = status >= 200 && status < 300
): Response => {
  const json = jest.fn().mockResolvedValue(body);
  const text = jest.fn().mockResolvedValue(
    typeof body === 'string' ? body : JSON.stringify(body)
  );
  return {
    ok,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json,
    text,
    clone: () => ({ ...createMockResponse(body, status, ok) }),
  } as unknown as Response;
};

describe('question.service → fetchAnalyzeDescQueAIFn', () => {
  let originalFetch: typeof fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('successful response (array) → returns questions array', async () => {
    const mockQuestions: QuestionOutput[] = [
      { hrsQuesId: 'q1', hrsQuesText: 'Tell me about React hooks?', hrsExpAns: '...' },
      { hrsQuesId: 'q2', hrsQuesText: 'What is useEffect used for?' },
    ];
    (global.fetch as jest.Mock).mockResolvedValue(createMockResponse(mockQuestions));

    const payload: GenerateRequest = { hrsJobDesc: 'React frontend developer with 3+ years' };
    const result = await fetchAnalyzeDescQueAIFn(payload);

    expect(result).toEqual(mockQuestions);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });

  it('returns empty array when response is not an array', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(createMockResponse({ message: 'ok' }));
    const result = await fetchAnalyzeDescQueAIFn({ hrsJobDesc: 'test' });
    expect(result).toEqual([]);
  });

  it('network error → returns empty array', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network timeout'));
    const result = await fetchAnalyzeDescQueAIFn({ hrsJobDesc: 'test' });
    expect(result).toEqual([]);
  });

  it('HTTP error 500 → returns empty array', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse('Server crashed', 500, false)
    );
    const result = await fetchAnalyzeDescQueAIFn({ hrsJobDesc: 'test' });
    expect(result).toEqual([]);
  });

  it('response.json throws → returns empty array', async () => {
    const badResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      text: jest.fn().mockResolvedValue('invalid json here'),
      clone: jest.fn(),
    } as unknown as Response;
    (global.fetch as jest.Mock).mockResolvedValue(badResponse);
    const result = await fetchAnalyzeDescQueAIFn({ hrsJobDesc: 'test' });
    expect(result).toEqual([]);
  });

  it('array with partial fields → returns the array', async () => {
    const partial = [
      { hrsQuesId: 'q1', hrsQuesText: 'Q1' },
      { hrsQuesText: 'Q2' },
    ];
    (global.fetch as jest.Mock).mockResolvedValue(createMockResponse(partial));
    const result = await fetchAnalyzeDescQueAIFn({ hrsJobDesc: 'test' });
    expect(result).toEqual(partial);
  });
});