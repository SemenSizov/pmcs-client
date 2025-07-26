export interface Location {
  id: number;
  name: string;
}

export interface LocationDTO {
  id: number;
  name: string;
  units: {
    id: number;
    equipmentType: { id: number; name: string };
    location: { id: number; name: string };
    serial: string;
  }[];
}
