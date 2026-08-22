/*!
 * submit-lead.js — Netlify Function (v2, Web API)
 * Reception, validation, persistance et notification des demandes de devis.
 *
 * Deux types de message arrivent sur cet endpoint :
 *   - type "etape" : ping anti-abandon envoye par sendBeacon a chaque
 *     changement d'etape. Aucune donnee de contact, aucune adresse IP.
 *     Sert a voir ou le parcours decroche et a enregistrer les demandes
 *     hors perimetre (qualified: false), utiles aux exclusions Google Ads.
 *   - type "lead"  : demande complete, avec preuve de consentement.
 *
 * Aucun secret dans ce fichier : tout passe par les variables
 * d'environnement Netlify. Voir README.md.
 */

/* ------------------------------------------------------------------
   Texte de consentement de reference.
   Doit rester STRICTEMENT identique a #texte-consentement dans index.html.
   Si le texte recu differe, le lead est accepte mais marque
   consent.texteConforme = false : c'est un signal a surveiller.
   ------------------------------------------------------------------ */
const TEXTE_CONSENTEMENT_ATTENDU =
  'J’accepte que mes coordonnées soient transmises à Adrien Heddebaut de chez ' +
  'Technitoit afin d’être recontacté(e) au sujet de ma demande de devis. ' +
  'Je peux retirer ce consentement à tout moment.';

/* Delai minimal entre le rendu de la page et la soumission, en ms.
   En dessous : robot. */
const DELAI_MINIMAL_MS = 3000;

const VALEURS = {
  besoin: ['reparation', 'renovation', 'demoussage', 'gouttieres', 'toiture-plate', 'autre'],
  statut: ['proprietaire-occupant', 'proprietaire-bailleur', 'locataire'],
  logement: ['maison', 'appartement', 'copropriete'],
  surface: ['moins-60', '60-100', '100-150', 'plus-150', 'inconnue'],
  delai: ['urgent', '1-3-mois', '3-6-mois', 'renseignement']
};

const LIBELLES = {
  besoin: {
    'reparation': 'Réparation / fuite',
    'renovation': 'Rénovation complète',
    'demoussage': 'Démoussage & hydrofuge',
    'gouttieres': 'Gouttières & zinguerie',
    'toiture-plate': 'Toiture plate',
    'autre': 'Autre / ne sait pas'
  },
  statut: {
    'proprietaire-occupant': 'Propriétaire occupant',
    'proprietaire-bailleur': 'Propriétaire bailleur',
    'locataire': 'Locataire'
  },
  logement: {
    'maison': 'Maison individuelle',
    'appartement': 'Appartement',
    'copropriete': 'Immeuble en copropriété'
  },
  surface: {
    'moins-60': 'moins de 60 m²',
    '60-100': '60 à 100 m²',
    '100-150': '100 à 150 m²',
    'plus-150': 'plus de 150 m²',
    'inconnue': 'surface inconnue'
  },
  delai: {
    'urgent': 'URGENT (sous 7 jours)',
    '1-3-mois': '1 à 3 mois',
    '3-6-mois': '3 à 6 mois',
    'renseignement': 'se renseigne'
  }
};

const RE_TEL = /^0[1-9]\d{8}$/;
const RE_EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
/* Caracteres de controle a neutraliser dans toute chaine entrante. */
const RE_CONTROLE = new RegExp('[\\u0000-\\u001F\\u007F]', 'g');

/* ------------------------------------------------------------------
   Outils
   ------------------------------------------------------------------ */
function texte(valeur, longueurMax) {
  if (valeur === null || valeur === undefined) { return ''; }
  return String(valeur).replace(RE_CONTROLE, ' ').trim().slice(0, longueurMax || 200);
}

function dansListe(valeur, liste) {
  const v = texte(valeur, 40);
  return liste.indexOf(v) !== -1 ? v : '';
}

function normaliserTel(valeur) {
  let brut = texte(valeur, 30).replace(/[\s.\-()]/g, '');
  if (brut.startsWith('+33')) { brut = '0' + brut.slice(3); }
  else if (brut.startsWith('0033')) { brut = '0' + brut.slice(4); }
  return brut;
}

