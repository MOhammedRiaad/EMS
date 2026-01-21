import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../auth.service';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('login', () => {
        it('should return auth response on successful login', async () => {
            const mockResponse = {
                accessToken: 'test-token-123',
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'admin',
                    tenantId: 'tenant-1',
                },
                tenant: {
                    id: 'tenant-1',
                    name: 'Test Studio',
                    slug: 'test-studio',
                    isComplete: true,
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await authService.login({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/login'),
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'test@example.com',
                        password: 'password123',
                    }),
                })
            );
        });

        it('should throw error on failed login', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: 'Invalid credentials' }),
            });

            await expect(
                authService.login({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                })
            ).rejects.toThrow('Invalid credentials');
        });

        it('should throw default error message when no message provided', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({}),
            });

            await expect(
                authService.login({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                })
            ).rejects.toThrow('Login failed');
        });
    });

    describe('register', () => {
        it('should return auth response on successful registration', async () => {
            const mockResponse = {
                accessToken: 'new-token-123',
                user: {
                    id: 'user-new',
                    email: 'new@example.com',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    role: 'tenant_owner',
                    tenantId: 'tenant-new',
                },
                tenant: {
                    id: 'tenant-new',
                    name: 'New Studio',
                    slug: 'new-studio',
                    isComplete: false,
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await authService.register({
                businessName: 'New Studio',
                email: 'new@example.com',
                password: 'password123',
                firstName: 'Jane',
                lastName: 'Smith',
            });

            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/register'),
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });

        it('should throw error on failed registration', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: 'Email already exists' }),
            });

            await expect(
                authService.register({
                    businessName: 'Test Studio',
                    email: 'existing@example.com',
                    password: 'password123',
                })
            ).rejects.toThrow('Email already exists');
        });
    });

    describe('setupPassword', () => {
        it('should complete password setup successfully', async () => {
            const mockResponse = {
                accessToken: 'setup-token-123',
                user: {
                    id: 'user-setup',
                    email: 'setup@example.com',
                    firstName: 'Setup',
                    lastName: 'User',
                    role: 'coach',
                    tenantId: 'tenant-1',
                },
                tenant: {
                    id: 'tenant-1',
                    name: 'Test Studio',
                    slug: 'test-studio',
                    isComplete: true,
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await authService.setupPassword({
                token: 'setup-token',
                password: 'newpassword123',
                firstName: 'Setup',
                lastName: 'User',
            });

            expect(result).toEqual(mockResponse);
        });

        it('should throw error on invalid setup token', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: 'Invalid or expired token' }),
            });

            await expect(
                authService.setupPassword({
                    token: 'invalid-token',
                    password: 'password123',
                })
            ).rejects.toThrow('Invalid or expired token');
        });
    });
});
