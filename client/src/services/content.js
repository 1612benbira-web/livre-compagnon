import { api, unwrap } from './api.js';

export const bookService = {
  list: () => unwrap(api.get('/books')),
  get: (idOrSlug) => unwrap(api.get(`/books/${encodeURIComponent(idOrSlug)}`)),
};

export const questionService = {
  today: (book) => unwrap(api.get('/questions/today', { params: book ? { book } : {} })),
};

export const answerService = {
  submit: (questionId, selectedAnswer) => unwrap(api.post('/answers', { questionId, selectedAnswer })),
  get: (id) => unwrap(api.get(`/answers/${id}`)),
  history: (page = 1, limit = 10) => unwrap(api.get('/answers/history', { params: { page, limit } })),
  progress: () => unwrap(api.get('/answers/progress')),
};
