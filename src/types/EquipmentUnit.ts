import type { EquipmentType } from "./EquipmentType";
import type { Location } from "./Location";

export interface EquipmentUnitDTO {
  id: string;
  serial: string;
  equipmentType: EquipmentType;
  location: Location;
}

export interface EquipmentUnit {
  id: string;
  serial: string;
  equipmentTypeId: string;
  locationId: string
}
