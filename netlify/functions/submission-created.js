/*!
 * submission-created.js — Netlify Function evenementielle.
 *
 * Ce nom de fichier est RESERVE par Netlify : la fonction est declenchee
 * automatiquement a chaque soumission acceptee par Netlify Forms. Elle
 * n'est jamais appelee depuis index.html, et aucune cle ne figure dans le
 * HTML : le jeton et l'identifiant de salon viennent des variables
 * d'environnement Netlify (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID).
 *
 * Regle de conception : une notification ratee ne doit JAMAIS faire perdre
 * un lead. En cas d'echec, on journalise et on retourne quand meme 200 —
 * la soumission reste enregistree dans Netlify Forms, et la notification
 * e-mail native de Netlify Forms sert de filet de securite.
 */

/* Echappement HTML : le message Telegram est envoye en parse_mode "HTML".
   Les valeurs viennent d'un formulaire public, donc d'une source non sure. */
function echapper(valeur) {
  if (valeur === null || valeur === undefined) { return ''; }
  return String(valeur)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 300);
}

/* Numero au format tel: — on ne garde que les chiffres et un + initial. */
function lienTelephone(brut) {
  const nettoye = String(brut || '').replace(/[^0-9+]/g, '');
  if (!nettoye) { return ''; }
  if (nettoye.startsWith('0')) { return '+33' + nettoye.slice(1); }
  return nettoye;
}

exports.handler = async function (evenement) {
  let donnees = {};
  try {
    const corps = JSON.parse(evenement.body || '{}');
    donnees = (corps && corps.payload && corps.payload.data) || {};
  } catch (erreur) {
    console.error('[submission-created] Charge utile illisible :', erreur.message);
    return { statusCode: 200, body: 'ok' };
  }

  const jeton = process.env.TELEGRAM_BOT_TOKEN;
  const salon = process.env.TELEGRAM_CHAT_ID;
  if (!jeton || !salon) {
    console.warn('[submission-created] TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID absent — ' +
      'notification ignoree, le lead reste dans Netlify Forms.');
    return { statusCode: 200, body: 'ok' };
  }

  /* Les deux bornes arrivent en chaines : soit des entiers (« 8000 »),
     soit un prix au metre carre (« 80 €/m² ») quand le visiteur a
     repondu « Je ne sais pas » a la surface. On les rend telles
     quelles, sans tenter de les reformater. */
  function estimationVue(d) {
    const bas = (d.estimation_basse || '').trim();
    const haut = (d.estimation_haute || '').trim();
    if (!bas || !haut) { return 'non calculée'; }
    const auM2 = /m²/.test(bas);
    const nombre = (v) => v.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return auM2
      ? echapper(nombre(bas) + ' à ' + nombre(haut) + ' € par m²')
      : echapper(nombre(bas) + ' € – ' + nombre(haut) + ' €');
  }

  const tel = lienTelephone(donnees.telephone);
  const source = [donnees.utm_campaign, donnees.utm_term].filter(Boolean).join(' / ');

  const lignes = [
    '🔔 <b>Nouveau lead toiture</b>',
    '',
    'Projet : ' + echapper(donnees.projet),
    'Surface : ' + echapper(donnees.surface),
    'Code postal : ' + echapper(donnees.code_postal),
    /* La fourchette affichee au visiteur part avec le lead : au
       telephone, on reparle du montant qu'il a reellement lu, pas d'un
       autre recalcule de tete. */
    '💶 Estimation vue : ' + estimationVue(donnees),
    '',
    echapper(donnees.prenom) + ' ' + echapper(donnees.nom),
    '📞 ' + (tel
      ? '<a href="tel:' + echapper(tel) + '">' + echapper(donnees.telephone) + '</a>'
      : '—'),
    '✉️ ' + (donnees.email ? echapper(donnees.email) : 'non renseigné'),
    '',
    'Source : ' + (source ? echapper(source) : 'directe')
  ];

  try {
    const reponse = await fetch(
      'https://api.telegram.org/bot' + jeton + '/sendMessage',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: salon,
          text: lignes.join('\n'),
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      }
    );
    if (!reponse.ok) {
      const detail = await reponse.text().catch(() => '');
      console.error('[submission-created] Telegram a répondu ' + reponse.status + ' : ' +
        detail.slice(0, 300));
    }
  } catch (erreur) {
    console.error('[submission-created] Appel Telegram impossible :', erreur.message);
  }

  /* Toujours 200 : le lead est acquis, quoi qu'il arrive a la notification. */
  return { statusCode: 200, body: 'ok' };
};
