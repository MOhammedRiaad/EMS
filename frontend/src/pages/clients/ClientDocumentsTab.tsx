import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Image, Trash2, Download } from 'lucide-react';
import { clientsService } from '../../services/clients.service';
import './ClientDocumentsTab.css';

interface ClientDocument {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    category: 'contract' | 'waiver' | 'medical' | 'certificate' | 'other';
    createdAt: string;
    uploader: {
        firstName: string;
        lastName: string;
    };
}

interface ClientDocumentsTabProps {
    clientId: string;
}

const CATEGORY_LABELS = {
    contract: 'Contract',
    waiver: 'Waiver',
    medical: 'Medical',
    certificate: 'Certificate',
    other: 'Other',
};

import { FileUploadModal } from './modals/FileUploadModal';

export const ClientDocumentsTab: React.FC<ClientDocumentsTabProps> = ({ clientId }) => {
    const [documents, setDocuments] = useState<ClientDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    // Modal state
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [droppedFile, setDroppedFile] = useState<File | null>(null);

    const loadDocuments = useCallback(async () => {
        try {
            setLoading(true);
            const docs = await clientsService.getDocuments(clientId, selectedCategory || undefined);
            setDocuments(docs);
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    }, [clientId, selectedCategory]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const handleFileUpload = async (file: File, category: string) => {
        try {
            await clientsService.uploadDocument(clientId, file, category);
            await loadDocuments();
            setIsUploadModalOpen(false);
            setDroppedFile(null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to upload document');
            throw error; // Re-throw for modal to handle
        }
    };



    const handleDelete = async (documentId: string) => {
        try {
            await clientsService.deleteDocument(clientId, documentId);
            await loadDocuments();
            setDeleteConfirm(null);
        } catch (error) {
            alert('Failed to delete document');
        }
    };

    const handleDownload = async (documentId: string, fileName: string) => {
        try {
            const blob = await clientsService.downloadDocument(clientId, documentId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert('Failed to download document');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return <Image size={20} />;
        return <FileText size={20} />;
    };

    return (
        <div className="client-documents-tab">
            <div className="documents-header">
                <h3>Client Documents</h3>
                <div className="header-actions">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="category-filter"
                    >
                        <option value="">All Categories</option>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <button
                        className="upload-button"
                        onClick={() => {
                            setDroppedFile(null);
                            setIsUploadModalOpen(true);
                        }}
                    >
                        <Upload size={16} />
                        <span>Upload Document</span>
                    </button>
                </div>
            </div>



            {loading ? (
                <div className="loading">Loading documents...</div>
            ) : documents.length === 0 ? (
                <div className="empty-state">
                    <FileText size={48} />
                    <p>No documents uploaded yet</p>
                </div>
            ) : (
                <div className="documents-list">
                    {documents.map((doc) => (
                        <div key={doc.id} className="document-item">
                            <div className="document-icon">{getFileIcon(doc.fileType)}</div>
                            <div className="document-info">
                                <div className="document-name">{doc.fileName}</div>
                                <div className="document-meta">
                                    <span className={`category-badge ${doc.category}`}>
                                        {CATEGORY_LABELS[doc.category]}
                                    </span>
                                    <span>{formatFileSize(doc.fileSize)}</span>
                                    <span>Uploaded by {doc.uploader.firstName} {doc.uploader.lastName}</span>
                                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="document-actions">
                                <button
                                    className="action-btn download"
                                    onClick={() => handleDownload(doc.id, doc.fileName)}
                                    title="Download"
                                >
                                    <Download size={16} />
                                </button>
                                <button
                                    className="action-btn delete"
                                    onClick={() => setDeleteConfirm(doc.id)}
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Document</h3>
                        <p>Are you sure you want to delete this document? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="danger" onClick={() => handleDelete(deleteConfirm)}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <FileUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => {
                    setIsUploadModalOpen(false);
                    setDroppedFile(null);
                }}
                onUpload={handleFileUpload}
                initialFile={droppedFile}
            />
        </div>
    );
};
