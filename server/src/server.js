import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

try {
  await connectDB();
} catch (err) {
  console.error('Connexion MongoDB impossible :', err.message);
  process.exit(1);
}

app.listen(env.port, () => console.log(`API sur http://localhost:${env.port}/api (${env.nodeEnv})`));
