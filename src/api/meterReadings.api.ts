import api from './api';
import type { MeterReading } from '../types/MeterReading';

const METERS_ENDPOINT = '/meters'

export const getMeterReadings = (filters = {}) =>
  api.get<MeterReading[]>(METERS_ENDPOINT, { params: filters });

export const addMeterReading = (data: Omit<MeterReading, 'id' | 'location' | 'unit'>) =>
  api.post(METERS_ENDPOINT, data);