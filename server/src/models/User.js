import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Version des sessions : incrémentée à chaque changement de mot de passe,
    // ce qui invalide tous les jetons émis auparavant (sur tous les appareils)
    tokenVersion: { type: Number, default: 0 },
    // Réinitialisation du mot de passe : seul le hash SHA-256 du jeton est stocké
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Ne jamais exposer le hash dans une réponse JSON
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.resetTokenHash;
    delete ret.resetTokenExpires;
    delete ret.tokenVersion;
    delete ret.__v;
    return ret;
  },
});

userSchema.index({ resetTokenHash: 1 }, { sparse: true });

export const User = mongoose.model('User', userSchema);
