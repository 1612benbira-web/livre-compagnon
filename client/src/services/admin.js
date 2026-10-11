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

// Livres et QR codes
adminService.book = (id) => unwrap(api.get(`/books/${id}`));
adminService.createBook = (body) => unwrap(api.post('/books', body));
adminService.updateBook = (id, body) => unwrap(api.put(`/books/${id}`, body));
adminService.deleteBook = (id) => unwrap(api.delete(`/books/${id}`));
adminService.bookQr = (id) => unwrap(api.get(`/books/${id}/qr`));
adminService.downloadQr = (id, format) => api.get(`/books/${id}/qr`, { params: { format }, responseType: 'blob' });
adminService.uploadCover = (id, blob) =>
  unwrap(api.put(`/books/${id}/cover`, blob, { headers: { 'Content-Type': blob.type } }));
adminService.deleteCover = (id) => unwrap(api.delete(`/books/${id}/cover`));
