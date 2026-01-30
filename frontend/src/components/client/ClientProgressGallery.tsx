import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Plus, X, Trash2, Loader2, Calendar } from 'lucide-react';
import { clientPortalService } from '../../services/client-portal.service';
import { getImageUrl } from '../../utils/imageUtils';

interface ProgressPhoto {
    id: string;
    photoUrl: string;
    notes?: string;
    type?: string;
    createdAt: string;
}

const ClientProgressGallery = () => {
    const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        loadPhotos();
    }, []);

    const loadPhotos = async () => {
        try {
            const data = await clientPortalService.getProgressPhotos();
            setPhotos(data);
        } catch (err) {
            console.error('Failed to load photos', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > 5 * 1024 * 1024) { // 5MB
            setUploadError('File size must be less than 5MB');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            // 1. Upload to Storage
            const { url } = await clientPortalService.uploadProgressPhoto(file);

            // 2. Save Metadata to Profile
            await clientPortalService.addProgressPhoto({
                photoUrl: url,
                notes: '',
                type: 'other',
                takenAt: new Date()
            });

            await loadPhotos();
        } catch (err) {
            console.error('Upload failed', err);
            setUploadError('Failed to upload photo. Please try again.');
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this photo?')) return;

        try {
            await clientPortalService.deleteProgressPhoto(id);
            setPhotos(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Failed to delete photo', err);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                        <ImageIcon className="text-purple-600 dark:text-purple-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Progress Gallery</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Track your visual transformation</p>
                    </div>
                </div>
                <div>
                    <input
                        type="file"
                        id="photo-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                    />
                    <label
                        htmlFor="photo-upload"
                        className={`cursor-pointer text-sm font-medium px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        {isUploading ? 'Uploading...' : 'Add Photo'}
                    </label>
                </div>
            </div>

            {uploadError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                    {uploadError}
                </div>
            )}

            {loading ? (
                <div className="py-12 flex justify-center">
                    <Loader2 className="animate-spin text-purple-600" size={32} />
                </div>
            ) : photos.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                            <Upload size={20} />
                        </div>
                        <p className="text-sm font-medium">No progress photos yet</p>
                        <p className="text-xs mt-1">Upload your first photo to start tracking</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {photos.map(photo => (
                        <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
                            <img
                                src={getImageUrl(photo.photoUrl) || ''}
                                alt="Progress"
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <div className="text-white text-xs font-medium flex items-center gap-1 mb-1">
                                    <Calendar size={12} />
                                    {new Date(photo.createdAt).toLocaleDateString()}
                                </div>
                                <button
                                    onClick={() => handleDelete(photo.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-md hover:bg-red-600 transition-colors"
                                    title="Delete photo"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientProgressGallery;