function identifiant() {
  return 'lead_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

function json(code, corps) {
  return new Response(JSON.stringify(corps), {
    status: code,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function nettoyerAttribution(brut) {
  const autorises = [
    'gclid', 'gbraid', 'wbraid', 'msclkid',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'intent', 'ville', 'kw', 'matchtype', 'device', 'placement',
    'campaignid', 'adgroupid', 'premiereVisite', 'derniereVisite',
    'pageEntree', 'referrer'
  ];
  const sortie = {};
  if (!brut || typeof brut !== 'object') { return sortie; }
  for (const cle of autorises) {
    if (brut[cle]) { sortie[cle] = texte(brut[cle], 255); }
  }
  return sortie;
}

/* ------------------------------------------------------------------
   Persistance — modes commutables par la variable d'environnement STOCKAGE
     "blobs"          (defaut) : Netlify Blobs, zero configuration
     "webhook"                 : POST vers WEBHOOK_URL (Firestore, Sheet, CRM…)
     "blobs,webhook"           : les deux
   ------------------------------------------------------------------ */
async function persister(enregistrement, prefixe) {
  const modes = (process.env.STOCKAGE || 'blobs')
    .split(',').map((m) => m.trim().toLowerCase()).filter(Boolean);
  const resultats = {};

  if (modes.includes('blobs')) {
    try {
      const { getStore } = await import('@netlify/blobs');
      const magasin = getStore(process.env.BLOBS_STORE || 'leads');
      const cle = prefixe + '/' + enregistrement.receivedAt.slice(0, 10) +
        '/' + enregistrement.id + '.json';
      await magasin.set(cle, JSON.stringify(enregistrement, null, 2), {
        metadata: {
          qualified: String(enregistrement.qualified),
          besoin: enregistrement.besoin || '',
          codePostal: enregistrement.codePostal || ''
        }
      });
      resultats.blobs = 'ok';
    } catch (erreur) {
      resultats.blobs = 'erreur: ' + erreur.message;
      console.error('[submit-lead] Blobs indisponible', erreur.message);
    }
  }

  if (modes.includes('webhook')) {
    const url = process.env.WEBHOOK_URL;
    if (!url) {
      resultats.webhook = 'erreur: WEBHOOK_URL absente';
    } else {
      try {
        const entetes = { 'Content-Type': 'application/json' };
        if (process.env.WEBHOOK_TOKEN) {
          entetes.Authorization = 'Bearer ' + process.env.WEBHOOK_TOKEN;
        }
        const r = await fetch(url, {
          method: 'POST',
          headers: entetes,
          body: JSON.stringify(enregistrement)
        });
        resultats.webhook = r.ok ? 'ok' : 'erreur: HTTP ' + r.status;
      } catch (erreur) {
        resultats.webhook = 'erreur: ' + erreur.message;
        console.error('[submit-lead] Webhook', erreur.message);
      }
    }
  }

  return resultats;
}

/* ------------------------------------------------------------------
   Notification Telegram — message court, lisible sur mobile
   ------------------------------------------------------------------ */
async function notifierTelegram(e) {
  const jeton = process.env.TELEGRAM_BOT_TOKEN;
  const salon = process.env.TELEGRAM_CHAT_ID;
  if (!jeton || !salon) { return 'non configure'; }

  const urgence = e.delai === 'urgent' ? '🔴 ' : '';
  const lignes = [
    urgence + '<b>Nouveau lead — ' + (LIBELLES.besoin[e.besoin] || e.besoin || '?') + '</b>',
    '',
    '📍 <b>' + (e.codePostal || '?') + '</b>' +
      (e.geo && e.geo.villeDetectee ? ' · ' + e.geo.villeDetectee : ''),
    '⏱ ' + (LIBELLES.delai[e.delai] || e.delai || '?'),
    '🏠 ' + (LIBELLES.logement[e.logement] || e.logement || '?') +
      ' · ' + (LIBELLES.statut[e.statut] || e.statut || '?'),
    '📐 ' + (LIBELLES.surface[e.surface] || e.surface || '?'),
    '',
    '👤 ' + [e.prenom, e.nom].filter(Boolean).join(' '),
    '📞 <a href="tel:' + e.telephone + '">' + (e.telephone || '—') + '</a>',
    '✉️ ' + e.email
  ];

  if (!e.qualified) {
    lignes.unshift('⚠️ <b>NON QUALIFIÉ</b> — ne pas compter en conversion');
  }
  if (e.attribution && e.attribution.utm_campaign) {
    lignes.push('', '🎯 ' + e.attribution.utm_campaign +
      (e.attribution.utm_term ? ' · ' + e.attribution.utm_term : ''));
  }

  try {
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
    return r.ok ? 'ok' : 'erreur: HTTP ' + r.status;
  } catch (erreur) {
    console.error('[submit-lead] Telegram', erreur.message);
    return 'erreur: ' + erreur.message;
  }
}

/* ------------------------------------------------------------------
   Handler
   ------------------------------------------------------------------ */
export default async function submitLead(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { Allow: 'POST' } });
  }
  if (request.method !== 'POST') {
    return json(405, { ok: false, message: 'Méthode non autorisée.' });
  }

  let donnees;
  try {
    donnees = await request.json();
  } catch (_e) {
    return json(400, { ok: false, message: 'Requête illisible.' });
  }
  if (!donnees || typeof donnees !== 'object') {
    return json(400, { ok: false, message: 'Requête illisible.' });
  }

  const ip = request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-forwarded-for') || '';
  const agent = texte(request.headers.get('user-agent'), 255);
  const maintenant = new Date();

  /* ============ Ping d'etape (anti-abandon) ============ */
  if (donnees.type === 'etape') {
    const reponses = donnees.reponses || {};
    const cp = texte(reponses.codePostal, 5);
    const parcours = {
      id: texte(donnees.id, 60) || identifiant(),
      receivedAt: maintenant.toISOString(),
      type: 'parcours',
      etape: texte(donnees.etape, 40),
      qualified: false,
      contactRecueilli: false,
      besoin: dansListe(reponses.besoin, VALEURS.besoin),
      statut: dansListe(reponses.statut, VALEURS.statut),
      logement: dansListe(reponses.logement, VALEURS.logement),
      surface: dansListe(reponses.surface, VALEURS.surface),
      delai: dansListe(reponses.delai, VALEURS.delai),
      codePostal: /^[0-9]{5}$/.test(cp) ? cp : '',
      attribution: nettoyerAttribution(donnees.attribution),
      page: {
        url: texte((donnees.page || {}).url, 500),
        referrer: texte((donnees.page || {}).referrer, 500)
      }
    };
    /* Ni nom, ni telephone, ni e-mail, ni adresse IP : ce ping ne sert qu'a
       mesurer le parcours et a alimenter les exclusions Google Ads. */
    await persister(parcours, 'parcours');
    return json(202, { ok: true });
  }

  /* ============ Lead complet ============ */
  if (texte(donnees.potDeMiel, 100)) {
    console.warn('[submit-lead] Pot de miel rempli — rejet silencieux.');
    return json(200, { ok: true, id: identifiant() }); /* on ne renseigne pas le robot */
  }

  /* t0 est pose par l'Edge Function au moment du rendu (horodatage SERVEUR).
     A defaut — Edge Function non deployee — on retombe sur la duree mesuree
     cote client, moins fiable mais suffisante avec le pot de miel. */
  const t0 = Number(donnees.t0);
  const ecoule = Number.isFinite(t0) && t0 > 0
    ? (maintenant.getTime() - t0)
    : (Number(donnees.dureeMs) || 0);
  if (ecoule < DELAI_MINIMAL_MS) {
    console.warn('[submit-lead] Soumission en ' + ecoule + ' ms — rejet.');
    return json(400, {
      ok: false,
      message: 'Votre demande n’a pas pu être vérifiée. Merci de réessayer.'
    });
  }

  const consentTexte = texte(donnees.consentTexte, 1000);
  if (donnees.consentDonne !== true || !consentTexte) {
    return json(400, {
      ok: false,
      message: 'Votre accord est nécessaire pour transmettre la demande.'
    });
  }

  const qualifie = donnees.qualified !== false;
  const prenom = texte(donnees.prenom, 60);
  const nom = texte(donnees.nom, 60);
  const telephone = normaliserTel(donnees.telephone);
  const email = texte(donnees.email, 120).toLowerCase();
  const codePostal = texte(donnees.codePostal, 5);

  const manquants = [];
  if (!RE_EMAIL.test(email)) { manquants.push('e-mail'); }
  if (qualifie) {
    if (!prenom || prenom.length < 2) { manquants.push('prénom'); }
    if (!nom || nom.length < 2) { manquants.push('nom'); }
    if (!RE_TEL.test(telephone)) { manquants.push('téléphone'); }
    if (!/^59[0-9]{3}$/.test(codePostal)) { manquants.push('code postal du Nord'); }
    if (!dansListe(donnees.besoin, VALEURS.besoin)) { manquants.push('besoin'); }
  }
  if (manquants.length) {
    return json(400, { ok: false, message: 'Merci de vérifier : ' + manquants.join(', ') + '.' });
  }

  const enregistrement = {
    id: texte(donnees.id, 60) || identifiant(),
    receivedAt: maintenant.toISOString(),
    type: 'lead',

    besoin: dansListe(donnees.besoin, VALEURS.besoin),
    statut: dansListe(donnees.statut, VALEURS.statut),
    logement: dansListe(donnees.logement, VALEURS.logement),
    surface: dansListe(donnees.surface, VALEURS.surface),
    delai: dansListe(donnees.delai, VALEURS.delai),
    codePostal: codePostal,

    prenom: prenom,
    nom: nom,
    telephone: telephone,
    email: email,

    qualified: qualifie,
    motifDisqualification: qualifie ? '' : texte(donnees.motifDisqualification, 40),

    attribution: nettoyerAttribution(donnees.attribution),

    /* Le code postal saisi PRIME sur la commune detectee. Celle-ci est
       conservee a titre d'information, jamais comme adresse. */
    geo: {
      villeDetectee: texte((donnees.geo || {}).villeDetectee, 80),
      secteurDetecte: texte((donnees.geo || {}).secteurDetecte, 80),
      source: texte((donnees.geo || {}).source, 20)
    },

    page: {
      url: texte((donnees.page || {}).url, 500),
      referrer: texte((donnees.page || {}).referrer, 500),
      titre: texte((donnees.page || {}).titre, 200)
    },

    /* ============================================================
       PIECE JURIDIQUE — a conserver 3 ans et a pouvoir exporter.
       « text » contient le texte INTEGRAL affiche a l'utilisateur,
       jamais un resume ni une reference. Ne pas tronquer.
       ============================================================ */
    consent: {
      given: true,
      text: consentTexte,
      texteConforme: consentTexte === TEXTE_CONSENTEMENT_ATTENDU,
      timestamp: maintenant.toISOString(),
      ip: texte(ip, 60),
      userAgent: agent,
      formulaire: qualifie ? 'devis' : 'recapitulatif-proprietaire',
      version: 1
    },

    technique: {
      dureeParcoursMs: ecoule,
      langue: texte((donnees.client || {}).langue, 20),
      ecran: texte((donnees.client || {}).ecran, 20)
    }
  };

  const stockage = await persister(enregistrement, qualifie ? 'leads' : 'leads-non-qualifies');
  const telegram = (qualifie || process.env.TELEGRAM_NOTIFIER_NON_QUALIFIES === 'true')
    ? await notifierTelegram(enregistrement)
    : 'ignore (lead non qualifie)';

  const stockageOk = Object.values(stockage).some((v) => v === 'ok');
  const telegramOk = telegram === 'ok';

  console.log('[submit-lead]', enregistrement.id,
    'qualified=' + enregistrement.qualified,
    'stockage=' + JSON.stringify(stockage),
    'telegram=' + telegram);

  /* Le lead n'est perdu que si NI le stockage NI la notification n'ont abouti.
     Tant qu'un des deux canaux fonctionne, l'utilisateur voit sa confirmation :
     mieux vaut un doublon a traiter qu'un lead perdu. */
  if (!stockageOk && !telegramOk) {
    console.error('[submit-lead] AUCUN canal disponible — lead ' + enregistrement.id,
      JSON.stringify(enregistrement));
    return json(500, {
      ok: false,
      message: 'Un incident technique empêche l’enregistrement. ' +
        'Merci de réessayer ou d’appeler le 07 86 50 55 80.'
    });
  }

  return json(200, {
    ok: true,
    id: enregistrement.id,
    qualified: enregistrement.qualified,
    message: enregistrement.qualified
      ? 'Demande enregistrée. Vous serez rappelé sous 24 à 48 h ouvrées.'
      : 'Récapitulatif enregistré.'
  });
}

/* Pas d'export `config` ici. En Functions v2, declarer un `path` REMPLACE
   la route par defaut, et le prefixe reserve /.netlify/functions/ y est
   refuse : la fonction devient injoignable a sa propre URL (404).
   On garde donc la route automatique /.netlify/functions/submit-lead,
   celle qu'appellent form.js et le beacon anti-abandon. L'alias court
   /api/lead est fourni par une redirection dans netlify.toml. */
