export type Role = 'admin' | 'user';

export type User = {
  _id: string;
  email: string;
  name?: string;
  role: Role;
  homes?: string[];
  createdAt?: string;
};

export type UsersListResponse = {
  users: User[];
  ok: boolean;
};
