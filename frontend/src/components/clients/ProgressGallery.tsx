import React, { useState, useEffect } from 'react';
import { clientsService, type ClientProgressPhoto } from '../../services/clients.service';
import { Plus, Trash2, Calendar, Image as ImageIcon } from 'lucide-react';

interface ProgressGalleryProps {
    clientId: string;
}

export const ProgressGallery: React.FC<ProgressGalleryProps> = ({ clientId }) => {
    const [photos, setPhotos] = useState<ClientProgressPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');
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

    const handleAddPhoto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPhotoUrl) return;

        setUploading(true);
        try {
            await clientsService.addPhoto(clientId, {
                photoUrl: newPhotoUrl,
                notes,
                type: 'front' // Default for now
            });
            setNewPhotoUrl('');
            setNotes('');
            loadPhotos();
        } catch (error) {
            console.error('Failed to add photo', error);
            alert('Failed to add photo');
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

    if (loading) return <div className="text-center py-4 text-gray-400">Loading photos...</div>;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon size={20} className="text-purple-500" />
                Progress Gallery
            </h3>

            {/* Upload Form - Simple URL input for now */}
            <form onSubmit={handleAddPhoto} className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Photo URL</label>
                        <input
                            type="text"
                            value={newPhotoUrl}
                            onChange={(e) => setNewPhotoUrl(e.target.value)}
                            placeholder="https://example.com/photo.jpg"
                            className="w-full p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Notes</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Front view, week 4"
                            className="w-full p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={uploading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                        {uploading ? 'Adding...' : 'Add Photo'}
                    </button>
                </div>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map(photo => (
                    <div key={photo.id} className="group relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800">
                        <div className="aspect-[3/4] bg-gray-100 dark:bg-slate-950 relative">
                            <img src={photo.photoUrl} alt="Progress" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => handleDelete(photo.id)}
                                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="p-3">
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <Calendar size={12} />
                                {new Date(photo.takenAt).toLocaleDateString()}
                            </div>
                            {photo.notes && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{photo.notes}</p>
                            )}
                        </div>
                    </div>
                ))}
                {photos.length === 0 && (
                    <div className="col-span-full py-8 text-center text-gray-400 text-sm">
                        No progress photos yet.
                    </div>
                )}
            </div>
        </div>
    );
};
