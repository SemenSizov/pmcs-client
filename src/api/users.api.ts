import type { User } from '../types/User';
import api from './api';

const USERS_ENDPOINT = '/admin/users';

export const fetchUsers = async () => {
  return api.get<User[]>(USERS_ENDPOINT);
};

export const deleteUser = async (id: number) => {
  return api.delete(`${USERS_ENDPOINT}/${id}`);
};

export const addUser = async (user: User) => {
  return api.post(USERS_ENDPOINT, user);
};

export const updateUser = async (user: User) => {
  return api.put(`${USERS_ENDPOINT}/${user.id}`, user);
};
