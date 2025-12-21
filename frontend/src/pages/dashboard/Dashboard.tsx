import React from 'react';

const Dashboard: React.FC = () => {
    return (
        <div>
            <h1 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Welcome to EMS Studio</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Today's Sessions</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>12</p>
                </div>

                <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Active Clients</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>48</p>
                </div>

                <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Revenue (Month)</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>€4,250</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
