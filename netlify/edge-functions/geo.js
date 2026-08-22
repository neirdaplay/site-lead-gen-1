/*!
 * geo.js — Edge Function Netlify (Deno)
 * Reecrit le HTML AVANT envoi au navigateur pour y injecter la commune et le
 * secteur du visiteur. C'est la methode retenue pour la geo-personnalisation :
 * aucun flash de contenu, aucun saut de mise en page, aucun appel tiers.
 *
 * Ordre de resolution (strict) :
 *   1. parametre d'URL ?ville=            (alimente par Google Ads / ValueTrack)
 *   2. geolocalisation IP Netlify          (context.geo / en-tete x-nf-geo)
 *   3. repli generique « dans le Nord »    (deja present dans le HTML statique)
 *
 * SECURITE : la valeur de ?ville= n'est JAMAIS reinjectee telle quelle dans la
 * page. Elle sert uniquement de cle de recherche dans la table des communes ;
 * seul le libelle canonique issu de cette table est ecrit dans le HTML.
 * Aucune injection HTML n'est donc possible via ce parametre.
 */

import { resoudreGeo } from './communes.js';

/* ------------------------------------------------------------------
   Outils
   ------------------------------------------------------------------ */

/* Remplace le contenu textuel d'un element porteur de data-geo="<cle>".
   Les elements concernes ne contiennent jamais de balise fille. */
function remplacerTexte(html, cle, valeur) {
  if (!valeur) { return html; }
  const motif = new RegExp(
    '(<([a-zA-Z]+)([^>]*\\sdata-geo="' + cle + '")([^>]*)>)([^<]*)(</\\2>)',
    'g'
  );
  return html.replace(motif, (_tout, ouvrant, _balise, _attr, _reste, _contenu, fermant) =>
    ouvrant + echapper(valeur) + fermant
  );
}

/* Remplace la liste de puces des communes voisines. */
function remplacerVoisines(html, communes) {
  if (!communes || !communes.length) { return html; }
  const items = communes.map((c) => '<li>' + echapper(c) + '</li>').join('');
  return html.replace(
    /(<ul[^>]*\sdata-geo="voisines"[^>]*>)[\s\S]*?(<\/ul>)/,
    (_tout, ouvrant, fermant) => ouvrant + items + fermant
  );
}

function echapper(texte) {
  return String(texte)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function echapperAttribut(texte) {
  return echapper(texte).replace(/"/g, '&quot;');
}

/* Lit la geolocalisation fournie par Netlify. context.geo est la voie
   normale ; l'en-tete x-nf-geo (base64 JSON) sert de repli. */
function villeReseau(request, context) {
  try {
    if (context && context.geo && context.geo.city) {
      return { ville: context.geo.city, source: 'ip' };
    }
  } catch (_e) { /* ignore */ }
  try {
    const brut = request.headers.get('x-nf-geo');
    if (brut) {
      const objet = JSON.parse(atob(brut));
      if (objet && objet.city) { return { ville: objet.city, source: 'ip' }; }
    }
  } catch (_e) { /* ignore */ }
  return { ville: '', source: '' };
}

/* ------------------------------------------------------------------
   Fonction principale
   ------------------------------------------------------------------ */
export default async function geo(request, context) {
  const reponse = await context.next();

  const typeContenu = reponse.headers.get('content-type') || '';
  if (!typeContenu.includes('text/html')) { return reponse; }

  const url = new URL(request.url);
  const villeParam = url.searchParams.get('ville') || '';
  const cpParam = url.searchParams.get('cp') || '';

  /* 1. Parametre d'URL — source prioritaire et fiable. */
  let resolution = resoudreGeo(villeParam, cpParam);
  let source = resolution.connue ? 'url' : '';

  /* 2. Geolocalisation IP Netlify. */
  if (!resolution.connue) {
    const reseau = villeReseau(request, context);
    if (reseau.ville) {
      const parIp = resoudreGeo(reseau.ville, cpParam);
      if (parIp.connue) {
        resolution = parIp;
        source = 'ip';
      }
    }
  }

  let html = await reponse.text();

  /* Horodatage serveur : sert au controle anti-robot cote fonction
     (une soumission arrivee moins de 3 s apres le rendu est rejetee). */
  const t0 = Date.now();

  /* 3. Repli generique : le HTML statique contient deja « dans le Nord ».
        On injecte quand meme __GEO pour que le front connaisse la source. */
  const charge = {
    ville: resolution.connue ? resolution.ville : '',
    secteur: resolution.connue ? resolution.secteur : 'le Nord',
    aVille: resolution.connue ? resolution.aVille : 'dans le Nord',
    enSecteur: resolution.connue ? resolution.enSecteur : 'dans le Nord',
    voisines: resolution.connue ? resolution.voisines : [],
    source: 'edge'
  };

  const injection =
    '<script>window.__GEO=' +
    JSON.stringify(charge).replace(/</g, '\\u003c') +
    ';window.__T0=' + t0 + ';window.__GEO_ORIGINE=' +
    JSON.stringify(source || 'generique') + ';</script>';

  html = html.replace('<!--GEO-->', injection);

  if (resolution.connue) {
    html = remplacerTexte(html, 'a-ville', resolution.aVille);
    html = remplacerTexte(html, 'en-secteur', resolution.enSecteur);
    html = remplacerTexte(html, 'secteur', resolution.secteur);
    html = remplacerVoisines(html, resolution.voisines);

    const titre = 'Devis toiture ' + resolution.aVille +
      ' (59) — un couvreur vous rappelle sous 48 h';
    const description = 'Fuite, mousse, tuiles déplacées ou toiture à rénover ' +
      resolution.aVille + ' ? Décrivez votre besoin en 2 minutes : un seul couvreur ' +
      'qualifié, assuré en décennale, vous rappelle sous 24 à 48 h. Gratuit et sans engagement.';

    html = html.replace(/<title>[\s\S]*?<\/title>/,
      '<title>' + echapper(titre) + '</title>');
    html = html.replace(
      /(<meta name="description" content=")[^"]*(">)/,
      (_t, a, b) => a + echapperAttribut(description) + b
    );
    html = html.replace(
      /(<meta property="og:title" content=")[^"]*(">)/,
      (_t, a, b) => a + echapperAttribut(titre) + b
    );
    html = html.replace(
      /(<meta property="og:description" content=")[^"]*(">)/,
      (_t, a, b) => a + echapperAttribut(description) + b
    );
  }

  const entetes = new Headers(reponse.headers);
  /* Le HTML varie selon la commune : on interdit la mise en cache partagee
     d'une version personnalisee, tout en gardant la reponse compressible. */
  entetes.set('cache-control', 'public, max-age=0, must-revalidate');
  entetes.set('netlify-vary', 'query=ville|cp');
  entetes.delete('content-length');

  return new Response(html, {
    status: reponse.status,
    statusText: reponse.statusText,
    headers: entetes
  });
}

export const config = {
  path: ['/', '/index.html'],
  cache: 'manual'
};
