export interface MeterReading {
  id: number;
  date: string;
  location_id: number;
  unit_id: number;
  hours: number;
  location: { id: number; name: string };
  unit: { id: number; name: string };
}
