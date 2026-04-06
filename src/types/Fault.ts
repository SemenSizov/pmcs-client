export interface Fault {
    id: number;
    unitId: number;
    reportDate: string; // ISO дата (YYYY-MM-DD)
    description: string;
    reportPhoto?: string | null; // Base64 рядок для відображення
    isResolved: boolean;
    resolvedDate?: string | null;
    resolutionComment?: string | null;
    resolvedPhoto?: string | null; // Base64 рядок для відображення
    reportedBy: number;
    resolvedBy?: number | null;
    createdAt?: string;
}

// Для створення через форму (без ID та фото, бо воно йде окремо у FormData)
export interface CreateFaultDTO {
    unitId: number;
    reportDate: string;
    description: string;
}