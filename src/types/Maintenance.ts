export interface MaintenanceLog {
    id: number;
    unitId: number;
    faultId?: number | null; // Зв'язок з поломкою
    date: string;
    hours?: number | null;
    workDone: string;
    comment?: string | null;
    photo?: string | null; // Base64 рядок
    userId: number;
    createdAt?: string;
}

// Для форми створення
export interface CreateMaintenanceDTO {
    unitId: number;
    faultId?: number;
    date: string;
    hours?: number;
    workDone: string;
    comment?: string;
}