/*!
 * communes.js — resolution commune -> secteur, cote NAVIGATEUR.
 * Script classique, aucune dependance, aucun module.
 *
 * CE FICHIER NE CONTIENT AUCUNE DONNEE. La table des communes vit dans
 * shared/communes.json — source unique, partagee avec l'Edge Function
 * (netlify/lib/communes.js). Rien n'est duplique.
 *
 * En production, l'Edge Function a deja resolu la commune et injecte
 * window.__GEO dans le HTML : ce fichier n'a alors rien a faire et ne
 * telecharge meme pas la table.
 *
 * Il ne sert que de REPLI, quand l'Edge Function n'a pas tourne (apercu
 * local, hebergement statique nu) et qu'un parametre ?ville= est present.
 */
(function (global, document) {
  'use strict';

  var SOURCE = '/shared/communes.json';
  var RE_DIACRITIQUES = new RegExp('[̀-ͯ]', 'g');

  /* ---------------------------------------------------------------
     Logique de resolution — strictement identique a netlify/lib/communes.js
     --------------------------------------------------------------- */
  function normaliser(valeur) {
    if (!valeur) { return ''; }
    var s = String(valeur).toLowerCase();
    s = s.split(',')[0];
    s = s.replace(/\s*\((?:59|nord)[^)]*\)\s*$/, '');
    try { s = s.normalize('NFD').replace(RE_DIACRITIQUES, ''); } catch (e) { /* ignore */ }
    s = s.replace(/œ/g, 'oe').replace(/æ/g, 'ae');
    s = s.replace(/[^a-z0-9]/g, '');
    s = s.replace(/^(st)(?=[a-z])/, 'saint');
    return s;
  }

  function indexer(table) {
    var index = {};
    for (var secteur in table.secteurs) {
      if (!Object.prototype.hasOwnProperty.call(table.secteurs, secteur)) { continue; }
      var liste = table.secteurs[secteur];
      for (var i = 0; i < liste.length; i++) {
        var cle = normaliser(liste[i]);
        if (!index[cle]) { index[cle] = { secteur: secteur, position: i }; }
      }
    }
    return index;
  }

  function parPrefixe(index, cle) {
    if (!cle || cle.length < 5) { return null; }
    var trouve = null;
    for (var k in index) {
      if (!Object.prototype.hasOwnProperty.call(index, k)) { continue; }
      if (k.indexOf(cle) === 0) {
        if (trouve) { return null; }
        trouve = index[k];
      }
    }
    return trouve;
  }

  function libelle(table, nom) {
    var cle = normaliser(nom);
    if (table.libelles[cle]) { return table.libelles[cle]; }
    return String(nom).replace(/'/g, '’');
  }

  function voisines(table, secteur, ville, maximum) {
    var liste = table.secteurs[secteur];
    var max = maximum || 8;
    if (!liste) { return []; }
    var cle = normaliser(ville);
    var position = -1;
    for (var i = 0; i < liste.length; i++) {
      if (normaliser(liste[i]) === cle) { position = i; break; }
    }
    if (position === -1) { position = 0; }
    var candidats = [];
    for (var j = 0; j < liste.length; j++) {
      if (j === position) { continue; }
      candidats.push({ nom: liste[j], distance: Math.abs(j - position) });
    }
    candidats.sort(function (a, b) { return a.distance - b.distance; });
    var sortie = [];
    for (var k = 0; k < candidats.length && k < max; k++) {
      sortie.push(libelle(table, candidats[k].nom));
    }
    sortie.sort(function (a, b) { return a.localeCompare(b, 'fr'); });
    return sortie;
  }

  function aVille(nomAffiche) {
    if (!nomAffiche) { return ''; }
    if (/^Le\s/.test(nomAffiche)) { return 'au ' + nomAffiche.slice(3); }
    if (/^Les\s/.test(nomAffiche)) { return 'aux ' + nomAffiche.slice(4); }
    return 'à ' + nomAffiche;
  }

  function enSecteur(table, secteurAffiche) {
    if (!secteurAffiche || secteurAffiche === table.secteurDefaut) { return 'dans le Nord'; }
    if (/^(le |la |les |l’)/i.test(secteurAffiche)) { return 'dans ' + secteurAffiche; }
    if (/^(Douaisis|Valenciennois|Dunkerquois|Cambr|Avesnois)/i.test(secteurAffiche)) {
      return 'dans le ' + secteurAffiche;
    }
    if (/^Métropole|^Metropole/i.test(secteurAffiche)) { return 'dans la ' + secteurAffiche; }
    return 'en ' + secteurAffiche;
  }

  function resoudre(table, villeBrute, codePostal) {
    var repli = {
      ville: '', secteur: table.secteurDefaut, secteurBrut: '',
      aVille: 'dans le Nord', enSecteur: 'dans le Nord',
      voisines: [], connue: false,
      dansLeNord: /^59/.test(String(codePostal || ''))
    };
    var cle = normaliser(villeBrute);
    if (!cle) { return repli; }
    var index = table.__index || (table.__index = indexer(table));
    var trouve = index[cle] || parPrefixe(index, cle);
    if (!trouve) { return repli; }

    var villeAffichee = libelle(table, table.secteurs[trouve.secteur][trouve.position]);
    var secteurAffiche = libelle(table, trouve.secteur);
    return {
      ville: villeAffichee,
      secteur: secteurAffiche,
      secteurBrut: trouve.secteur,
      aVille: aVille(villeAffichee),
      enSecteur: enSecteur(table, secteurAffiche),
      voisines: voisines(table, trouve.secteur, villeAffichee, 8),
      connue: true,
      dansLeNord: true
    };
  }

  /* ---------------------------------------------------------------
     Chargement de la table — uniquement quand le repli est necessaire
     --------------------------------------------------------------- */
  var promesseTable = null;
  function charger() {
    if (!promesseTable) {
      promesseTable = fetch(SOURCE, { credentials: 'same-origin' })
        .then(function (r) {
          if (!r.ok) { throw new Error('HTTP ' + r.status); }
          return r.json();
        });
    }
    return promesseTable;
  }

  function param(nom) {
    var m = new RegExp('[?&]' + nom + '=([^&#]*)').exec(global.location.search);
    if (!m) { return ''; }
    try { return decodeURIComponent(m[1].replace(/\+/g, ' ')); }
    catch (e) { return m[1]; }
  }

  global.MCN_GEO = {
    charger: charger,
    resoudre: resoudre,
    normaliser: normaliser
  };

  /* ---------------------------------------------------------------
     Repli automatique.
     Si l'Edge Function a fait son travail (source === 'edge'), on ne
     telecharge rien et on ne touche a rien : le HTML recu est deja
     personnalise, il n'y a donc aucun flash possible.
     --------------------------------------------------------------- */
  if (global.__GEO && global.__GEO.source === 'edge') { return; }

  var villeURL = param('ville');
  if (!villeURL) { return; }

  charger().then(function (table) {
    var r = resoudre(table, villeURL, param('cp'));
    if (!r.connue) { return; }
    global.__GEO = {
      ville: r.ville, secteur: r.secteur, aVille: r.aVille,
      enSecteur: r.enSecteur, voisines: r.voisines, source: 'url'
    };
    if (typeof global.__appliquerGeo === 'function') { global.__appliquerGeo(); }
  })['catch'](function (erreur) {
    /* Le repli generique reste affiche : « dans le Nord ». */
    if (global.console && console.warn) {
      console.warn('[geo] table des communes indisponible :', erreur.message);
    }
  });
})(window, document);
