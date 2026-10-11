import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    author: { type: String, default: '' },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Book = mongoose.model('Book', bookSchema);
