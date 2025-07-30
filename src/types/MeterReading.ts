export interface MeterReading {
  id: number;
  date: string;
  location_id: number;
  unitId: number;
  hours: number;
  location: { id: number; name: string };
  unit: { id: number; name: string };
}

