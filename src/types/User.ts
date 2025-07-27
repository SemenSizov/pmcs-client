export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface UserPayload {
  email: string;
  name?: string;
  role?: 'admin' | 'user';
  exp?: number; // для перевірки токену на клієнті (JWT expiration)
  [key: string]: any; // якщо є додаткові поля
}