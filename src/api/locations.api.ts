import type { Location, LocationDTO } from '../types/Location';
import api from './api';

const LOCATIONS_ENDPOINT = '/admin/locations';

export const getLocations = async () => {
  return api.get<LocationDTO[]>(LOCATIONS_ENDPOINT);
};

export const deleteLocation = async (id: number) => {
  return api.delete(`${LOCATIONS_ENDPOINT}/${id}`);
};

export const addLocation = async (location: Location) => {
  return api.post(LOCATIONS_ENDPOINT, location);
};

export const updateLocation = async (location: Location) => {
  return api.put(`${LOCATIONS_ENDPOINT}/${location.id}`, location);
};
