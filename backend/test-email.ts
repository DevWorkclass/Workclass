import dotenv from 'dotenv';
dotenv.config(); // Charge les variables du fichier .env

import { EmailService } from './src/domains/notifications/services/email.service';

async function testEmail() {
  console.log('--- Test de l\'envoi d\'email avec Nodemailer ---');
  
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Erreur : Variables SMTP manquantes dans le fichier .env');
    console.log('Assurez-vous d\'avoir créé un fichier .env à la racine de "backend" avec :');
    console.log('SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
    process.exit(1);
  }

  console.log('Configuration détectée :');
  console.log('- Hôte :', process.env.SMTP_HOST);
  console.log('- Utilisateur :', process.env.SMTP_USER);
  console.log('Tentative d\'envoi en cours...\n');

  const emailService = new EmailService();

  try {
    // On simule l'envoi d'un email simple (sans PDF pour que le test soit rapide)
    await emailService.send({
      to: process.env.SMTP_USER, // On s'envoie l'email à soi-même pour tester
      subject: 'Test de configuration SMTP Workclass',
      html: `
        <h1>Félicitations ! 🎉</h1>
        <p>Si vous lisez cet email, cela signifie que votre configuration <strong>Google SMTP</strong> fonctionne parfaitement pour le projet Workclass.</p>
        <p>Vous êtes prêt à envoyer les billets et certificats dynamiquement !</p>
      `,
    });
    console.log('✅ Succès : L\'email de test a été envoyé !');
    console.log(`Vérifiez la boîte de réception de : ${process.env.SMTP_USER}`);
  } catch (error) {
    console.error('❌ Échec de l\'envoi de l\'email :');
    console.error(error);
  }
}

testEmail();
