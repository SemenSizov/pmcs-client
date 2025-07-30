import type { EquipmentUnitDTO } from "./EquipmentUnit";
import type { ProcedureDTO } from "./Procedure";

export type LogEntryFilter = {
  unitId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
  locationId?: number;
  procedureId?: number;
};

export type LogEntryDTO = {
    id: number;
    date: string;
    hours: number | null;
    procedure: ProcedureDTO;
    unit: EquipmentUnitDTO;
};

export type LogEntryCreate = {
    date: string; // ISO string 'YYYY-MM-DD'
    hours: number | null;
    procedureId: number;
    unitId: number;
    userId: number;
}