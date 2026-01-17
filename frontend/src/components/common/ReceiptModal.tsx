import React, { useRef, useState } from 'react';
import Modal from './Modal';
import Receipt from './Receipt';
import { Printer, X } from 'lucide-react';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiptData: {
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
    } | null;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receiptData }) => {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [printing, setPrinting] = useState(false);

    const handlePrint = () => {
        if (!receiptRef.current) return;

        setPrinting(true);

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print the receipt');
            setPrinting(false);
            return;
        }

        const receiptHtml = receiptRef.current.innerHTML;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${receiptData?.receiptNumber}</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        display: flex;
                        justify-content: center;
                    }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${receiptHtml}
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        setPrinting(false);
    };

    if (!receiptData) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Receipt">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Receipt Preview */}
                <div style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    marginBottom: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    <Receipt ref={receiptRef} data={receiptData} />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handlePrint}
                        disabled={printing}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            borderRadius: 'var(--border-radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 500
                        }}
                    >
                        <Printer size={18} />
                        {printing ? 'Preparing...' : 'Print Receipt'}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--border-radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <X size={18} />
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ReceiptModal;
