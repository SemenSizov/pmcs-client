import type { LogEntryCreate, LogEntryDTO, LogEntryFilter } from '../types/LogEntry';
import api from './api';

const LOG_ENTRIES_ENDPOINT = '/log-entries';

export const getLogEntries = (filters: LogEntryFilter = {}) =>
  api.get<{ items: LogEntryDTO[]; total: number }>(LOG_ENTRIES_ENDPOINT, { params: filters });

export const addLogEntry = (data: LogEntryCreate) => api.post(LOG_ENTRIES_ENDPOINT, data);

export const getLastLogEntry = async (unitId: string) => api.get(`${LOG_ENTRIES_ENDPOINT}/last/${unitId}`);
