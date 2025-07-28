import api from './api';
import type { MeterReading } from '../types/MeterReading';

const METERS_ENDPOINT = '/meters-readings';

export const getMeterReadings = (filters = {}) =>
  api.get<{ items: MeterReading[]; total: number }>(METERS_ENDPOINT, { params: filters });

export const addMeterReading = (data: Omit<MeterReading, 'id' | 'location' | 'unit'>) =>
  api.post(METERS_ENDPOINT, data);

export const getLastReading = async (unitId: string) => api.get(`${METERS_ENDPOINT}/last/${unitId}`);
