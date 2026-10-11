import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    question: { type: String, required: true, trim: true, maxlength: 300 },
    // Choix unique pour le MVP : 4 propositions (structure extensible via "type")
    type: { type: String, enum: ['single'], default: 'single' },
    answers: {
      type: [{ type: String, required: true, trim: true, maxlength: 150 }],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 4,
        message: 'Une question doit avoir exactement 4 propositions.',
      },
    },
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, default: '', maxlength: 600 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    // Jour de publication, stocké à minuit UTC du jour calendaire de référence
    publicationDate: { type: Date },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

questionSchema.index({ status: 1, publicationDate: 1 });

// DTO public : jamais de correctAnswer ni d'explication avant la correction
questionSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    book: this.book,
    question: this.question,
    type: this.type,
    answers: this.answers,
    publicationDate: this.publicationDate,
  };
};

export const Question = mongoose.model('Question', questionSchema);
