import { api } from './api';

export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    sku?: string;
    category: string;
    isActive: boolean;
    stockQuantity?: number; // Merged from stock endpoint
}

export interface CreateProductDto {
    name: string;
    description?: string;
    price: number;
    sku?: string;
    category?: string;
    isActive?: boolean;
}

export interface UpdateProductDto extends Partial<CreateProductDto> { }

export interface CreateSaleItem {
    productId: string;
    quantity: number;
}

export interface CreateSalePayload {
    studioId: string;
    clientId?: string;
    paymentMethod: string;
    items: CreateSaleItem[];
}

export const retailService = {
    // Products
    getProducts: async () => {
        const response = await api.get<Product[]>('/retail/products');
        return response.data;
    },

    getProduct: async (id: string) => {
        const response = await api.get<Product>(`/retail/products/${id}`);
        return response.data;
    },

    createProduct: async (data: CreateProductDto) => {
        const response = await api.post<Product>('/retail/products', data);
        return response.data;
    },

    updateProduct: async (id: string, data: UpdateProductDto) => {
        const response = await api.put<Product>(`/retail/products/${id}`, data);
        return response.data;
    },

    deleteProduct: async (id: string) => {
        await api.delete(`/retail/products/${id}`);
    },

    // Stock
    getStudioStock: async (studioId: string) => {
        const response = await api.get<Product[]>(`/retail/stock/${studioId}`);
        return response.data;
    },

    updateStock: async (studioId: string, productId: string, quantity: number, operation: 'set' | 'add' | 'subtract') => {
        const response = await api.post(`/retail/stock/${studioId}/product/${productId}`, { quantity, operation });
        return response.data;
    },

    // Sales
    createSale: async (data: CreateSalePayload) => {
        const response = await api.post('/retail/sales', data);
        return response.data;
    }
};
