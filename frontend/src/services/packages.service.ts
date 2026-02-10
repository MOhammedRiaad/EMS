const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export interface Package {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    totalSessions: number;
    price: number;
    validityDays: number;
    lowSessionThreshold?: number;
    isActive: boolean;
    createdAt: string;
}

export interface ClientPackage {
    id: string;
    tenantId: string;
    clientId: string;
    packageId: string;
    purchaseDate: string;
    expiryDate: string;
    sessionsUsed: number;
    sessionsRemaining: number;
    status: 'active' | 'expired' | 'depleted';
    paymentMethod: string;
    paymentNotes: string;
    paidAt: string;
    package: Package;
    client: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export interface Transaction {
    id: string;
    type: 'income' | 'expense' | 'refund';
    category: string;
    amount: number;
    runningBalance: number;
    description: string;
    createdAt: string;
}

export interface CreatePackageDto {
    name: string;
    description?: string;
    totalSessions: number;
    price: number;
    validityDays?: number;
    lowSessionThreshold?: number;
}

export interface AssignPackageDto {
    clientId: string;
    packageId: string;
    paymentMethod?: string;
    paymentNotes?: string;
}

export const packagesService = {
    // Packages
    getAllPackages: async (includeInactive = false): Promise<Package[]> => {
        const response = await fetch(`${API_URL}/packages?includeInactive=${includeInactive}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch packages');
        return response.json();
    },

    createPackage: async (data: CreatePackageDto): Promise<Package> => {
        const response = await fetch(`${API_URL}/packages`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create package');
        return response.json();
    },

    updatePackage: async (id: string, data: Partial<CreatePackageDto>): Promise<Package> => {
        const response = await fetch(`${API_URL}/packages/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update package');
        return response.json();
    },

    archivePackage: async (id: string): Promise<Package> => {
        const response = await fetch(`${API_URL}/packages/${id}/archive`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to archive package');
        return response.json();
    },

    // Client Packages
    getClientPackages: async (clientId: string): Promise<ClientPackage[]> => {
        const response = await fetch(`${API_URL}/client-packages/client/${clientId}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch client packages');
        return response.json();
    },

    getExpiringPackages: async (days = 7): Promise<ClientPackage[]> => {
        const response = await fetch(`${API_URL}/client-packages/expiring?days=${days}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch expiring packages');
        return response.json();
    },

    assignPackage: async (data: AssignPackageDto): Promise<ClientPackage> => {
        const response = await fetch(`${API_URL}/client-packages`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to assign package');
        return response.json();
    },

    useSession: async (id: string): Promise<ClientPackage> => {
        const response = await fetch(`${API_URL}/client-packages/${id}/use-session`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to use session');
        return response.json();
    },

    renewPackage: async (id: string, newPackageId?: string, paymentMethod?: string): Promise<ClientPackage> => {
        const response = await fetch(`${API_URL}/client-packages/${id}/renew`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ newPackageId, paymentMethod })
        });
        if (!response.ok) throw new Error('Failed to renew package');
        return response.json();
    },

    adjustSessions: async (id: string, adjustment: number, reason: string): Promise<ClientPackage> => {
        const response = await fetch(`${API_URL}/client-packages/${id}/adjust-sessions`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ adjustment, reason })
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to adjust sessions');
        }
        return response.json();
    },

    // Transactions
    getTransactions: async (): Promise<Transaction[]> => {
        const response = await fetch(`${API_URL}/transactions`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch transactions');
        return response.json();
    },

    getBalance: async (): Promise<{ balance: number }> => {
        const response = await fetch(`${API_URL}/transactions/balance`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch balance');
        return response.json();
    },

    getSummary: async (): Promise<{ income: number; expense: number; refund: number; net: number }> => {
        const response = await fetch(`${API_URL}/transactions/summary`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch summary');
        return response.json();
    },

    createTransaction: async (data: { type: string; category: string; amount: number; description?: string }): Promise<Transaction> => {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create transaction');
        return response.json();
    }
};
