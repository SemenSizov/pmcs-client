import api from './api';
import type { Fault } from '../types/Fault';

const FAULTS_ENDPOINT = '/faults';

// Отримання всіх несправностей
export const getFaults = async () => {
    return api.get<Fault[]>(FAULTS_ENDPOINT);
};

// Створення нової несправності (через FormData, бо є файл)
export const addFault = async (formData: FormData) => {
    return api.post(FAULTS_ENDPOINT, formData);
};

// Оновлення несправності
export const updateFault = async (id: number, formData: FormData) => {
    return api.put(`${FAULTS_ENDPOINT}/${id}`, formData);
};

// Усунення несправності (якщо буде окремий ендпоінт)
export const resolveFaultApi = async (formData: FormData) => {
    return api.post(`${FAULTS_ENDPOINT}/resolve`, formData);
};