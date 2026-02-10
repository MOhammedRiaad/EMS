import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sessionsService } from '../sessions.service';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SessionsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(localStorage.getItem).mockReturnValue('test-token');
    });

    describe('getAll', () => {
        it('should fetch all sessions', async () => {
            const mockSessions = [
                { id: '1', status: 'scheduled', startTime: '2025-01-21T10:00:00Z' },
                { id: '2', status: 'completed', startTime: '2025-01-20T10:00:00Z' },
            ];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockSessions),
                text: () => Promise.resolve(JSON.stringify(mockSessions)),
            });

            const result = await sessionsService.getAll();

            expect(result).toEqual(mockSessions);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/sessions'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token',
                    }),
                })
            );
        });

        it('should include query parameters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve([]),
                text: () => Promise.resolve('[]'),
            });

            await sessionsService.getAll({
                from: '2025-01-01',
                to: '2025-01-31',
                status: 'scheduled',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringMatching(/from=2025-01-01.*to=2025-01-31.*status=scheduled/),
                expect.any(Object)
            );
        });

        it('should throw error on failed request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({}),
                text: () => Promise.resolve(''),
            });

            await expect(sessionsService.getAll()).rejects.toThrow(
                'API request failed'
            );
        });
    });

    describe('create', () => {
        it('should create a new session', async () => {
            const newSession = {
                id: 'new-session',
                status: 'scheduled',
                startTime: '2025-01-22T10:00:00Z',
                endTime: '2025-01-22T11:00:00Z',
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: () => Promise.resolve(newSession),
                text: () => Promise.resolve(JSON.stringify(newSession)),
            });

            const result = await sessionsService.create({
                studioId: 'studio-1',
                roomId: 'room-1',
                coachId: 'coach-1',
                clientId: 'client-1',
                startTime: '2025-01-22T10:00:00Z',
                endTime: '2025-01-22T11:00:00Z',
                type: 'individual',
                capacity: 1
            });

            expect(result).toEqual(newSession);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/sessions'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer test-token',
                    }),
                })
            );
        });

        it('should throw error with conflicts on conflict', async () => {
            const mockConflict = {
                message: 'Scheduling conflict',
                conflicts: [{ resource: 'room', id: 'room-1' }],
            };
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 409,
                json: () => Promise.resolve(mockConflict),
                text: () => Promise.resolve(JSON.stringify(mockConflict)),
            });

            try {
                await sessionsService.create({
                    studioId: 'studio-1',
                    roomId: 'room-1',
                    coachId: 'coach-1',
                    clientId: 'client-1',
                    startTime: '2025-01-22T10:00:00Z',
                    endTime: '2025-01-22T11:00:00Z',
                    type: 'individual',
                    capacity: 1
                });
                expect.fail('Should have thrown');
            } catch (error: any) {
                expect(error.message).toBe('Scheduling conflict');
                expect(error.conflicts).toEqual([{ resource: 'room', id: 'room-1' }]);
            }
        });
    });

    describe('update', () => {
        it('should update session', async () => {
            const updatedSession = {
                id: 'session-1',
                status: 'scheduled',
                notes: 'Updated notes',
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(updatedSession),
                text: () => Promise.resolve(JSON.stringify(updatedSession)),
            });

            const result = await sessionsService.update('session-1', {
                notes: 'Updated notes',
            });

            expect(result).toEqual(updatedSession);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/sessions/session-1'),
                expect.objectContaining({
                    method: 'PATCH',
                })
            );
        });
    });

    describe('delete', () => {
        it('should delete session', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 204,
                json: () => Promise.resolve({}),
                text: () => Promise.resolve(''),
            });

            await sessionsService.delete('session-1');

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/sessions/session-1'),
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });

        it('should throw error on failed delete', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({}),
                text: () => Promise.resolve(''),
            });

            await expect(sessionsService.delete('session-1')).rejects.toThrow(
                'API request failed'
            );
        });
    });

    describe('updateStatus', () => {
        it('should update session status', async () => {
            const updatedSession = { id: 'session-1', status: 'completed' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(updatedSession),
                text: () => Promise.resolve(JSON.stringify(updatedSession)),
            });

            const result = await sessionsService.updateStatus('session-1', 'completed');

            expect(result).toEqual(updatedSession);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/sessions/session-1/status'),
                expect.objectContaining({
                    method: 'PATCH',
                    body: expect.stringContaining('"status":"completed"'),
                })
            );
        });

        it('should include cancel reason when provided', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ status: 'cancelled' }),
                text: () => Promise.resolve(JSON.stringify({ status: 'cancelled' })),
            });

            await sessionsService.updateStatus('session-1', 'cancelled', 'Client request', true);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining('"cancelledReason":"Client request"'),
                })
            );
        });
    });
});
