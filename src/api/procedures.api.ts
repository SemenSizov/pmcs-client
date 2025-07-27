import type { Procedure, ProcedureDTO } from '../types/Procedure';
import api from './api';

const PROCEDURES_ENDPOINT = '/admin/procedures';

export const getProcedures = async () => {
  return api.get<ProcedureDTO[]>(PROCEDURES_ENDPOINT);
};

export const deleteProcedure = async (id: number) => {
  return api.delete(`${PROCEDURES_ENDPOINT}/${id}`);
};

export const addProcedure = async (procedure: Procedure) => {
  return api.post(PROCEDURES_ENDPOINT, procedure);
};

export const updateProcedure = async (procedure: Procedure) => {
  return api.put(`${PROCEDURES_ENDPOINT}/${procedure.id}`, procedure);
};
