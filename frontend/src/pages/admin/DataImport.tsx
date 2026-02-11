import React, { useState, useRef } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { api } from '../../services/api';
import { Upload, Download, Users, UserCheck, AlertTriangle, CheckCircle, XCircle, FileText, Loader2 } from 'lucide-react';

type ImportType = 'clients' | 'coaches';

interface ValidationResult {
    canImport: boolean;
    requestedCount: number;
    currentCount: number;
    limit: number;
    availableSlots: number;
    importableCount: number;
    wouldExceedBy: number;
    message: string;
}

interface ImportResultRow {
    row: number;
    success: boolean;
    email: string;
    error?: string;
}

interface ImportResult {
    totalRows: number;
    successCount: number;
    failedCount: number;
    errors: ImportResultRow[];
}

const CLIENT_TEMPLATE = `firstName,lastName,email,phone,gender,dateOfBirth,notes
John,Doe,john.doe@example.com,+1234567890,male,1990-01-15,Regular client
Jane,Smith,jane.smith@example.com,+0987654321,female,1985-06-20,VIP client`;

const COACH_TEMPLATE = `firstName,lastName,email,phone,gender,preferredClientGender
Mike,Johnson,mike.j@example.com,+1122334455,male,any
Sarah,Williams,sarah.w@example.com,+5544332211,female,female`;

