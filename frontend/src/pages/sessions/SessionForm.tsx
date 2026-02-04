import React, { useMemo } from 'react';
import { Building2, DoorOpen, Cpu, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { Client } from '../../services/clients.service';
import type { CoachDisplay } from '../../services/coaches.service';
import type { Studio } from '../../services/studios.service';
import type { Room } from '../../services/rooms.service';
import type { Device } from '../../services/devices.service';
import type { SessionFormData } from './useSessionsState';

interface SessionFormProps {
    formData: SessionFormData;
    setFormData: React.Dispatch<React.SetStateAction<SessionFormData>>;
    clients: Client[];
    coaches: CoachDisplay[];
    studios: Studio[];
    rooms: Room[];
    devices: Device[];
    error: string | null;
    saving: boolean;
    isEdit: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

const inputClass = "w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-900";
const labelClass = "block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300";

export const SessionForm: React.FC<SessionFormProps> = ({
    formData,
    setFormData,
    clients,
    coaches,
    studios,
    rooms,
    devices,
    error,
    saving,
    isEdit,
    onSubmit,
    onCancel
}) => {
    const { isEnabled } = useAuth();
    const canCreateGroupSessions = isEnabled('core.group_sessions');

    // Filter clients by selected studio (hide clients without a studio)
    const filteredClients = useMemo(() => {
        if (!formData.studioId) return [];
        return clients.filter(client => client.studioId === formData.studioId);
    }, [clients, formData.studioId]);

    // Get selected client's gender for coach filtering
    const selectedClient = useMemo(() => {
        return clients.find(c => c.id === formData.clientId);
    }, [clients, formData.clientId]);

    // Filter coaches by selected studio and gender preference
    const filteredCoaches = useMemo(() => {
        if (!formData.studioId) return [];

        return coaches.filter(coach => {
            // Must be linked to the selected studio
            if (coach.studioId !== formData.studioId) return false;

            // Must be active
            if (!coach.active) return false;

            // For individual sessions, check gender preference
            if (formData.type === 'individual' && selectedClient?.user?.gender) {
                const clientGender = selectedClient.user.gender;
                // Coach with 'any' preference can train anyone
                if (coach.preferredClientGender === 'any') return true;
                // Coach with specific preference must match client gender
                // Note: 'other' and 'pnts' genders can be trained by coaches with 'any' preference only
                if (clientGender === 'male' && coach.preferredClientGender === 'male') return true;
                if (clientGender === 'female' && coach.preferredClientGender === 'female') return true;
                // For 'other' or 'pnts', only 'any' coaches are allowed (handled above)
                if (clientGender === 'other' || clientGender === 'pnts') return false;
                return false;
            }

            // For group sessions or when no client selected, show all coaches with matching studio
            return true;
        });
    }, [coaches, formData.studioId, formData.type, selectedClient]);

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Session Type */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Session Type</label>
                    <select
                        value={formData.type}
                        onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as 'individual' | 'group' }))}
                        className={inputClass}
                        disabled={isEdit}
                    >
                        <option value="individual">Individual</option>
                        {canCreateGroupSessions && <option value="group">Group</option>}
                    </select>
                    {!canCreateGroupSessions && formData.type === 'group' && (
                        <p className="text-xs text-red-500 mt-1">Group sessions are not available in your current plan.</p>
                    )}
                </div>
                {formData.type === 'group' && (
                    <div>
                        <label className={labelClass}>Capacity</label>
                        <input
                            type="number"
                            min="2"
                            value={formData.capacity}
                            onChange={e => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                            className={inputClass}
                        />
                    </div>
                )}
            </div>

            {/* Studio Selection */}
            <div>
                <label className={labelClass}>
                    <Building2 size={14} className="inline mr-1" /> Studio
                </label>
                <select
                    required
                    value={formData.studioId}
                    onChange={e => setFormData(prev => ({ ...prev, studioId: e.target.value, roomId: '', emsDeviceId: '' }))}
                    className={inputClass}
                    disabled={isEdit}
                >
                    <option value="">Select a Studio</option>
                    {studios.filter(s => s.isActive).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/* Room and Device Selection */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>
                        <DoorOpen size={14} className="inline mr-1" /> Room
                    </label>
                    <select
                        required
                        value={formData.roomId}
                        onChange={e => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
                        className={inputClass}
                        disabled={!formData.studioId}
                    >
                        <option value="">{formData.studioId ? 'Select a Room' : 'Select Studio first'}</option>
                        {rooms.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>
                        <Cpu size={14} className="inline mr-1" /> EMS Device (optional)
                    </label>
                    <select
                        value={formData.emsDeviceId}
                        onChange={e => setFormData(prev => ({ ...prev, emsDeviceId: e.target.value }))}
                        className={inputClass}
                        disabled={!formData.studioId}
                    >
                        <option value="">{formData.studioId ? (devices.length > 0 ? 'Select a Device' : 'No devices available') : 'Select Studio first'}</option>
                        {devices.map(d => (
                            <option key={d.id} value={d.id}>{d.label} {d.model ? `(${d.model})` : ''}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Client and Coach Selection */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Client</label>
                    {formData.type === 'individual' ? (
                        <select
                            required
                            value={formData.clientId}
                            onChange={e => setFormData(prev => ({ ...prev, clientId: e.target.value, coachId: '' }))}
                            className={inputClass}
                            disabled={!formData.studioId}
                        >
                            <option value="">{formData.studioId ? (filteredClients.length > 0 ? 'Select a Client' : 'No clients for this studio') : 'Select Studio first'}</option>
                            {filteredClients.map(c => (
                                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                            ))}
                        </select>
                    ) : (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                            Participants are managed in session details after creation.
                        </div>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Coach</label>
                    <select
                        required
                        value={formData.coachId}
                        onChange={e => setFormData(prev => ({ ...prev, coachId: e.target.value }))}
                        className={inputClass}
                        disabled={!formData.studioId}
                    >
                        <option value="">{formData.studioId ? (filteredCoaches.length > 0 ? 'Select a Coach' : 'No coaches available') : 'Select Studio first'}</option>
                        {filteredCoaches.map(c => (
                            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Date/Time and Duration */}
            <div className="grid grid-cols-[2fr_1fr] gap-4">
                <div>
                    <label className={labelClass}>Date & Time</label>
                    <input
                        type="datetime-local"
                        required
                        value={formData.startTime}
                        onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Duration (min)</label>
                    <input
                        type="number"
                        min="10"
                        step="5"
                        value={formData.duration}
                        onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Intensity Level and Notes */}
            <div className="grid grid-cols-[1fr_2fr] gap-4">
                <div>
                    <label className={labelClass}>Intensity Level</label>
                    <select
                        value={formData.intensityLevel}
                        onChange={e => setFormData(prev => ({ ...prev, intensityLevel: parseInt(e.target.value) }))}
                        className={inputClass}
                    >
                        <option value="1">1 - Very Light</option>
                        <option value="2">2 - Light</option>
                        <option value="3">3 - Light-Moderate</option>
                        <option value="4">4 - Moderate</option>
                        <option value="5">5 - Moderate-Hard</option>
                        <option value="6">6 - Hard</option>
                        <option value="7">7 - Hard-Very Hard</option>
                        <option value="8">8 - Very Hard</option>
                        <option value="9">9 - Extremely Hard</option>
                        <option value="10">10 - Maximum</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Notes (Optional)</label>
                    <textarea
                        value={formData.notes}
                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className={`${inputClass} min-h-[60px] resize-y`}
                        placeholder="Session notes..."
                    />
                </div>
            </div>

            {/* Recurring Sessions - only in create mode */}
            {!isEdit && (
                <RecurrenceSection formData={formData} setFormData={setFormData} inputClass={inputClass} />
            )}

            <div className="flex justify-end gap-2 mt-4 items-center">
                {isEdit && (formData as any).isRecurring && (
                    <label className="flex items-center gap-2 mr-auto cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                        <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            onChange={(e) => {
                                // We need a way to pass this back up. 
                                // HACK: MutatingselectedSession in parent? No.
                                // Passed via setFormData? formData doesn't have applyToSeries.
                                // Let's add it to formData? Or use a separate prop?
                                // SessionFormProps doesn't have a way to set "applyToSeries".
                                // Quick fix: Add it to formData as 'any' or update interface.
                                // Better: Update SessionFormData interface in useSessionsState.
                                setFormData(prev => ({ ...prev, applyToSeries: e.target.checked } as any));
                            }}
                        />
                        <span>Apply to entire series (future sessions)</span>
                    </label>
                )}

                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg opacity-100 disabled:opacity-60 transition-all font-medium"
                >
                    {saving ? 'Saving...' : isEdit ? 'Reschedule Session' : 'Schedule Session'}
                </button>
            </div>
        </form>
    );
};

// Recurrence section sub-component
interface RecurrenceSectionProps {
    formData: SessionFormData;
    setFormData: React.Dispatch<React.SetStateAction<SessionFormData>>;
    inputClass: string;
}

const RecurrenceSection: React.FC<RecurrenceSectionProps> = ({ formData, setFormData, inputClass }) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={!!formData.recurrencePattern}
                    onChange={e => setFormData(prev => ({
                        ...prev,
                        recurrencePattern: e.target.checked ? 'weekly' : '',
                        recurrenceEndDate: e.target.checked ? prev.recurrenceEndDate : ''
                    }))}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-900 dark:text-gray-100">Make this a recurring session</span>
            </label>

            {formData.recurrencePattern && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 text-xs text-gray-500 dark:text-gray-400">
                                Repeat
                            </label>
                            <select
                                value={formData.recurrencePattern}
                                onChange={e => setFormData(prev => ({
                                    ...prev,
                                    recurrencePattern: e.target.value as 'weekly' | 'biweekly' | 'monthly'
                                }))}
                                className={inputClass}
                            >
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Every 2 Weeks</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs text-gray-500 dark:text-gray-400">
                                Until Date
                            </label>
                            <input
                                type="date"
                                value={formData.recurrenceEndDate}
                                onChange={e => setFormData(prev => ({ ...prev, recurrenceEndDate: e.target.value }))}
                                className={inputClass}
                                min={formData.startTime.split('T')[0] || new Date().toISOString().split('T')[0]}
                                required={!!formData.recurrencePattern}
                            />
                        </div>
                    </div>

                    {formData.recurrencePattern !== 'monthly' && (
                        <div className="mt-3">
                            <label className="block mb-1 text-xs text-gray-500 dark:text-gray-400">
                                Days of Week (select multiple for 2+ sessions/week)
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {days.map((day, index) => {
                                    const isSelected = formData.recurrenceDays.includes(index);
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => {
                                                const newDays = isSelected
                                                    ? formData.recurrenceDays.filter(d => d !== index)
                                                    : [...formData.recurrenceDays, index].sort((a, b) => a - b);
                                                setFormData(prev => ({ ...prev, recurrenceDays: newDays }));
                                            }}
                                            className={`
                                                px-2 py-1 rounded text-xs transition-colors border
                                                ${isSelected
                                                    ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                                                    : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                                                }
                                            `}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Leave empty to use the same day as the first session
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SessionForm;
