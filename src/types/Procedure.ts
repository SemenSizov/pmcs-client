export interface Procedure {
  id: number;
  name: string;
  type: 'hours' | 'period';
  hours?: number;
  period?: string;
  equipment_type_id: number;
}

export interface ProcedureDTO {
  id: number;
  name: string;
  type: 'hours' | 'period';
  hours?: number;
  period?: 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  equipmentType: {
    id: number;
    name: string;
  };
}