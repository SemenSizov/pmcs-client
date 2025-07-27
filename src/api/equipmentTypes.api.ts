import type { EquipmentType } from '../types/EquipmentType';
import api from './api';

const EQUIPMENT_TYPES_ENDPOINT = '/admin/equipment-types';

export const getEquipmentTypes = async () => {
  return api.get<EquipmentType[]>(EQUIPMENT_TYPES_ENDPOINT);
};

export const deleteEquipmentType = async (id: number) => {
  return api.delete(`${EQUIPMENT_TYPES_ENDPOINT}/${id}`);
};

export const addEquipmentType = async (equipmentType: EquipmentType) => {
  return api.post(EQUIPMENT_TYPES_ENDPOINT, equipmentType);
};

export const updateEquipmentType = async (equipmentType: EquipmentType) => {
  return api.put(`${EQUIPMENT_TYPES_ENDPOINT}/${equipmentType.id}`, equipmentType);
};
