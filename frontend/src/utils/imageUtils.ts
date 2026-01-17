/**
 * Constructs the full URL for an image stored in MinIO
 * @param path - The relative path to the image (e.g., "uploads/coaches/123.jpg" or "api/storage/file?key=uploads/...")
 * @returns Full URL to access the image
 */
export function getImageUrl(path: string | null | undefined): string | null {
    if (!path) return null;

    // If path already starts with http, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // If path is an API endpoint (e.g., "api/storage/file?key=..."), construct backend URL
    if (path.startsWith('api/') || path.startsWith('/api/')) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        // Extract base URL without /api suffix
        const baseUrl = API_URL.replace(/\/api$/, '');
        return `${baseUrl}${cleanPath}`;
    }

    // Otherwise, construct MinIO direct URL
    const MINIO_URL = import.meta.env.VITE_MINIO_URL || 'http://localhost:9000';
    const BUCKET = 'ems-assets';
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    return `${MINIO_URL}/${BUCKET}/${cleanPath}`;
}

/**
 * Gets a fallback avatar URL or initials for display
 */
export function getAvatarDisplay(user: { firstName?: string | null; lastName?: string | null; profilePhoto?: string | null }): {
    imageUrl: string | null;
    initials: string;
} {
    const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '?';
    const imageUrl = getImageUrl(user.profilePhoto);

    return { imageUrl, initials };
}
