import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import SessionForm from './SessionForm';
import { useSessionsState } from './useSessionsState';
import { ChevronLeft } from 'lucide-react';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const SessionCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const state = useSessionsState();
    const { sessions, handleEdit } = state;
    const isEdit = !!id;

    useEffect(() => {
        if (isEdit && id && sessions.length > 0) {
            // Check if we already have the correct data loaded to avoid loops/redundant updates
            // We can check if formData.id (if we had it) or just trust the loop breaking, 
            // but for safety, let's ensure we only run if we haven't set it yet?
            // Actually, handleEdit is stable, sessions is stable. 
            // The issue was 'state' changing on every render.
            // But wait, if we edit, we populate formData. formData changes.
            // If we depend on formData (implicit or explicit), we might loop?
            // We don't depend on formData here.

            // Optimization: Don't re-populate if already populated?
            // But how do we know?
            // Let's just rely on stable dependencies first.
            const session = sessions.find(s => s.id === id);
            if (session) {
                // Avoid re-setting if already set (basic check, maybe check a field?)
                // Actually handleEdit sets selectedSession.
                if (state.selectedSession?.id !== id) {
                    handleEdit(session);
                }
            }
        }
    }, [id, isEdit, sessions, handleEdit]); // Removed 'state' dependency

    // Wrap the submit handler to navigate back on success
    const handleSubmit = async (e: React.FormEvent) => {
        const success = await (isEdit ? state.handleUpdate(e) : state.handleCreate(e));
        if (success) {
            navigate('/sessions');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={() => navigate('/sessions')}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
            >
                <ChevronLeft size={20} />
                Back to Sessions
            </button>

            <PageHeader
                title={isEdit ? 'Edit Session' : 'Schedule New Session'}
                description={isEdit ? 'Update session details' : 'Fill in the details to schedule a new training session'}
            />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-6">
                <div className="p-6">
                    <SessionForm
                        formData={state.formData}
                        setFormData={state.setFormData}
                        clients={state.clients}
                        coaches={state.coaches}
                        studios={state.studios}
                        rooms={state.rooms}
                        devices={state.devices}
                        error={state.error}
                        saving={state.saving}
                        isEdit={isEdit}
                        onSubmit={handleSubmit}
                        onCancel={() => navigate('/sessions')}
                    />
                </div>
            </div>

            <ConfirmDialog
                isOpen={state.showTimeChangeConfirmation}
                onClose={() => state.setShowTimeChangeConfirmation(false)}
                onConfirm={async () => {
                    const success = await state.handleConfirmTimeChange();
                    if (success) {
                        navigate('/sessions');
                    }
                }}
                title="Reschedule Warning"
                message="This session time differs from the original booking. Proceeding will update the session and notify the client by email. Are you sure?"
                confirmLabel="Confirm Reschedule"
                cancelLabel="Cancel"
                loading={state.saving}
                isDestructive={false}
            />
        </div>
    );
};

export default SessionCreatePage;
