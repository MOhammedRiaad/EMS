import React from 'react';
import Modal from '../../../components/common/Modal';
import type { CreateWaitingListEntryDto } from '../../../services/waiting-list.service';
import type { Client } from '../../../services/clients.service';
import type { Studio } from '../../../services/studios.service';

interface AddEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: CreateWaitingListEntryDto;
    setFormData: React.Dispatch<React.SetStateAction<CreateWaitingListEntryDto>>;
    clients: Client[];
    studios: Studio[];
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

export const AddEntryModal: React.FC<AddEntryModalProps> = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    clients,
    studios,
    onSubmit
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add to Waiting List">
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Client */}
                <div>
                    <label style={labelStyle}>Client</label>
                    <select
                        required
                        value={formData.clientId}
                        onChange={e => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                        style={inputStyle}
                    >
                        <option value="">Select client...</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>
                                {client.firstName} {client.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Studio */}
                <div>
                    <label style={labelStyle}>Studio</label>
                    <select
                        required
                        value={formData.studioId}
                        onChange={e => setFormData(prev => ({ ...prev, studioId: e.target.value }))}
                        style={inputStyle}
                    >
                        <option value="">Select studio...</option>
                        {studios.map(studio => (
                            <option key={studio.id} value={studio.id}>{studio.name}</option>
                        ))}
                    </select>
                </div>

                {/* Preferred Date and Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Preferred Date</label>
                        <input
                            type="date"
                            value={formData.preferredDate}
                            onChange={e => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Time Preference</label>
                        <select
                            value={formData.preferredTimeSlot}
                            onChange={e => setFormData(prev => ({ ...prev, preferredTimeSlot: e.target.value }))}
                            style={inputStyle}
                        >
                            <option value="">Any time</option>
                            <option value="morning">Morning</option>
                            <option value="afternoon">Afternoon</option>
                            <option value="evening">Evening</option>
                        </select>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label style={labelStyle}>Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Specific requirements..."
                        style={{ ...inputStyle, minHeight: '80px' }}
                    />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            borderRadius: 'var(--border-radius-md)'
                        }}
                    >
                        Add to List
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEntryModal;
