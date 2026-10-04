/*!
 * api/lead.js — Fonction serverless Vercel (runtime Node.js).
 *
 * Reçoit en POST le formulaire de index.html (isolation / pompe à chaleur).
 *
 * Vercel n'a pas d'équivalent à Netlify Forms : rien n'est stocké côté
 * hébergeur. Le lead est donc transmis à un ou plusieurs CANAUX, chacun
 * activé par ses variables d'environnement (Vercel → Settings →
 * Environment Variables) :
 *
 *   Telegram   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
 *   E-mail     RESEND_API_KEY + LEAD_EMAIL_TO (+ LEAD_EMAIL_FROM)
 *   Webhook    LEAD_WEBHOOK_URL  (Make, Zapier, Google Sheets, CRM…)
 *
 * Règle de conception : une demande n'est confirmée au visiteur que si
 * AU MOINS UN canal l'a acceptée. Si tous échouent (ou si aucun n'est
 * configuré), on répond 502 : la page affiche alors un message d'erreur
 * plutôt qu'un faux « merci », et le lead n'est pas perdu en silence.
 * Configurez au moins deux canaux en production.
 *
 * Aucune clé ne figure dans le code ni dans le HTML.
 */

/* Échappement HTML : le message Telegram est envoyé en parse_mode "HTML".
   Les valeurs viennent d'un formulaire public, donc d'une source non sûre. */
function echapper(valeur) {
  if (valeur === null || valeur === undefined) { return ''; }
  return String(valeur)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 300);
}

/* Numéro au format tel: — on ne garde que les chiffres et un + initial. */
function lienTelephone(brut) {
  const nettoye = String(brut || '').replace(/[^0-9+]/g, '');
  if (!nettoye) { return ''; }
  if (nettoye.startsWith('0')) { return '+33' + nettoye.slice(1); }
  return nettoye;
}

/* Corps de la requête : Vercel le parse déjà pour les types courants,
   mais on reste robuste si on reçoit une chaîne brute. */
function lireCorps(req) {
  const b = req.body;
  if (!b) { return {}; }
  if (typeof b === 'object' && !Buffer.isBuffer(b)) { return b; }
  const texte = Buffer.isBuffer(b) ? b.toString('utf8') : String(b);
  try { return JSON.parse(texte); } catch (e) { /* pas du JSON */ }
  return Object.fromEntries(new URLSearchParams(texte));
}

function lignesMessage(d) {
  const tel = lienTelephone(d.telephone);
  const source = [d.utm_source, d.utm_campaign, d.utm_term].filter(Boolean).join(' / ');
  return [
    '🔔 <b>Nouveau lead isolation / PAC</b>',
    '',
    'Projet : ' + echapper(d.projet),
    'Logement : ' + echapper(d.logement) + ' · ' + echapper(d.statut),
    'Chauffage : ' + echapper(d.chauffage) + ' · Construite : ' + echapper(d.anciennete),
    'Foyer : ' + echapper(d.personnes) + ' pers. · Revenus : ' + echapper(d.revenus),
    'Code postal : ' + echapper(d.code_postal),
    '',
    echapper(d.prenom) + ' ' + echapper(d.nom),
    '📞 ' + (tel ? '<a href="tel:' + echapper(tel) + '">' + echapper(d.telephone) + '</a>' : '—'),
    '✉️ ' + (d.email ? echapper(d.email) : 'non renseigné'),
    '',
    'Source : ' + (source ? echapper(source) : 'directe')
  ];
}

/* ---------------- Canaux ---------------- */

async function envoyerTelegram(lignes) {
  const jeton = process.env.TELEGRAM_BOT_TOKEN;
  const salon = process.env.TELEGRAM_CHAT_ID;
  if (!jeton || !salon) { return null; }
  const r = await fetch('https://api.telegram.org/bot' + jeton + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: salon,
      text: lignes.join('\n'),
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });
  if (!r.ok) { throw new Error('Telegram HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200)); }
  return true;
}

async function envoyerEmail(lignes, d) {
  const cle = process.env.RESEND_API_KEY;
  const dest = process.env.LEAD_EMAIL_TO;
  if (!cle || !dest) { return null; }
  const html = lignes.join('<br>');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cle },
    body: JSON.stringify({
      from: process.env.LEAD_EMAIL_FROM || 'Leads <onboarding@resend.dev>',
      to: dest.split(',').map((s) => s.trim()).filter(Boolean),
      subject: 'Nouveau lead isolation / PAC — ' +
        String(d.code_postal || '').slice(0, 5) + ' ' + String(d.prenom || '').slice(0, 40),
      html
    })
  });
  if (!r.ok) { throw new Error('Resend HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200)); }
  return true;
}

async function envoyerWebhook(d) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) { return null; }
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ recu_le: new Date().toISOString() }, d))
  });
  if (!r.ok) { throw new Error('Webhook HTTP ' + r.status); }
  return true;
}

/* ---------------- Point d'entrée ---------------- */

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const brut = lireCorps(req);

  /* Pot de miel : un robot remplit le champ caché. On répond « ok » sans
     rien transmettre, pour ne pas lui apprendre qu'il a été repéré. */
  if (brut['bot-field']) { return res.status(200).json({ ok: true }); }

  /* On ne garde que des chaînes courtes. */
  const d = {};
  Object.keys(brut).slice(0, 60).forEach((k) => {
    if (k === 'bot-field') { return; }
    d[String(k).slice(0, 40)] = String(brut[k] == null ? '' : brut[k]).slice(0, 300);
  });

  const telOk = /^0[1-9]\d{8}$/.test(lienTelephone(d.telephone).replace(/^\+33/, '0'));
  if (!telOk) { return res.status(400).json({ ok: false, erreur: 'telephone' }); }

  const lignes = lignesMessage(d);
  const resultats = await Promise.allSettled([
    envoyerTelegram(lignes),
    envoyerEmail(lignes, d),
    envoyerWebhook(d)
  ]);

  let reussis = 0;
  resultats.forEach((r, i) => {
    const nom = ['telegram', 'email', 'webhook'][i];
    if (r.status === 'fulfilled' && r.value === true) { reussis++; }
    if (r.status === 'rejected') { console.error('[lead] Canal ' + nom + ' en échec :', r.reason && r.reason.message); }
  });

  if (reussis === 0) {
    console.error('[lead] AUCUN canal n\'a accepté le lead (vérifier les variables d\'environnement). ' +
      'Données : ' + JSON.stringify(d));
    return res.status(502).json({ ok: false });
  }
  return res.status(200).json({ ok: true });
};
