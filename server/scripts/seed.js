// Données de démonstration, idempotentes : relancer le script ne crée pas de doublons
// et ne modifie pas ce qui existe déjà. Refusé en production.
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { Book } from '../src/models/Book.js';
import { Question } from '../src/models/Question.js';
import { dateKeyFor, dateKeyToUTCDate } from '../src/utils/dates.js';

if (env.isProd) {
  console.error('Seed refusé en production : les données de démonstration ne doivent pas y être mélangées.');
  process.exit(1);
}

const DAY = 24 * 60 * 60 * 1000;
const today = dateKeyToUTCDate(dateKeyFor());
const offsetDate = (days) => new Date(today.getTime() + days * DAY);

// [question, [4 propositions], index de la bonne réponse, explication, décalage en jours, statut]
const DEMO = [
  ['Que peux-tu faire quand tu rencontres une difficulté ?', ['Abandonner', 'Demander de l\'aide', 'Ne rien faire', 'Essayer autrement'], 3,
    'Essayer autrement permet de trouver une nouvelle solution, et demander de l\'aide est aussi une très bonne idée.', 0, 'published'],
  ['Quelle attitude aide à progresser ?', ['Abandonner', 'Essayer encore', 'Ignorer le problème', 'Ne rien faire'], 1,
    'Essayer à nouveau permet d\'apprendre de ses erreurs.', -1, 'published'],
  ['Quand tu te trompes, que peux-tu en tirer ?', ['Rien du tout', 'Une leçon pour la prochaine fois', 'De la honte', 'Une raison d\'arrêter'], 1,
    'Chaque erreur est une occasion d\'apprendre quelque chose de nouveau.', -2, 'published'],
  ['Pourquoi est-il utile de lire un peu chaque jour ?', ['Pour aller plus vite', 'Pour progresser petit à petit', 'Pour impressionner les autres', 'Ce n\'est pas utile'], 1,
    'Un petit effort régulier permet de progresser sans se fatiguer.', -3, 'published'],
  ['Que fais-tu si un ami a besoin d\'aide ?', ['Je fais semblant de ne pas voir', 'Je me moque de lui', 'Je lui propose mon aide', 'Je pars'], 2,
    'Proposer son aide rend le groupe plus fort et fait plaisir à tout le monde.', 1, 'published'], // date future : non disponible
  ['Question en brouillon de démonstration', ['A', 'B', 'C', 'D'], 0, 'Brouillon : ne doit pas apparaître côté lecteur.', 0, 'draft'],
];

await connectDB();

await Book.updateOne(
  { slug: 'livre-demo' },
  {
    $setOnInsert: {
      title: 'Livre de démonstration',
      description: 'Livre fictif servant uniquement à tester l\'application (données de démonstration).',
      author: 'Démo',
      coverImage: '',
      isPublished: true,
    },
  },
  { upsert: true }
);
const book = await Book.findOne({ slug: 'livre-demo' });

let inserted = 0;
for (const [question, answers, correctAnswer, explanation, offset, status] of DEMO) {
  const res = await Question.updateOne(
    { book: book._id, question },
    {
      $setOnInsert: {
        answers, correctAnswer, explanation, status,
        publicationDate: offsetDate(offset), isDemo: true, type: 'single',
      },
    },
    { upsert: true }
  );
  if (res.upsertedCount) inserted += 1;
}
console.log(`Seed terminé : livre "livre-demo", ${inserted} nouvelle(s) question(s) sur ${DEMO.length}.`);
await mongoose.disconnect();