const DataImport: React.FC = () => {
    const [selectedType, setSelectedType] = useState<ImportType>('clients');
    const [csvContent, setCsvContent] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [importing, setImporting] = useState(false);
    const [validating, setValidating] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            setError('Please upload a CSV file');
            return;
        }

        setFileName(file.name);
        setError(null);
        setValidation(null);
        setImportResult(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setCsvContent(content);
            validateImport(content);
        };
        reader.readAsText(file);
    };

    const validateImport = async (content: string) => {
        setValidating(true);
        setError(null);
        try {
            const response = await api.post(`/import/${selectedType}/validate`, {
                csvContent: content
            });
            setValidation(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Validation failed');
        } finally {
            setValidating(false);
        }
    };

    const handleImport = async (importWithinLimit = false) => {
        if (!csvContent) return;

        setImporting(true);
        setError(null);
        try {
            const response = await api.post(`/import/${selectedType}`, {
                csvContent,
                importWithinLimit
            });
            setImportResult(response.data.result);
            setShowResultModal(true);
            // Clear the form after successful import
            setCsvContent('');
            setFileName('');
            setValidation(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err: any) {
            if (err.response?.data?.validation) {
                setValidation(err.response.data.validation);
            }
            setError(err.response?.data?.message || 'Import failed');
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        const template = selectedType === 'clients' ? CLIENT_TEMPLATE : COACH_TEMPLATE;
        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedType}_import_template.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const rowCount = csvContent ? csvContent.trim().split('\n').length - 1 : 0; // -1 for header

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader
                title="Data Import"
                description="Import clients and coaches from CSV files"
            />

            {/* Import Type Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Select Import Type
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => {
                            setSelectedType('clients');
                            setCsvContent('');
                            setValidation(null);
                            setError(null);
                        }}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${selectedType === 'clients'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Users size={24} className={selectedType === 'clients' ? 'text-blue-500' : 'text-gray-400'} />
                        <div className="text-left">
                            <div className={`font-medium ${selectedType === 'clients' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                Clients
                            </div>
                            <div className="text-sm text-gray-500">Import customer data</div>
                        </div>
                    </button>
                    <button
                        onClick={() => {
                            setSelectedType('coaches');
                            setCsvContent('');
                            setValidation(null);
                            setError(null);
                        }}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${selectedType === 'coaches'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <UserCheck size={24} className={selectedType === 'coaches' ? 'text-blue-500' : 'text-gray-400'} />
                        <div className="text-left">
                            <div className={`font-medium ${selectedType === 'coaches' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                Coaches
                            </div>
                            <div className="text-sm text-gray-500">Import trainer data</div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Template Download */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Step 1: Download Template
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Download the CSV template, fill in your data, then upload it below.
                </p>
                <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                    <Download size={18} />
                    Download {selectedType === 'clients' ? 'Clients' : 'Coaches'} Template
                </button>
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Template columns:</div>
                    <code className="text-xs text-gray-700 dark:text-gray-300">
                        {selectedType === 'clients'
                            ? 'firstName, lastName, email, phone, gender, dateOfBirth, notes'
                            : 'firstName, lastName, email, phone, bio, specializations'
                        }
                    </code>
                </div>

                {/* Processing Info */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <CheckCircle size={16} />
                        How we handle your data:
                    </h4>
                    <ul className="text-xs space-y-1.5 text-blue-800 dark:text-blue-400">
                        <li>• <strong>Missing Email?</strong> We generate a unique dummy email automatically.</li>
                        <li>• <strong>No Last Name?</strong> If First Name has multiple words (e.g. "John Doe"), we split it automatically.</li>
                        <li>• <strong>Missing Studio?</strong> Records are assigned to the first active studio for your account.</li>
                    </ul>
                </div>
            </div>

            {/* File Upload */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Step 2: Upload CSV File
                </h3>
                <div
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    {fileName ? (
                        <div className="flex items-center justify-center gap-3">
                            <FileText size={24} className="text-blue-500" />
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{fileName}</span>
                            <span className="text-gray-500">({rowCount} rows)</span>
                        </div>
                    ) : (
                        <>
                            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-600 dark:text-gray-400">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-sm text-gray-500">CSV files only</p>
                        </>
                    )}
                </div>
            </div>

            {/* Validation Result */}
            {(validating || validation) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Step 3: Review & Import
                    </h3>

                    {validating ? (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 size={20} className="animate-spin" />
                            Validating...
                        </div>
                    ) : validation && (
                        <>
                            <div className={`p-4 rounded-lg mb-4 ${validation.canImport
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                                }`}>
                                <div className="flex items-start gap-3">
                                    {validation.canImport ? (
                                        <CheckCircle size={20} className="text-green-500 mt-0.5" />
                                    ) : (
                                        <AlertTriangle size={20} className="text-yellow-500 mt-0.5" />
                                    )}
                                    <div>
                                        <p className={`font-medium ${validation.canImport ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                                            {validation.message}
                                        </p>
                                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                                            <div>
                                                <span className="text-gray-500">Current:</span>
                                                <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">{validation.currentCount}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Limit:</span>
                                                <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">{validation.limit}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Can import:</span>
                                                <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">{validation.importableCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {validation.canImport ? (
                                    <button
                                        onClick={() => handleImport(false)}
                                        disabled={importing}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                        Import All {validation.requestedCount} Records
                                    </button>
                                ) : (
                                    <>
                                        {validation.importableCount > 0 && (
                                            <button
                                                onClick={() => handleImport(true)}
                                                disabled={importing}
                                                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                                Import First {validation.importableCount} Records
                                            </button>
                                        )}
                                        <a
                                            href="/admin/settings"
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                        >
                                            Upgrade Plan
                                        </a>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6 flex items-center gap-2">
                    <XCircle size={20} />
                    {error}
                </div>
            )}

            {/* Import Result Modal */}
            <Modal
                isOpen={showResultModal}
                onClose={() => setShowResultModal(false)}
                title="Import Complete"
            >
                {importResult && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{importResult.totalRows}</div>
                                <div className="text-sm text-gray-500">Total Rows</div>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-600">{importResult.successCount}</div>
                                <div className="text-sm text-gray-500">Imported</div>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                                <div className="text-2xl font-bold text-red-600">{importResult.failedCount}</div>
                                <div className="text-sm text-gray-500">Failed</div>
                            </div>
                        </div>

                        {importResult.errors.length > 0 && (
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Errors:</h4>
                                <div className="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                                    {importResult.errors.map((err, i) => (
                                        <div key={i} className="text-sm text-red-600 dark:text-red-400 py-1">
                                            Row {err.row}: {err.error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setShowResultModal(false)}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DataImport;
