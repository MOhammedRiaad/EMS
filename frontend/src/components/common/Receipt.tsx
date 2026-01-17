import React, { forwardRef } from 'react';

interface ReceiptData {
    receiptNumber: string;
    date: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    packageName: string;
    sessions: number;
    validityDays: number;
    expiryDate: string;
    amount: number;
    paymentMethod: string;
    studioName?: string;
    studioAddress?: string;
    studioPhone?: string;
}

interface ReceiptProps {
    data: ReceiptData;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ data }, ref) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    return (
        <div
            ref={ref}
            style={{
                width: '300px',
                padding: '20px',
                fontFamily: 'monospace',
                fontSize: '12px',
                backgroundColor: 'white',
                color: 'black'
            }}
        >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                    {data.studioName || 'EMS Studio'}
                </div>
                {data.studioAddress && <div>{data.studioAddress}</div>}
                {data.studioPhone && <div>Tel: {data.studioPhone}</div>}
            </div>

            <div style={{ borderTop: '1px dashed #000', marginBottom: '10px' }} />

            {/* Receipt Info */}
            <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Receipt #:</span>
                    <span>{data.receiptNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Date:</span>
                    <span>{new Date(data.date).toLocaleDateString()}</span>
                </div>
            </div>

            <div style={{ borderTop: '1px dashed #000', marginBottom: '10px' }} />

            {/* Client Info */}
            <div style={{ marginBottom: '15px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Client:</div>
                <div>{data.clientName}</div>
                {data.clientEmail && <div>{data.clientEmail}</div>}
                {data.clientPhone && <div>{data.clientPhone}</div>}
            </div>

            <div style={{ borderTop: '1px dashed #000', marginBottom: '10px' }} />

            {/* Package Details */}
            <div style={{ marginBottom: '15px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Package Details:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{data.packageName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Sessions:</span>
                    <span>{data.sessions}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Valid for:</span>
                    <span>{data.validityDays} days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Expires:</span>
                    <span>{new Date(data.expiryDate).toLocaleDateString()}</span>
                </div>
            </div>

            <div style={{ borderTop: '1px dashed #000', marginBottom: '10px' }} />

            {/* Payment */}
            <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                    <span>TOTAL:</span>
                    <span>{formatCurrency(data.amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Payment Method:</span>
                    <span style={{ textTransform: 'capitalize' }}>{data.paymentMethod}</span>
                </div>
            </div>

            <div style={{ borderTop: '1px dashed #000', marginBottom: '15px' }} />

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '10px' }}>
                <div style={{ marginBottom: '5px' }}>Thank you for your purchase!</div>
                <div>This receipt is your proof of payment.</div>
                <div style={{ marginTop: '10px' }}>* * * * *</div>
            </div>
        </div>
    );
});

Receipt.displayName = 'Receipt';

export default Receipt;
