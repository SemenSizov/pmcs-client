import api from './api';
import type { MaintenanceLog } from '../types/Maintenance';

const MAINTENANCE_ENDPOINT = '/maintenance';

// Отримання історії робіт
export const getMaintenanceLogs = async () => {
    return api.get<MaintenanceLog[]>(MAINTENANCE_ENDPOINT);
};

// Додавання позапланової роботи (теж через FormData)
export const addMaintenanceLog = async (formData: FormData) => {
    return api.post(MAINTENANCE_ENDPOINT, formData);
};