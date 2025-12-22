import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { coachesService } from '../../services/coaches.service';
import type { Coach } from '../../services/coaches.service';
import { Mail, Upload, User } from 'lucide-react';
import { storageService } from '../../services/storage.service';

const Coaches: React.FC = () => {
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCoach, setNewCoach] = useState({ firstName: '', lastName: '', email: '', phone: '', bio: '', avatarUrl: '' });

    const fetchCoaches = async () => {
        try {
            const data = await coachesService.getAll();
            setCoaches(data);
        } catch (error) {
            console.error('Failed to fetch coaches', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoaches();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await coachesService.create({ ...newCoach, status: 'active', specialties: [] });
            setIsModalOpen(false);
            setNewCoach({ firstName: '', lastName: '', email: '', phone: '', bio: '', avatarUrl: '' });
            fetchCoaches();
        } catch (error) {
            console.error('Failed to create coach', error);
        }
    };

    const columns: Column<Coach>[] = [
        {
            key: 'name',
            header: 'Name',
            render: (coach) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: 'var(--color-primary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'white',
                        fontWeight: 600, fontSize: '0.75rem', overflow: 'hidden'
                    }}>
                        {coach.avatarUrl ? (
                            <img src={`http://localhost:3000${coach.avatarUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            coach.firstName[0] + coach.lastName[0]
                        )}
                    </div>
                    <div>
                        <div style={{ fontWeight: 500 }}>{coach.firstName} {coach.lastName}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'email',
            header: 'Email',
            render: (coach) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <Mail size={14} />
                    {coach.email || '-'}
                </div>
            )
        },
        {
            key: 'bio',
            header: 'Bio',
            render: (coach) => (
                <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text-secondary)' }}>
                    {coach.bio || '-'}
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (coach) => (
                <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: coach.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: coach.status === 'active' ? 'var(--color-success)' : 'var(--color-text-muted)'
                }}>
                    {coach.status}
                </span>
            )
        }
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
            <PageHeader
                title="Coaches"
                description="Manage your training staff"
                actionLabel="Add Coach"
                onAction={() => setIsModalOpen(true)}
            />

            <DataTable
                columns={columns}
                data={coaches}
                isLoading={loading}
                onRowClick={(coach) => console.log('Clicked coach', coach)}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Coach">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                            <div style={{
                                width: '100%', height: '100%', borderRadius: '50%',
                                backgroundColor: 'var(--color-bg-primary)', border: '1px dashed var(--border-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                            }}>
                                {newCoach.avatarUrl ? (
                                    <img src={`http://localhost:3000${newCoach.avatarUrl}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={32} color="var(--color-text-muted)" />
                                )}
                            </div>
                            <label style={{
                                position: 'absolute', bottom: 0, right: 0,
                                backgroundColor: 'var(--color-primary)', borderRadius: '50%', padding: '0.25rem',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Upload size={14} color="white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            try {
                                                const url = await storageService.upload(file);
                                                setNewCoach(prev => ({ ...prev, avatarUrl: url }));
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>First Name</label>
                            <input type="text" required value={newCoach.firstName} onChange={e => setNewCoach({ ...newCoach, firstName: e.target.value })} className="input-field" style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Last Name</label>
                            <input type="text" required value={newCoach.lastName} onChange={e => setNewCoach({ ...newCoach, lastName: e.target.value })} className="input-field" style={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Email</label>
                        <input type="email" required value={newCoach.email} onChange={e => setNewCoach({ ...newCoach, email: e.target.value })} className="input-field" style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Bio</label>
                        <textarea value={newCoach.bio} onChange={e => setNewCoach({ ...newCoach, bio: e.target.value })} className="input-field" style={{ ...inputStyle, height: '80px', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                        <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)' }}>Create Coach</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Coaches;
