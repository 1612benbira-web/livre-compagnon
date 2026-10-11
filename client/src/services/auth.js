import { api, unwrap } from './api.js';

export const authService = {
  me: () => unwrap(api.get('/auth/me')),
  login: (body) => unwrap(api.post('/auth/login', body)),
  register: (body) => unwrap(api.post('/auth/register', body)),
  logout: () => unwrap(api.post('/auth/logout')),
  updateProfile: (body) => unwrap(api.patch('/auth/profile', body)),
  changePassword: (body) => unwrap(api.put('/auth/password', body)),
  deleteAccount: (password) => unwrap(api.delete('/auth/account', { data: { password } })),
};
