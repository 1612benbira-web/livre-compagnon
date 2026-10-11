import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    selectedAnswer: { type: Number, required: true, min: 0, max: 3 },
    // Calculé uniquement par le backend
    isCorrect: { type: Boolean, required: true },
    answeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Une seule tentative par utilisateur et par question
answerSchema.index({ user: 1, question: 1 }, { unique: true });
answerSchema.index({ user: 1, answeredAt: -1 });

export const Answer = mongoose.model('Answer', answerSchema);
