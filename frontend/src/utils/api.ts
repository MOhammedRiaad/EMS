/**
 * common/api.ts
 * Standardized API utilities
 */

export class ApiError extends Error {
    statusCode?: number;
    error?: string;
    conflicts?: any[];

    constructor(message: string, statusCode?: number, error?: string, conflicts?: any[]) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.error = error;
        this.conflicts = conflicts;
    }
}

export const handleApiError = async (response: Response, defaultMessage: string = 'Request failed'): Promise<never> => {
    let errorMessage = defaultMessage;
    let errorData: any = {};

    try {
        errorData = await response.json();
    } catch {
        // If JSON parsing fails, use status text
        throw new ApiError(`${defaultMessage}: ${response.statusText}`, response.status);
    }

    if (typeof errorData.message === 'string') {
        errorMessage = errorData.message;
    } else if (Array.isArray(errorData.message)) {
        errorMessage = errorData.message.join('. ');
    } else if (errorData.message && typeof errorData.message === 'object') {
        // Handle nested message objects (e.g. { message: { message: "Error text", ... } })
        if (errorData.message.message) {
            if (typeof errorData.message.message === 'string') {
                errorMessage = errorData.message.message;
            } else if (Array.isArray(errorData.message.message)) {
                errorMessage = errorData.message.message.join('. ');
            } else {
                errorMessage = JSON.stringify(errorData.message);
            }
        } else {
            errorMessage = JSON.stringify(errorData.message);
        }
    }

    throw new ApiError(errorMessage, errorData.statusCode || response.status, errorData.error, errorData.conflicts);
};
