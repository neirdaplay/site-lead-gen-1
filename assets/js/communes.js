/*!
 * communes.js — table commune -> secteur du departement du Nord (59)
 * Version NAVIGATEUR (script classique, aucune dependance, aucun module).
 * Charge de maniere SYNCHRONE dans le <head> : le script inline qui suit
 * s'en sert pour ecrire le titre personnalise AVANT la premiere peinture.
 * Expose : window.MCN_GEO = { resoudre, communesParSecteur, normaliser, ... }
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------
   * SOURCE UNIQUE des communes du Nord (59) et de leur secteur.
   * Ce bloc est identique dans :
   *   - assets/js/communes.js              (navigateur, script classique)
   *   - netlify/edge-functions/communes.js (Deno, module ESM)
   * Si vous ajoutez une commune, ajoutez-la DANS LES DEUX fichiers.
   * Les tableaux sont ordonnes geographiquement : les communes voisines
   * proposees sont les entrees les plus proches dans le tableau.
   * ------------------------------------------------------------------ */

  var SECTEUR_DEFAUT = 'le Nord';

  var COMMUNES_PAR_SECTEUR = {
    'Metropole lilloise': [
      'Lille', 'Hellemmes', 'Lomme', 'La Madeleine', 'Saint-Andre-lez-Lille',
      'Marquette-lez-Lille', 'Wambrechies', 'Verlinghem', 'Perenchies',
      'Lambersart', 'Capinghem', 'Sequedin', 'Loos', 'Haubourdin', 'Emmerin',
      'Santes', 'Wavrin', 'Houplin-Ancoisne', 'Seclin', 'Noyelles-les-Seclin',
      'Templemars', 'Vendeville', 'Wattignies', 'Faches-Thumesnil', 'Ronchin',
      'Lesquin', 'Lezennes', 'Fretin', 'Peronne-en-Melantois',
      'Sainghin-en-Melantois', 'Villeneuve-d\'Ascq', 'Mons-en-Baroeul',
      'Marcq-en-Baroeul', 'Bondues', 'Mouvaux', 'Tourcoing', 'Neuville-en-Ferrain',
      'Roncq', 'Halluin', 'Bousbecque', 'Wervicq-Sud', 'Comines', 'Deulemont',
      'Quesnoy-sur-Deule', 'Linselles', 'Wasquehal', 'Croix', 'Roubaix',
      'Wattrelos', 'Leers', 'Lys-lez-Lannoy', 'Hem', 'Toufflers', 'Forest-sur-Marque',
      'Sailly-lez-Lannoy', 'Anstaing', 'Chereng', 'Tressin', 'Baisieux', 'Willems',
      'Gruson', 'Bouvines', 'La Bassee', 'Salome', 'Marquillies', 'Herlies',
      'Illies', 'Sainghin-en-Weppes', 'Fournes-en-Weppes', 'Hantay', 'Wicres',
      'Le Maisnil', 'Radinghem-en-Weppes', 'Beaucamps-Ligny', 'Escobecques',
      'Ennetieres-en-Weppes', 'Englos', 'Hallennes-lez-Haubourdin'
    ],
    'Pevele': [
      'Orchies', 'Beuvry-la-Foret', 'Landas', 'Rumegies', 'Tilloy-lez-Marchiennes',
      'Nomain', 'Mouchin', 'Bachy', 'Wannehain', 'Camphin-en-Pevele', 'Bourghelles',
      'Cysoing', 'Louvil', 'Genech', 'Bersee', 'Templeuve-en-Pevele', 'Ennevelin',
      'Avelin', 'Pont-a-Marcq', 'Mons-en-Pevele', 'Tourmignies', 'Merignies',
      'Attiches', 'Thumeries', 'Wahagnies', 'Moncheaux', 'Ostricourt', 'Faumont',
      'Coutiches', 'Auchy-lez-Orchies', 'Bouvignies', 'Marchiennes', 'Sameon',
      'Warlaing', 'Cappelle-en-Pevele', 'La Neuville', 'Raches'
    ],
    'Douaisis': [
      'Douai', 'Sin-le-Noble', 'Waziers', 'Dechy', 'Guesnain', 'Lambres-lez-Douai',
      'Cuincy', 'Flers-en-Escrebieux', 'Auby', 'Roost-Warendin', 'Raimbeaucourt',
      'Lallaing', 'Anhiers', 'Vred', 'Montigny-en-Ostrevent', 'Pecquencourt',
      'Masny', 'Ecaillon', 'Loffre', 'Lewarde', 'Erchin', 'Cantin', 'Ferin',
      'Courchelettes', 'Arleux', 'Aubigny-au-Bac', 'Brunemont', 'Somain',
      'Aniche', 'Auberchicourt', 'Monchecourt', 'Emerchicourt', 'Fenain',
      'Rieulay', 'Erre', 'Hornaing', 'Wandignies-Hamage', 'Bruille-lez-Marchiennes',
      'Abscon', 'Bugnicourt', 'Villers-au-Tertre'
    ],
    'Valenciennois': [
      'Valenciennes', 'Anzin', 'Beuvrages', 'Petite-Foret', 'Raismes', 'Wallers',
      'Bruay-sur-l\'Escaut', 'Escautpont', 'Fresnes-sur-Escaut', 'Vieux-Conde',
      'Conde-sur-l\'Escaut', 'Hergnies', 'Odomez', 'Thivencelle', 'Crespin',
      'Quievrechain', 'Onnaing', 'Estreux', 'Saint-Saulve', 'Marly', 'Aulnoy-lez-Valenciennes',
      'Famars', 'Preseau', 'Saultain', 'Curgies', 'Sebourg', 'Trith-Saint-Leger',
      'Prouvy', 'Rouvignies', 'Herin', 'Maing', 'Thiant', 'Haulchin', 'Denain',
      'Lourches', 'Escaudain', 'Douchy-les-Mines', 'Neuville-sur-Escaut', 'Roeulx',
      'Avesnes-le-Sec', 'Haspres', 'Saint-Amand-les-Eaux', 'Lecelles', 'Mortagne-du-Nord',
      'Chateau-l\'Abbaye', 'Bousignies', 'Brillon', 'Millonfosse', 'Nivelle',
      'Bouchain', 'Wavrechain-sous-Denain', 'Helesmes'
    ],
    'Flandre interieure': [
      'Hazebrouck', 'Morbecque', 'Steenbecque', 'Blaringhem', 'Thiennes',
      'Haverskerque', 'Merville', 'La Gorgue', 'Estaires', 'Neuf-Berquin',
      'Vieux-Berquin', 'Le Doulieu', 'Merris', 'Strazeele', 'Meteren', 'Bailleul',
      'Saint-Jans-Cappel', 'Berthen', 'Boeschepe', 'Godewaersvelde', 'Steenvoorde',
      'Fletre', 'Caestre', 'Borre', 'Pradelles', 'Hondeghem', 'Wallon-Cappel',
      'Sercus', 'Lynde', 'Staple', 'Renescure', 'Ebblinghem', 'Cassel', 'Oxelaere',
      'Sainte-Marie-Cappel', 'Bavinchove', 'Zuytpeene', 'Noordpeene', 'Arneke',
      'Herzeele', 'Winnezeele', 'Houtkerque', 'Wormhout', 'Esquelbecq', 'Ledringhem',
      'Armentieres', 'Houplines', 'Erquinghem-Lys', 'Frelinghien', 'Nieppe',
      'Steenwerck', 'Bois-Grenier', 'La Chapelle-d\'Armentieres'
    ],
    'Dunkerquois': [
      'Dunkerque', 'Malo-les-Bains', 'Rosendael', 'Saint-Pol-sur-Mer', 'Fort-Mardyck',
      'Grande-Synthe', 'Coudekerque-Branche', 'Coudekerque-Village', 'Cappelle-la-Grande',
      'Teteghem', 'Leffrinckoucke', 'Zuydcoote', 'Bray-Dunes', 'Ghyvelde',
      'Uxem', 'Bierne', 'Bergues', 'Hoymille', 'Socx', 'Steene', 'Armbouts-Cappel',
      'Spycker', 'Brouckerque', 'Craywick', 'Loon-Plage', 'Gravelines',
      'Grand-Fort-Philippe', 'Saint-Georges-sur-l\'Aa', 'Bourbourg', 'Looberghe',
      'Drincham', 'Cappelle-Brouck', 'Holque', 'Watten', 'Bissezeele', 'Warhem',
      'Rexpoede', 'Hondschoote', 'Killem', 'Bambecque'
    ],
    'Cambresis': [
      'Cambrai', 'Escaudoeuvres', 'Neuville-Saint-Remy', 'Proville', 'Raillencourt-Sainte-Olle',
      'Fontaine-Notre-Dame', 'Awoingt', 'Cauroir', 'Naves', 'Rieux-en-Cambresis',
      'Iwuy', 'Marcoing', 'Masnieres', 'Rumilly-en-Cambresis', 'Honnecourt-sur-Escaut',
      'Villers-Outreaux', 'Clary', 'Walincourt-Selvigny', 'Caudry', 'Beauvois-en-Cambresis',
      'Carnieres', 'Avesnes-les-Aubert', 'Saint-Vaast-en-Cambresis', 'Solesmes',
      'Bertry', 'Busigny', 'Le Cateau-Cambresis', 'Neuvilly', 'Bazuel', 'Ors',
      'Catillon-sur-Sambre', 'Caullery', 'Elincourt', 'Montay'
    ],
    'Avesnois': [
      'Maubeuge', 'Louvroil', 'Hautmont', 'Boussois', 'Marpent', 'Jeumont',
      'Recquignies', 'Assevent', 'Ferriere-la-Grande', 'Rousies', 'Vieux-Reng',
      'Elesmes', 'Colleret', 'Cousolre', 'Solre-le-Chateau', 'Feignies', 'Bavay',
      'Hon-Hergies', 'Bellignies', 'Taisnieres-sur-Hon', 'Gommegnies', 'Le Quesnoy',
      'Villereau', 'Jolimetz', 'Locquignol', 'Berlaimont', 'Aulnoye-Aymeries',
      'Pont-sur-Sambre', 'Bachant', 'Neuf-Mesnil', 'Landrecies', 'Avesnes-sur-Helpe',
      'Sains-du-Nord', 'Felleries', 'Fourmies', 'Wignehies', 'Anor', 'Trelon',
      'Glageon', 'Beaufort', 'Etroeungt', 'Dompierre-sur-Helpe'
    ]
  };

  /* Libelles d'affichage : accentues et apostrophes typographiques.
     Cle = forme normalisee (sans accent, sans separateur, en minuscules). */
  var LIBELLES = {
    'villeneuvedascq': 'Villeneuve-d’Ascq',
    'marcqenbaroeul': 'Marcq-en-Barœul',
    'monsenbaroeul': 'Mons-en-Barœul',
    'noyelleslesseclin': 'Noyelles-lès-Seclin',
    'saintandrelezlille': 'Saint-André-lez-Lille',
    'peronneenmelantois': 'Péronne-en-Mélantois',
    'sainghinenmelantois': 'Sainghin-en-Mélantois',
    'perenchies': 'Pérenchies',
    'labassee': 'La Bassée',
    'deulemont': 'Deulémont',
    'quesnoysurdeule': 'Quesnoy-sur-Deule',
    'chereng': 'Chéreng',
    'ennetieresenweppes': 'Ennetières-en-Weppes',
    'hallenneslezhaubourdin': 'Hallennes-lez-Haubourdin',
    'pevele': 'Pévèle',
    'beuvrylaforet': 'Beuvry-la-Forêt',
    'camphinenpevele': 'Camphin-en-Pévèle',
    'bersee': 'Bersée',
    'templeuveenpevele': 'Templeuve-en-Pévèle',
    'monsenpevele': 'Mons-en-Pévèle',
    'merignies': 'Mérignies',
    'sameon': 'Saméon',
    'cappelleenpevele': 'Cappelle-en-Pévèle',
    'raches': 'Râches',
    'lambreslezdouai': 'Lambres-lez-Douai',
    'flersenescrebieux': 'Flers-en-Escrebieux',
    'dechy': 'Déchy',
    'ecaillon': 'Écaillon',
    'ferin': 'Férin',
    'emerchicourt': 'Émerchicourt',
    'montignyenostrevent': 'Montigny-en-Ostrevent',
    'bruillelezmarchiennes': 'Bruille-lez-Marchiennes',
    'bruaysurlescaut': 'Bruay-sur-l’Escaut',
    'fresnessurescaut': 'Fresnes-sur-Escaut',
    'vieuxconde': 'Vieux-Condé',
    'condesurlescaut': 'Condé-sur-l’Escaut',
    'quievrechain': 'Quiévrechain',
    'petiteforet': 'Petite-Forêt',
    'aulnoylezvalenciennes': 'Aulnoy-lez-Valenciennes',
    'preseau': 'Préseau',
    'trithsaintleger': 'Trith-Saint-Léger',
    'herin': 'Hérin',
    'chateaulabbaye': 'Château-l’Abbaye',
    'helesmes': 'Hélesmes',
    'wavrechainsousdenain': 'Wavrechain-sous-Denain',
    'flandreinterieure': 'Flandre intérieure',
    'meteren': 'Méteren',
    'fletre': 'Flêtre',
    'caestre': 'Caëstre',
    'oxelaere': 'Oxelaëre',
    'arneke': 'Arnèke',
    'saintemariecappel': 'Sainte-Marie-Cappel',
    'armentieres': 'Armentières',
    'lachapelledarmentieres': 'La Chapelle-d’Armentières',
    'rosendael': 'Rosendaël',
    'teteghem': 'Téteghem',
    'saintgeorgessurlaa': 'Saint-Georges-sur-l’Aa',
    'rexpoede': 'Rexpoëde',
    'cambresis': 'Cambrésis',
    'escaudoeuvres': 'Escaudœuvres',
    'neuvillesaintremy': 'Neuville-Saint-Rémy',
    'masnieres': 'Masnières',
    'villersoutreaux': 'Villers-Outréaux',
    'beauvoisencambresis': 'Beauvois-en-Cambrésis',
    'carnieres': 'Carnières',
    'saintvaastencambresis': 'Saint-Vaast-en-Cambrésis',
    'lecateaucambresis': 'Le Cateau-Cambrésis',
    'rumillyencambresis': 'Rumilly-en-Cambrésis',
    'elincourt': 'Élincourt',
    'ferrierelagrande': 'Ferrière-la-Grande',
    'elesmes': 'Élesmes',
    'solrelechateau': 'Solre-le-Château',
    'taisnieressurhon': 'Taisnières-sur-Hon',
    'avesnessurhelpe': 'Avesnes-sur-Helpe',
    'trelon': 'Trélon',
    'etroeungt': 'Étroeungt',
    'dompierresurhelpe': 'Dompierre-sur-Helpe',
    'metropolelilloise': 'Métropole lilloise'
  };

  /* Normalise : minuscules, sans accent, sans separateur.
     'Villeneuve-d Ascq' -> 'villeneuvedascq'
     'Orchies, Nord, France' -> 'orchies' */
  function normaliser(valeur) {
    if (!valeur) { return ''; }
    var s = String(valeur).toLowerCase();
    s = s.split(',')[0];
    s = s.replace(/\s*\((?:59|nord)[^)]*\)\s*$/, '');
    try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
    s = s.replace(/œ/g, 'oe').replace(/æ/g, 'ae');
    s = s.replace(/[^a-z0-9]/g, '');
    s = s.replace(/^(st)(?=[a-z])/, 'saint');
    return s;
  }

  /* Index : forme normalisee -> { ville, secteur, index } */
  var INDEX_COMMUNES = (function () {
    var index = {};
    for (var secteur in COMMUNES_PAR_SECTEUR) {
      if (!Object.prototype.hasOwnProperty.call(COMMUNES_PAR_SECTEUR, secteur)) { continue; }
      var liste = COMMUNES_PAR_SECTEUR[secteur];
      for (var i = 0; i < liste.length; i++) {
        var cle = normaliser(liste[i]);
        if (!index[cle]) {
          index[cle] = { secteur: secteur, position: i };
        }
      }
    }
    return index;
  })();

  /* Repli tolerant : 'Templeuve' -> 'Templeuve-en-Pevele', 'Saint-Amand' ->
     'Saint-Amand-les-Eaux'. On n'accepte le raccourci que s'il est UNIQUE dans
     la table, pour ne jamais afficher une commune a la place d'une autre. */
  function parPrefixe(cle) {
    if (!cle || cle.length < 5) { return null; }
    var trouve = null;
    for (var k in INDEX_COMMUNES) {
      if (!Object.prototype.hasOwnProperty.call(INDEX_COMMUNES, k)) { continue; }
      if (k.indexOf(cle) === 0) {
        if (trouve) { return null; }
        trouve = INDEX_COMMUNES[k];
      }
    }
    return trouve;
  }

  /* Libelle affichable d'une commune ou d'un secteur. */
  function libelle(nom) {
    var cle = normaliser(nom);
    if (LIBELLES[cle]) { return LIBELLES[cle]; }
    return String(nom).replace(/'/g, '’');
  }

  /* Communes voisines : les entrees les plus proches dans le tableau du secteur. */
  function voisines(secteur, ville, maximum) {
    var liste = COMMUNES_PAR_SECTEUR[secteur];
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
      sortie.push(libelle(candidats[k].nom));
    }
    sortie.sort(function (a, b) { return a.localeCompare(b, 'fr'); });
    return sortie;
  }

  /* Preposition correcte : 'a Lille', 'au Cateau-Cambresis', 'a La Madeleine'. */
  function aVille(nomAffiche) {
    if (!nomAffiche) { return ''; }
    if (/^Le\s/.test(nomAffiche)) { return 'au ' + nomAffiche.slice(3); }
    if (/^Les\s/.test(nomAffiche)) { return 'aux ' + nomAffiche.slice(4); }
    return 'à ' + nomAffiche;
  }

  /* Preposition secteur : 'en Pevele', 'dans le Douaisis', 'dans le Nord'. */
  function enSecteur(secteurAffiche) {
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
   * @param {string} villeBrute  valeur de ?ville= ou de l'en-tete geo
   * @param {string} codePostal  code postal eventuel (fiabilise le repli 59)
   * @returns {{ville:string, secteur:string, secteurBrut:string, aVille:string,
   *            enSecteur:string, voisines:string[], connue:boolean, dansLeNord:boolean}}
   */
  function resoudreGeo(villeBrute, codePostal) {
    var repli = {
      ville: '', secteur: SECTEUR_DEFAUT, secteurBrut: '',
      aVille: 'dans le Nord', enSecteur: 'dans le Nord',
      voisines: [], connue: false, dansLeNord: false
    };
    var cle = normaliser(villeBrute);
    if (!cle) {
      if (codePostal && /^59/.test(String(codePostal))) { repli.dansLeNord = true; }
      return repli;
    }
    var trouve = INDEX_COMMUNES[cle] || parPrefixe(cle);
    if (!trouve) {
      /* Commune inconnue : on ne l'affiche pas, mais si le code postal est en 59
         on reste sur le repli generique "le Nord" (exigence du brief). */
      if (codePostal && /^59/.test(String(codePostal))) { repli.dansLeNord = true; }
      return repli;
    }
    var villeAffichee = libelle(COMMUNES_PAR_SECTEUR[trouve.secteur][trouve.position]);
    var secteurAffiche = libelle(trouve.secteur);
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

  global.MCN_GEO = {
    resoudre: resoudreGeo,
    communesParSecteur: COMMUNES_PAR_SECTEUR,
    normaliser: normaliser,
    libelle: libelle,
    aVille: aVille,
    enSecteur: enSecteur,
    secteurDefaut: SECTEUR_DEFAUT
  };
})(window);
