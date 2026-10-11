import Card from '../components/common/Card.jsx';

// Texte type : à compléter (éditeur, contact, durée exacte) et à faire valider juridiquement pour le pays de déploiement.
export default function PrivacyPage() {
  return (
    <Card className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-extrabold text-brand-700">Politique de confidentialité</h1>
      <p className="rounded-2xl bg-sun-100 p-3 text-sm font-bold">Texte modèle à compléter et faire valider avant la mise en ligne, notamment pour un public d’enfants.</p>
      <h2 className="text-xl font-extrabold">Données collectées</h2>
      <p>Uniquement le nécessaire : ton prénom, ton adresse email, ton mot de passe (conservé sous forme chiffrée, jamais en clair) et tes réponses aux questions.</p>
      <h2 className="text-xl font-extrabold">À quoi servent-elles ?</h2>
      <p>À te permettre de te connecter, de retrouver ta progression et ton historique. Elles ne sont pas utilisées pour de la publicité et aucune communication par email n’est envoyée sans ton accord explicite.</p>
      <h2 className="text-xl font-extrabold">Enfants</h2>
      <p>Si tu es un enfant, crée ton compte avec l’aide d’un parent ou d’un adulte responsable.</p>
      <h2 className="text-xl font-extrabold">Durée de conservation</h2>
      <p>Tes données sont conservées tant que ton compte existe. Durée d’inactivité avant suppression : [à définir].</p>
      <h2 className="text-xl font-extrabold">Tes droits</h2>
      <p>Tu peux modifier ton prénom ou supprimer ton compte à tout moment depuis la page « Mon profil » : ton compte et toutes tes réponses sont alors effacés. Contact : [adresse à compléter].</p>
    </Card>
  );
}
