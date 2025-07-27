import type { EquipmentUnit, EquipmentUnitDTO } from '../types/EquipmentUnit';
import api from './api';

const EQUIPMENT_UNITS_ENDPOINT = '/admin/equipment-units';

export const getEquipmentUnits = async () => {
  return api.get<EquipmentUnitDTO[]>(EQUIPMENT_UNITS_ENDPOINT);
};

export const deleteEquipmentUnit = async (id: number) => {
  return api.delete(`${EQUIPMENT_UNITS_ENDPOINT}/${id}`);
};

export const addEquipmentUnit = async (equipmentUnit: EquipmentUnit) => {
  return api.post(EQUIPMENT_UNITS_ENDPOINT, equipmentUnit);
};

export const updateEquipmentUnit = async (equipmentUnit: EquipmentUnit) => {
  return api.put(`${EQUIPMENT_UNITS_ENDPOINT}/${equipmentUnit.id}`, equipmentUnit);
};
