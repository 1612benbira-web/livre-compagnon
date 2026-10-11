import { api, unwrap } from './api.js';

const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));

export const adminService = {
  dashboard: () => unwrap(api.get('/admin/dashboard')),
  users: (params) => unwrap(api.get('/admin/users', { params: clean(params) })),
  answers: (params) => unwrap(api.get('/admin/answers', { params: clean(params) })),
  books: () => unwrap(api.get('/books')),
  questions: (params) => unwrap(api.get('/questions', { params: clean(params) })),
  question: (id) => unwrap(api.get(`/questions/${id}`)),
  createQuestion: (body) => unwrap(api.post('/questions', body)),
  updateQuestion: (id, body) => unwrap(api.put(`/questions/${id}`, body)),
  deleteQuestion: (id) => unwrap(api.delete(`/questions/${id}`)),
};
