import { Product } from '../types';
import { api } from './api';
export const fetchProducts = (query = '') => api<Product[]>('/products' + query);
export const fetchProductById = (id: string) => api<Product>('/products/' + encodeURIComponent(id));
