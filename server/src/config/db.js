import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  // Délai de sélection du serveur : 5 s par défaut, ajustable pour les connexions lentes
  // (MONGO_SERVER_SELECTION_TIMEOUT_MS, en millisecondes).
  const serverSelectionTimeoutMS = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 5000;
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS });
  console.log('MongoDB connecté');
}
