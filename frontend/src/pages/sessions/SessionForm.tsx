import React from 'react';
import { Building2, DoorOpen, Cpu, AlertCircle } from 'lucide-react';
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

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
    outline: 'none'
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    color: 'var(--color-text-secondary)'
};

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
    return (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
                <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--color-danger)',
                    color: 'var(--color-danger)',
                    padding: '0.75rem',
                    borderRadius: 'var(--border-radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem'
                }}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Studio Selection */}
            <div>
                <label style={labelStyle}>
                    <Building2 size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Studio
                </label>
                <select
                    required
                    value={formData.studioId}
                    onChange={e => setFormData(prev => ({ ...prev, studioId: e.target.value, roomId: '', emsDeviceId: '' }))}
                    style={inputStyle}
                    disabled={isEdit}
                >
                    <option value="">Select a Studio</option>
                    {studios.filter(s => s.isActive).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/* Room and Device Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={labelStyle}>
                        <DoorOpen size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Room
                    </label>
                    <select
                        required
                        value={formData.roomId}
                        onChange={e => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
                        style={inputStyle}
                        disabled={!formData.studioId}
                    >
                        <option value="">{formData.studioId ? 'Select a Room' : 'Select Studio first'}</option>
                        {rooms.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={labelStyle}>
                        <Cpu size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> EMS Device (optional)
                    </label>
                    <select
                        value={formData.emsDeviceId}
                        onChange={e => setFormData(prev => ({ ...prev, emsDeviceId: e.target.value }))}
                        style={inputStyle}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={labelStyle}>Client</label>
                    <select
                        required
                        value={formData.clientId}
                        onChange={e => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                        style={inputStyle}
                    >
                        <option value="">Select a Client</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={labelStyle}>Coach</label>
                    <select
                        required
                        value={formData.coachId}
                        onChange={e => setFormData(prev => ({ ...prev, coachId: e.target.value }))}
                        style={inputStyle}
                    >
                        <option value="">Select a Coach</option>
                        {coaches.map(c => (
                            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Date/Time and Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={labelStyle}>Date & Time</label>
                    <input
                        type="datetime-local"
                        required
                        value={formData.startTime}
                        onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        style={inputStyle}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Duration (min)</label>
                    <input
                        type="number"
                        min="10"
                        step="5"
                        value={formData.duration}
                        onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        style={inputStyle}
                    />
                </div>
            </div>

            {/* Intensity Level and Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div>
                    <label style={labelStyle}>Intensity Level</label>
                    <select
                        value={formData.intensityLevel}
                        onChange={e => setFormData(prev => ({ ...prev, intensityLevel: parseInt(e.target.value) }))}
                        style={inputStyle}
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
                    <label style={labelStyle}>Notes (Optional)</label>
                    <textarea
                        value={formData.notes}
                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
                        placeholder="Session notes..."
                    />
                </div>
            </div>

            {/* Recurring Sessions - only in create mode */}
            {!isEdit && (
                <RecurrenceSection formData={formData} setFormData={setFormData} inputStyle={inputStyle} />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        opacity: saving ? 0.6 : 1
                    }}
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
    inputStyle: React.CSSProperties;
}

const RecurrenceSection: React.FC<RecurrenceSectionProps> = ({ formData, setFormData, inputStyle }) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div style={{
            backgroundColor: 'var(--color-bg-secondary)',
            padding: '1rem',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)'
        }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                <input
                    type="checkbox"
                    checked={!!formData.recurrencePattern}
                    onChange={e => setFormData(prev => ({
                        ...prev,
                        recurrencePattern: e.target.checked ? 'weekly' : '',
                        recurrenceEndDate: e.target.checked ? prev.recurrenceEndDate : ''
                    }))}
                />
                <span style={{ fontWeight: 500 }}>Make this a recurring session</span>
            </label>

            {formData.recurrencePattern && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                Repeat
                            </label>
                            <select
                                value={formData.recurrencePattern}
                                onChange={e => setFormData(prev => ({
                                    ...prev,
                                    recurrencePattern: e.target.value as 'weekly' | 'biweekly' | 'monthly'
                                }))}
                                style={inputStyle}
                            >
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Every 2 Weeks</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                Until Date
                            </label>
                            <input
                                type="date"
                                value={formData.recurrenceEndDate}
                                onChange={e => setFormData(prev => ({ ...prev, recurrenceEndDate: e.target.value }))}
                                style={inputStyle}
                                min={formData.startTime.split('T')[0] || new Date().toISOString().split('T')[0]}
                                required={!!formData.recurrencePattern}
                            />
                        </div>
                    </div>

                    {formData.recurrencePattern !== 'monthly' && (
                        <div style={{ marginTop: '0.75rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                Days of Week (select multiple for 2+ sessions/week)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                                backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                                                color: isSelected ? 'white' : 'var(--color-text-primary)',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                fontWeight: isSelected ? 600 : 400
                                            }}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', marginBottom: 0 }}>
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
