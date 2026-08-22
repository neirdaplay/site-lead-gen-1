/*!
 * netlify/lib/communes.js
 * Resolution commune -> secteur pour le departement du Nord (59).
 *
 * Ce module N'EST PAS une Edge Function : il vit volontairement hors de
 * netlify/edge-functions/, ou Netlify traite chaque fichier comme une
 * fonction et exige un export par defaut appelable.
 *
 * Les donnees viennent de shared/communes.json — SOURCE UNIQUE, partagee
 * avec le navigateur (assets/js/communes.js la charge en repli lorsque
 * l'Edge Function n'a pas tourne). Aucune table n'est dupliquee.
 */

import donnees from '../../shared/communes.json' with { type: 'json' };

/* Table brute : secteur -> liste ordonnee geographiquement de communes. */
export const COMMUNES = donnees.secteurs;

/* Libelles d'affichage (accents et apostrophes typographiques), indexes
   sur la forme normalisee. */
export const LIBELLES = donnees.libelles;

export const SECTEUR_DEFAUT = donnees.secteurDefaut;

/* Diacritiques combinantes, a retirer apres normalisation NFD. */
const RE_DIACRITIQUES = new RegExp('[\\u0300-\\u036f]', 'g');

/*
 * Normalise : minuscules, sans accent, sans separateur.
 *   'Villeneuve-d Ascq'     -> 'villeneuvedascq'
 *   'Orchies, Nord, France' -> 'orchies'
 */
export function normaliser(valeur) {
  if (!valeur) { return ''; }
  let s = String(valeur).toLowerCase();
  s = s.split(',')[0];
  s = s.replace(/\s*\((?:59|nord)[^)]*\)\s*$/, '');
  try { s = s.normalize('NFD').replace(RE_DIACRITIQUES, ''); } catch (_e) { /* ignore */ }
  s = s.replace(/œ/g, 'oe').replace(/æ/g, 'ae');
  s = s.replace(/[^a-z0-9]/g, '');
  s = s.replace(/^(st)(?=[a-z])/, 'saint');
  return s;
}

/* Index : forme normalisee -> { secteur, position }. Construit une fois. */
const INDEX = (() => {
  const index = {};
  for (const secteur of Object.keys(COMMUNES)) {
    COMMUNES[secteur].forEach((nom, position) => {
      const cle = normaliser(nom);
      if (!index[cle]) { index[cle] = { secteur, position }; }
    });
  }
  return index;
})();

/*
 * Repli tolerant : 'Templeuve' -> 'Templeuve-en-Pevele',
 * 'Saint-Amand' -> 'Saint-Amand-les-Eaux'. On n'accepte le raccourci que
 * s'il est UNIQUE dans la table, pour ne jamais afficher une commune a la
 * place d'une autre.
 */
function parPrefixe(cle) {
  if (!cle || cle.length < 5) { return null; }
  let trouve = null;
  for (const k of Object.keys(INDEX)) {
    if (k.startsWith(cle)) {
      if (trouve) { return null; }
      trouve = INDEX[k];
    }
  }
  return trouve;
}

/* Libelle affichable d'une commune ou d'un secteur. */
export function libelle(nom) {
  const cle = normaliser(nom);
  if (LIBELLES[cle]) { return LIBELLES[cle]; }
  return String(nom).replace(/'/g, '’');
}

/* Communes voisines : les entrees les plus proches dans le tableau du secteur. */
export function voisines(secteur, ville, maximum) {
  const liste = COMMUNES[secteur];
  const max = maximum || 8;
  if (!liste) { return []; }
  const cle = normaliser(ville);
  let position = liste.findIndex((nom) => normaliser(nom) === cle);
  if (position === -1) { position = 0; }
  return liste
    .map((nom, i) => ({ nom, distance: Math.abs(i - position) }))
    .filter((_c, i) => i !== position)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, max)
    .map((c) => libelle(c.nom))
    .sort((a, b) => a.localeCompare(b, 'fr'));
}

/* Preposition correcte : 'a Lille', 'au Cateau-Cambresis', 'a La Madeleine'. */
export function aVille(nomAffiche) {
  if (!nomAffiche) { return ''; }
  if (/^Le\s/.test(nomAffiche)) { return 'au ' + nomAffiche.slice(3); }
  if (/^Les\s/.test(nomAffiche)) { return 'aux ' + nomAffiche.slice(4); }
  return 'à ' + nomAffiche;
}

/* Preposition secteur : 'en Pevele', 'dans le Douaisis', 'dans le Nord'. */
export function enSecteur(secteurAffiche) {
  if (!secteurAffiche || secteurAffiche === SECTEUR_DEFAUT) { return 'dans le Nord'; }
  if (/^(le |la |les |l’)/i.test(secteurAffiche)) { return 'dans ' + secteurAffiche; }
  if (/^(Douaisis|Valenciennois|Dunkerquois|Cambr|Avesnois)/i.test(secteurAffiche)) {
    return 'dans le ' + secteurAffiche;
  }
  if (/^Métropole|^Metropole/i.test(secteurAffiche)) { return 'dans la ' + secteurAffiche; }
  return 'en ' + secteurAffiche;
}

/*
 * Resolution principale.
 * @param {string} villeBrute  valeur de ?ville= ou de l'en-tete geo Netlify
 * @param {string} codePostal  code postal eventuel (fiabilise le repli 59)
 * @returns {{ville:string, secteur:string, secteurBrut:string, aVille:string,
 *            enSecteur:string, voisines:string[], connue:boolean, dansLeNord:boolean}}
 */
export function resoudreGeo(villeBrute, codePostal) {
  const repli = {
    ville: '', secteur: SECTEUR_DEFAUT, secteurBrut: '',
    aVille: 'dans le Nord', enSecteur: 'dans le Nord',
    voisines: [], connue: false,
    dansLeNord: /^59/.test(String(codePostal || ''))
  };

  const cle = normaliser(villeBrute);
  if (!cle) { return repli; }

  /* Commune inconnue : on ne l'affiche pas. Si le code postal est en 59,
     on reste sur le repli generique « le Nord ». */
  const trouve = INDEX[cle] || parPrefixe(cle);
  if (!trouve) { return repli; }

  const villeAffichee = libelle(COMMUNES[trouve.secteur][trouve.position]);
  const secteurAffiche = libelle(trouve.secteur);
  return {
    ville: villeAffichee,
    secteur: secteurAffiche,
    secteurBrut: trouve.secteur,
    aVille: aVille(villeAffichee),
    enSecteur: enSecteur(secteurAffiche),
    voisines: voisines(trouve.secteur, villeAffichee, 8),
    connue: true,
    dansLeNord: true
  };
}
