import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { roomsService } from '../../services/rooms.service';
import type { Room } from '../../services/rooms.service';
import { studiosService } from '../../services/studios.service';
import type { Studio } from '../../services/studios.service';

const Rooms: React.FC = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRoom, setNewRoom] = useState({ name: '', capacity: 2, studioId: '' });

    const fetchData = async () => {
        try {
            const [roomsData, studiosData] = await Promise.all([
                roomsService.getAll(),
                studiosService.getAll()
            ]);
            setRooms(roomsData);
            setStudios(studiosData);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await roomsService.create(newRoom);
            setIsModalOpen(false);
            setNewRoom({ name: '', capacity: 2, studioId: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to create room', error);
        }
    };

    const columns: Column<Room>[] = [
        { key: 'name', header: 'Room Name' },
        {
            key: 'studio',
            header: 'Studio',
            render: (room) => room.studio ? room.studio.name : '-'
        },
        { key: 'capacity', header: 'Capacity' }
    ];

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        outline: 'none'
    };

    return (
        <div>
            <PageHeader title="Rooms" description="Manage treatment rooms" actionLabel="Add Room" onAction={() => setIsModalOpen(true)} />
            <DataTable columns={columns} data={rooms} isLoading={loading} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Room">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Room Name</label>
                        <input type="text" required value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} className="input-field" style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Studio</label>
                        <select required value={newRoom.studioId} onChange={e => setNewRoom({ ...newRoom, studioId: e.target.value })} style={inputStyle}>
                            <option value="">Select Studio</option>
                            {studios.filter(s => s.isActive).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Capacity</label>
                        <input type="number" min="1" required value={newRoom.capacity} onChange={e => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })} className="input-field" style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                        <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)' }}>Create Room</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Rooms;
