import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    author: { type: String, default: '' },
    isPublished: { type: Boolean, default: false },
    // Image importée par l'administrateur, stockée en base (le disque des hébergeurs gratuits est éphémère)
    coverData: { type: Buffer, select: false },
    coverMime: { type: String, select: false },
    coverUploadedAt: { type: Date },
  },
  { timestamps: true }
);

bookSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.coverData;
    delete ret.coverMime;
    delete ret.__v;
    return ret;
  },
});

export const Book = mongoose.model('Book', bookSchema);
