import React from 'react';
import Modal from '../../../components/common/Modal';
import type { BookingData } from './useWaitingListState';

interface BookSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingData: BookingData;
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>;
    coaches: any[];
    rooms: any[];
    loading: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)'
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    color: 'var(--color-text-secondary)'
};

export const BookSessionModal: React.FC<BookSessionModalProps> = ({
    isOpen,
    onClose,
    bookingData,
    setBookingData,
    coaches,
    rooms,
    loading,
    onSubmit
}) => {
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value;
        const time = bookingData.startTime.split('T')[1] || '09:00';
        const endTime = bookingData.endTime.split('T')[1] || '10:00';
        setBookingData(prev => ({
            ...prev,
            startTime: `${date}T${time}`,
            endTime: `${date}T${endTime}`
        }));
    };

    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = bookingData.startTime.split('T')[0];
        const startTime = e.target.value;
        setBookingData(prev => ({
            ...prev,
            startTime: `${date}T${startTime}`,
            endTime: `${date}T${startTime}`
        }));
    };

    const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = bookingData.endTime.split('T')[0];
        setBookingData(prev => ({
            ...prev,
            endTime: `${date}T${e.target.value}`
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Book Session">
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Date and Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Date</label>
                        <input
                            type="date"
                            required
                            value={bookingData.startTime.split('T')[0]}
                            onChange={handleDateChange}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Time</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                                type="time"
                                required
                                value={bookingData.startTime.split('T')[1] || ''}
                                onChange={handleStartTimeChange}
                                style={{ ...inputStyle, flex: 1 }}
                            />
                            <span>-</span>
                            <input
                                type="time"
                                required
                                value={bookingData.endTime.split('T')[1] || ''}
                                onChange={handleEndTimeChange}
                                style={{ ...inputStyle, flex: 1 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Coach */}
                <div>
                    <label style={labelStyle}>Coach</label>
                    <select
                        required
                        value={bookingData.coachId}
                        onChange={e => setBookingData(prev => ({ ...prev, coachId: e.target.value }))}
                        style={inputStyle}
                    >
                        <option value="">Select Coach...</option>
                        {coaches.map((coach: any) => (
                            <option key={coach.id} value={coach.id}>
                                {coach.user?.firstName} {coach.user?.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Room */}
                <div>
                    <label style={labelStyle}>Room / Device</label>
                    <select
                        required
                        value={bookingData.roomId}
                        onChange={e => setBookingData(prev => ({ ...prev, roomId: e.target.value }))}
                        style={inputStyle}
                    >
                        <option value="">Select Room...</option>
                        {rooms.map((room: any) => (
                            <option key={room.id} value={room.id}>{room.name}</option>
                        ))}
                    </select>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'transparent',
                            color: 'var(--color-text-primary)'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--border-radius-md)',
                            border: 'none',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Booking...' : 'Confirm Book'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default BookSessionModal;
