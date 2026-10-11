// Usage : ADMIN_EMAIL=... ADMIN_FIRST_NAME=... ADMIN_PASSWORD=... npm run create-admin
// Le mot de passe n'est jamais codé en dur : il doit être fourni explicitement.
// Si le compte existe déjà, il est promu administrateur sans changer son mot de passe,
// sauf avec ADMIN_RESET_PASSWORD=1.
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { registerSchema } from '../src/validators/auth.validators.js';

const { ADMIN_EMAIL, ADMIN_FIRST_NAME = 'Admin', ADMIN_PASSWORD } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL et ADMIN_PASSWORD sont requis.');
  process.exit(1);
}

const parsed = registerSchema.safeParse({
  firstName: ADMIN_FIRST_NAME,
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  confirmPassword: ADMIN_PASSWORD,
});
if (!parsed.success) {
  console.error(parsed.error.issues.map((i) => i.message).join('\n'));
  process.exit(1);
}

await connectDB();
const { firstName, email, password } = parsed.data;
const existing = await User.findOne({ email });
if (existing) {
  // Compte déjà présent : on le promeut, mais on ne touche à son mot de passe que sur demande explicite
  existing.role = 'admin';
  let message = `Compte existant promu administrateur : ${email}.`;
  if (process.env.ADMIN_RESET_PASSWORD === '1') {
    existing.passwordHash = await bcrypt.hash(password, 12);
    message += ' Mot de passe RÉINITIALISÉ avec ADMIN_PASSWORD.';
  } else {
    message += ' Mot de passe INCHANGÉ (ADMIN_PASSWORD ignoré). Pour le réinitialiser : ADMIN_RESET_PASSWORD=1.';
  }
  await existing.save();
  console.log(message);
} else {
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ firstName, email, passwordHash, role: 'admin' });
  console.log(`Administrateur créé : ${email}`);
}
await mongoose.disconnect();
