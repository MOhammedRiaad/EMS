import React, { useState, useEffect } from 'react';
import { clientsService, type ClientProgressPhoto } from '../../services/clients.service';
import { Trash2, Calendar, Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

interface ProgressGalleryProps {
    clientId: string;
}

export const ProgressGallery: React.FC<ProgressGalleryProps> = ({ clientId }) => {
    const [photos, setPhotos] = useState<ClientProgressPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadPhotos();
    }, [clientId]);

    const loadPhotos = async () => {
        try {
            const data = await clientsService.getPhotos(clientId);
            setPhotos(data);
        } catch (error) {
            console.error('Failed to load photos', error);
        } finally {
            setLoading(false);
        }
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File size must be less than 5MB');
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            // 1. Upload file
            const { url } = await clientsService.uploadProgressPhoto(file);

            // 2. Add record
            await clientsService.addPhoto(clientId, {
                photoUrl: url,
                notes,
                type: 'front'
            });

            setNotes('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            loadPhotos();
        } catch (error) {
            console.error('Failed to add photo', error);
            setUploadError('Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (photoId: string) => {
        if (!confirm('Are you sure you want to delete this photo?')) return;
        try {
            await clientsService.deletePhoto(clientId, photoId);
            setPhotos(photos.filter(p => p.id !== photoId));
        } catch (error) {
            console.error('Failed to delete photo', error);
        }
    };

    if (loading) return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-slate-800">
            <Loader2 className="mx-auto text-blue-500 animate-spin mb-4" size={32} />
            <p className="text-gray-400">Loading progress gallery...</p>
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <div className="flex items-center gap-4 mb-8 relative">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <ImageIcon size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Progress Gallery</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Visual progress tracking over time</p>
                </div>
            </div>

            <div className="space-y-6 relative">
                {/* Upload Form */}
                {/* Upload Form */}
                <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700/50 transition-colors">
                    <div className="flex gap-4 items-end flex-wrap md:flex-nowrap">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5 uppercase tracking-wider">Add Photo</label>
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept="image/*"
                                    disabled={uploading}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <Upload size={16} />
                                    {uploading ? 'Uploading...' : 'Select Image'}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5 uppercase tracking-wider">Notes</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Front view, week 4"
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>
                    </div>
                    {uploadError && (
                        <p className="mt-2 text-sm text-red-500">{uploadError}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {photos.map(photo => (
                        <div key={photo.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                            <div className="aspect-[3/4] bg-gray-100 dark:bg-slate-950 relative overflow-hidden">
                                <img src={getImageUrl(photo.photoUrl) || ''} alt="Progress" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <button
                                        onClick={() => handleDelete(photo.id)}
                                        className="absolute top-3 right-3 p-2 bg-red-500/90 text-white rounded-full hover:bg-red-600 backdrop-blur-sm transition-colors transform translate-x-10 group-hover:translate-x-0 duration-300"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 dark:border-slate-800">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    <Calendar size={12} className="text-purple-500" />
                                    {new Date(photo.takenAt).toLocaleDateString()}
                                </div>
                                {photo.notes ? (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{photo.notes}</p>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No notes</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {photos.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-slate-600">
                            <ImageIcon size={32} />
                        </div>
                        <h3 className="text-gray-900 dark:text-white font-medium mb-1">No photos yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Upload progress photos to track visual changes</p>
                    </div>
                )}
            </div>
        </div>
    );
};
