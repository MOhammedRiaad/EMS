/**
 * Simple inline toast helper (no external dependencies)
 */
export const toast = {
    success: (msg: string) => {
        const el = document.createElement('div');
        el.className = 'fixed top-4 right-4 z-[9999] bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse';
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    },
    error: (msg: string) => {
        const el = document.createElement('div');
        el.className = 'fixed top-4 right-4 z-[9999] bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse';
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }
};

export default toast;
