import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Image, AlertCircle } from 'lucide-react';
import './FileUploadModal.css';

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File, category: string) => Promise<void>;
    initialFile?: File | null;
}

const CATEGORIES = [
    { id: 'contract', label: 'Contract' },
    { id: 'waiver', label: 'Waiver' },
    { id: 'medical', label: 'Medical' },
    { id: 'certificate', label: 'Certificate' },
    { id: 'other', label: 'Other' },
];

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
    isOpen,
    onClose,
    onUpload,
    initialFile,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState<string>('other');
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialFile) {
                setFile(initialFile);
                setError(null);
            } else {
                setFile(null);
                setCategory('other');
                setError(null);
            }
        }
    }, [isOpen, initialFile]);

    const validateFile = (file: File): string | null => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
        ];
        if (!allowedTypes.includes(file.type)) {
            return 'Only PDF and image files (JPG, PNG) are allowed.';
        }
        if (file.size > 10 * 1024 * 1024) {
            return 'File size must be less than 10MB.';
        }
        return null;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const validationError = validateFile(selectedFile);
            if (validationError) {
                setError(validationError);
                setFile(null);
            } else {
                setFile(selectedFile);
                setError(null);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            const validationError = validateFile(droppedFile);
            if (validationError) {
                setError(validationError);
            } else {
                setFile(droppedFile);
                setError(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        try {
            setUploading(true);
            await onUpload(file, category);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="file-upload-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Upload Document</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div className="error-message">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Category</label>
                            <div className="category-grid">
                                {CATEGORIES.map((cat) => (
                                    <label
                                        key={cat.id}
                                        className={`category-option ${category === cat.id ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="category"
                                            value={cat.id}
                                            checked={category === cat.id}
                                            onChange={(e) => setCategory(e.target.value)}
                                        />
                                        {cat.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>File</label>
                            {!file ? (
                                <div
                                    className={`drop-area ${isDragging ? 'dragging' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <Upload size={32} />
                                    <p>Drag and drop file here</p>
                                    <span>or</span>
                                    <label className="browse-btn">
                                        Browse Files
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleFileSelect}
                                            hidden
                                        />
                                    </label>
                                    <span className="file-hint">PDF, JPG, PNG (max 10MB)</span>
                                </div>
                            ) : (
                                <div className="selected-file">
                                    <div className="file-icon">
                                        {file.type.includes('image') ? (
                                            <Image size={24} />
                                        ) : (
                                            <FileText size={24} />
                                        )}
                                    </div>
                                    <div className="file-details">
                                        <span className="file-name">{file.name}</span>
                                        <span className="file-size">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="remove-file"
                                        onClick={() => setFile(null)}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="upload-submit-btn"
                            disabled={!file || uploading}
                        >
                            {uploading ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
