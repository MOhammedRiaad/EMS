import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, authenticatedFetch } from '../api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('api.get', () => {
        it('should make GET request and return data', async () => {
            const mockData = [{ id: 1, name: 'Test' }];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

            const result = await api.get('/sessions');

            expect(result).toEqual(mockData);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/sessions'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                })
            );
        });

        it('should include query params in URL', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([]),
            });

            await api.get('/sessions', { status: 'active', limit: '10' });

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringMatching(/status=active.*limit=10|limit=10.*status=active/),
                expect.any(Object)
            );
        });

        it('should include auth token when present', async () => {
            vi.mocked(localStorage.getItem).mockReturnValue('test-token');
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([]),
            });

            await api.get('/sessions');

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token',
                    }),
                })
            );
        });

        it('should throw error response on failed request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: 'Unauthorized' }),
            });

            await expect(api.get('/sessions')).rejects.toEqual({
                response: { data: { message: 'Unauthorized' } },
            });
        });
    });

    describe('api.post', () => {
        it('should make POST request with body', async () => {
            const mockResponse = { id: 'new-session', status: 'created' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const body = { clientId: '1', date: '2025-01-21' };
            const result = await api.post('/sessions', body);

            expect(result).toEqual({ data: mockResponse });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/sessions'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(body),
                })
            );
        });

        it('should throw error response on failed POST', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: 'Validation failed' }),
            });

            await expect(api.post('/sessions', {})).rejects.toEqual({
                response: { data: { message: 'Validation failed' } },
            });
        });
    });

    describe('authenticatedFetch', () => {
        it('should make authenticated request', async () => {
            vi.mocked(localStorage.getItem).mockReturnValue('auth-token');
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            const result = await authenticatedFetch('/protected');

            expect(result).toEqual({ success: true });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/protected'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer auth-token',
                    }),
                })
            );
        });

        it('should throw error with message on failed request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: 'Access denied' }),
            });

            await expect(authenticatedFetch('/protected')).rejects.toThrow(
                'Access denied'
            );
        });

        it('should throw default message when no error message provided', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({}),
            });

            await expect(authenticatedFetch('/protected')).rejects.toThrow(
                'API request failed'
            );
        });

        it('should pass custom options', async () => {
            vi.mocked(localStorage.getItem).mockReturnValue('token');
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await authenticatedFetch('/data', {
                method: 'DELETE',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });
    });
});
