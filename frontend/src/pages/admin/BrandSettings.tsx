import React, { useEffect, useState } from 'react';
import { brandingService } from '../../services/branding.service';
import { useAuth } from '../../contexts/AuthContext';
import { Palette, Upload, Save, Loader2, Link as LinkIcon } from 'lucide-react';

const BrandSettings: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoUrl, setLogoUrl] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#4f46e5'); // Default indigo-600
    const [secondaryColor, setSecondaryColor] = useState('#ec4899'); // Default pink-500
    const [tenantId, setTenantId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadSettings();
        }
    }, [user]);

    const loadSettings = async () => {
        try {
            if (!user?.tenantId) {
                console.error('No tenant ID found');
                return;
            }
            setTenantId(user.tenantId);

            const settings = await brandingService.getSettings(user.tenantId);
            if (settings.branding) {
                if (settings.branding.logoUrl) setLogoUrl(settings.branding.logoUrl);
                if (settings.branding.primaryColor) setPrimaryColor(settings.branding.primaryColor);
                if (settings.branding.secondaryColor) setSecondaryColor(settings.branding.secondaryColor);
            }
        } catch (error) {
            console.error('Failed to load branding settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!tenantId) return;
        setSaving(true);
        try {
            await brandingService.updateBranding(tenantId, {
                logoUrl,
                primaryColor,
                secondaryColor
            });

            // Apply CSS variables immediately
            document.documentElement.style.setProperty('--color-primary', primaryColor);
            document.documentElement.style.setProperty('--color-secondary', secondaryColor);

            alert('Branding settings saved!');
        } catch (error) {
            console.error('Failed to save branding', error);
            alert('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in">
            <header className="flex justify-between items-center border-b pb-6 border-gray-200 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Palette className="text-indigo-600" />
                        Brand Customization
                    </h1>
                    <p className="text-gray-500 mt-1">Customize the look and feel of your studio portal.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/30"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo Section */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Upload size={20} className="text-purple-500" />
                        Studio Logo
                    </h2>

                    <div className="space-y-4">
                        <div className="aspect-video bg-gray-50 dark:bg-slate-950 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-800 flex items-center justify-center relative overflow-hidden group">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Studio Logo" className="h-24 object-contain" onError={(e) => (e.currentTarget.src = '')} />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <Upload size={32} className="mx-auto mb-2 opacity-50" />
                                    <span className="text-sm">No logo uploaded</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Logo URL</label>
                            <div className="relative">
                                <LinkIcon size={16} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                    placeholder="https://example.com/logo.png"
                                    className="w-full pl-10 p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Recommended height: 60px. Supports PNG, SVG.</p>
                        </div>
                    </div>
                </div>

                {/* Colors Section */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Palette size={20} className="text-pink-500" />
                        Theme Colors
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Primary Color</label>
                            <div className="flex gap-4 items-center">
                                <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="h-12 w-12 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                                />
                                <input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="flex-1 p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-mono uppercase dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Secondary Color</label>
                            <div className="flex gap-4 items-center">
                                <input
                                    type="color"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="h-12 w-12 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                                />
                                <input
                                    type="text"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="flex-1 p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-mono uppercase dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Live Preview</h3>
                        <div className="flex gap-3">
                            <button
                                style={{ backgroundColor: primaryColor }}
                                className="px-4 py-2 text-white rounded-lg text-sm font-medium shadow-md transition-transform hover:scale-105"
                            >
                                Primary Button
                            </button>
                            <button
                                style={{ backgroundColor: secondaryColor }}
                                className="px-4 py-2 text-white rounded-lg text-sm font-medium shadow-md transition-transform hover:scale-105"
                            >
                                Secondary Button
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandSettings;
