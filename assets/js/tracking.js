/*!
 * tracking.js — Mon Couvreur Nord
 * Attribution first-party, dataLayer, Consent Mode v2, bandeau cookies.
 * Vanilla, aucune dependance. Charge en defer.
 *
 * IMPORTANT : la valeur par defaut du Consent Mode (« denied » partout) est
 * posee par le script INLINE du <head>, avant le conteneur GTM. Ce fichier
 * ne fait que la mettre a jour selon le choix de l'utilisateur.
 */
(function (window, document) {
  'use strict';

  /* ================================================================
     Configuration
     ================================================================ */
  var CONFIG = window.MCN_CONFIG || {};

  /* Duree de vie du cookie d'attribution, en jours. */
  var DUREE_ATTRIBUTION = 90;

  /* Nom du cookie first-party d'attribution. */
  var COOKIE_ATTR = 'attr';

  /* Nom du cookie de consentement. */
  var COOKIE_CONSENT = 'mcn_consent';
  var DUREE_CONSENT = 182; /* 6 mois : recommandation CNIL */

  /* Parametres captes dans l'URL. */
  var PARAMS = [
    'gclid', 'gbraid', 'wbraid', 'msclkid',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'intent', 'ville', 'kw', 'matchtype', 'device', 'placement', 'campaignid', 'adgroupid'
  ];

  /* ================================================================
     Utilitaires cookies (first-party uniquement)
     ================================================================ */
  function ecrireCookie(nom, valeur, jours) {
    var date = new Date();
    date.setTime(date.getTime() + jours * 864e5);
    var securise = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = nom + '=' + encodeURIComponent(valeur) +
      '; expires=' + date.toUTCString() +
      '; path=/; SameSite=Lax' + securise;
  }

  function lireCookie(nom) {
    var morceaux = document.cookie ? document.cookie.split('; ') : [];
    for (var i = 0; i < morceaux.length; i++) {
      var paire = morceaux[i].split('=');
      if (paire[0] === nom) {
        try { return decodeURIComponent(paire.slice(1).join('=')); }
        catch (e) { return paire.slice(1).join('='); }
      }
    }
    return '';
  }

  function supprimerCookie(nom) {
    document.cookie = nom + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  }

  /* Supprime les cookies poses par Google/Microsoft si l'utilisateur refuse. */
  function purgerCookiesTiers() {
    var prefixes = ['_ga', '_gid', '_gcl', '_gac', '_clck', '_clsk', 'CLID', 'MUID', 'SM', 'ANONCHK'];
    var morceaux = document.cookie ? document.cookie.split('; ') : [];
    var hote = window.location.hostname;
    var domaines = ['', hote, '.' + hote];
    var racine = hote.split('.').slice(-2).join('.');
    if (racine !== hote) { domaines.push('.' + racine); }
    for (var i = 0; i < morceaux.length; i++) {
      var nom = morceaux[i].split('=')[0];
      for (var p = 0; p < prefixes.length; p++) {
        if (nom.indexOf(prefixes[p]) === 0) {
          for (var d = 0; d < domaines.length; d++) {
            document.cookie = nom + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' +
              (domaines[d] ? '; domain=' + domaines[d] : '');
          }
        }
      }
    }
  }

  /* ================================================================
     Attribution
     ================================================================ */
  function parametresURL() {
    var sortie = {};
    var recherche = window.location.search;
    if (!recherche || recherche.length < 2) { return sortie; }
    var paires = recherche.substring(1).split('&');
    for (var i = 0; i < paires.length; i++) {
      var separateur = paires[i].indexOf('=');
      if (separateur === -1) { continue; }
      var cle = decodeURIComponent(paires[i].substring(0, separateur));
      var valeur = decodeURIComponent(
        paires[i].substring(separateur + 1).replace(/\+/g, ' ')
      );
      if (PARAMS.indexOf(cle) !== -1 && valeur) {
        sortie[cle] = valeur.substring(0, 255);
      }
    }
    return sortie;
  }

  function lireAttribution() {
    var brut = lireCookie(COOKIE_ATTR);
    if (!brut) { return {}; }
    try {
      var objet = JSON.parse(brut);
      return (objet && typeof objet === 'object') ? objet : {};
    } catch (e) { return {}; }
  }

  /*
   * Fusionne l'attribution existante avec les parametres de l'URL courante.
   * REGLE : on n'ecrase JAMAIS une valeur existante par une valeur vide.
   * Un visiteur qui revient en direct conserve son attribution d'origine.
   */
  function majAttribution() {
    var existante = lireAttribution();
    var nouvelle = parametresURL();
    var fusion = {};
    var cle;

    for (cle in existante) {
      if (Object.prototype.hasOwnProperty.call(existante, cle)) {
        fusion[cle] = existante[cle];
      }
    }
    var aChange = false;
    for (cle in nouvelle) {
      if (!Object.prototype.hasOwnProperty.call(nouvelle, cle)) { continue; }
      if (nouvelle[cle] && fusion[cle] !== nouvelle[cle]) {
        fusion[cle] = nouvelle[cle];
        aChange = true;
      }
    }

    /* Premiere visite : on horodate et on garde la page d'entree. */
    if (!fusion.premiereVisite) {
      fusion.premiereVisite = new Date().toISOString();
      fusion.pageEntree = window.location.pathname + window.location.search;
      if (document.referrer) { fusion.referrer = document.referrer.substring(0, 255); }
      aChange = true;
    }
    fusion.derniereVisite = new Date().toISOString();

    if (aChange || !lireCookie(COOKIE_ATTR)) {
      ecrireCookie(COOKIE_ATTR, JSON.stringify(fusion), DUREE_ATTRIBUTION);
    } else {
      /* Prolonge la fenetre glissante de 90 jours. */
      ecrireCookie(COOKIE_ATTR, JSON.stringify(fusion), DUREE_ATTRIBUTION);
    }
    return fusion;
  }

  /* ================================================================
     dataLayer
     ================================================================ */
  window.dataLayer = window.dataLayer || [];

  function pousser(evenement, donnees) {
    var charge = { event: evenement };
    if (donnees) {
      for (var cle in donnees) {
        if (Object.prototype.hasOwnProperty.call(donnees, cle)) {
          charge[cle] = donnees[cle];
        }
      }
    }
    window.dataLayer.push(charge);
    if (CONFIG.debug) { /* eslint-disable-next-line no-console */
      console.log('[dataLayer]', charge);
    }
  }

  /* ================================================================
     Consent Mode v2
     ================================================================ */
  function gtag() { window.dataLayer.push(arguments); }

  var CATEGORIES = ['necessaire', 'mesure', 'publicite'];

  function lireConsentement() {
    var brut = lireCookie(COOKIE_CONSENT);
    if (!brut) { return null; }
    try {
      var objet = JSON.parse(brut);
      if (!objet || typeof objet !== 'object') { return null; }
      return objet;
    } catch (e) { return null; }
  }

  function appliquerConsentement(choix, tracer) {
    var mesure = choix.mesure ? 'granted' : 'denied';
    var pub = choix.publicite ? 'granted' : 'denied';

    gtag('consent', 'update', {
      ad_storage: pub,
      ad_user_data: pub,
      ad_personalization: pub,
      analytics_storage: mesure
    });

    if (!choix.mesure && !choix.publicite) { purgerCookiesTiers(); }

    if (tracer) {
      pousser('consent_update', {
        consent_mesure: choix.mesure ? 'granted' : 'denied',
        consent_publicite: choix.publicite ? 'granted' : 'denied'
      });
    }

    /* Mode « strict » : le conteneur n'est charge qu'apres acceptation.
       Mode « avance » (defaut, cf. README) : le conteneur est deja charge
       par le <head> avec un consentement refuse, sans aucun cookie. */
    if (CONFIG.chargerGtmApresChoix && (choix.mesure || choix.publicite)) {
      chargerGTM();
    }
  }

  function enregistrerConsentement(choix) {
    var enregistrement = {
      necessaire: true,
      mesure: !!choix.mesure,
      publicite: !!choix.publicite,
      date: new Date().toISOString(),
      version: 1
    };
    ecrireCookie(COOKIE_CONSENT, JSON.stringify(enregistrement), DUREE_CONSENT);
    appliquerConsentement(enregistrement, true);
    return enregistrement;
  }

  var gtmCharge = false;
  function chargerGTM() {
    if (gtmCharge) { return; }
    var id = CONFIG.gtmId;
    if (!id || id.indexOf('X') !== -1) { return; } /* placeholder non remplace */
    gtmCharge = true;
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  /* ================================================================
     Bandeau cookies
     ================================================================ */
  function initBandeau() {
    var bandeau = document.getElementById('bandeau-cookies');
    if (!bandeau) { return; }

    var reglages = document.getElementById('cookies-reglages');
    var caseMesure = document.getElementById('cookie-mesure');
    var casePub = document.getElementById('cookie-publicite');

    function fermer() { bandeau.classList.remove('est-visible'); }
    function ouvrir() { bandeau.classList.add('est-visible'); }

    var dejaChoisi = lireConsentement();
    if (!dejaChoisi) {
      ouvrir();
    } else {
      appliquerConsentement(dejaChoisi, false);
      if (caseMesure) { caseMesure.checked = !!dejaChoisi.mesure; }
      if (casePub) { casePub.checked = !!dejaChoisi.publicite; }
    }

    var boutonTout = document.getElementById('cookies-accepter');
    var boutonRien = document.getElementById('cookies-refuser');
    var boutonPerso = document.getElementById('cookies-personnaliser');
    var boutonEnregistrer = document.getElementById('cookies-enregistrer');

    if (boutonTout) {
      boutonTout.addEventListener('click', function () {
        enregistrerConsentement({ mesure: true, publicite: true });
        fermer();
      });
    }
    if (boutonRien) {
      boutonRien.addEventListener('click', function () {
        enregistrerConsentement({ mesure: false, publicite: false });
        fermer();
      });
    }
    if (boutonPerso && reglages) {
      boutonPerso.addEventListener('click', function () {
        var ouvert = reglages.classList.toggle('est-visible');
        boutonPerso.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      });
    }
    if (boutonEnregistrer) {
      boutonEnregistrer.addEventListener('click', function () {
        enregistrerConsentement({
          mesure: caseMesure ? caseMesure.checked : false,
          publicite: casePub ? casePub.checked : false
        });
        fermer();
      });
    }

    /* Lien « Gerer mes cookies » du pied de page. */
    var liens = document.querySelectorAll('[data-action="gerer-cookies"]');
    for (var i = 0; i < liens.length; i++) {
      liens[i].addEventListener('click', function (evenement) {
        evenement.preventDefault();
        if (reglages) { reglages.classList.add('est-visible'); }
        ouvrir();
        var premier = document.getElementById('cookies-accepter');
        if (premier) { premier.focus(); }
      });
    }
  }

  /* ================================================================
     Clics telephone (conversion secondaire)
     ================================================================ */
  function initTelephone() {
    document.addEventListener('click', function (evenement) {
      var cible = evenement.target;
      while (cible && cible !== document.body) {
        if (cible.tagName === 'A' && (cible.getAttribute('href') || '').indexOf('tel:') === 0) {
          pousser('phone_click', {
            emplacement: cible.getAttribute('data-emplacement') || 'inconnu',
            numero: cible.getAttribute('href').replace('tel:', '')
          });
          return;
        }
        cible = cible.parentNode;
      }
    }, true);
  }

  /* ================================================================
     Champs caches d'attribution injectes a la soumission
     ================================================================ */
  function injecterChampsCaches(formulaire, attribution) {
    if (!formulaire) { return; }
    var conteneur = formulaire.querySelector('[data-attribution]');
    if (!conteneur) { return; }
    conteneur.innerHTML = '';
    for (var cle in attribution) {
      if (!Object.prototype.hasOwnProperty.call(attribution, cle)) { continue; }
      var champ = document.createElement('input');
      champ.type = 'hidden';
      champ.name = 'attr_' + cle;
      champ.value = attribution[cle];
      conteneur.appendChild(champ);
    }
  }

  /* ================================================================
     Demarrage
     ================================================================ */
  var attribution = majAttribution();

  function demarrer() {
    initBandeau();
    initTelephone();
    injecterChampsCaches(document.getElementById('formulaire-devis'), attribution);
    pousser('page_ready', {
      page_type: document.body.getAttribute('data-page') || 'autre',
      ville_detectee: (window.__GEO && window.__GEO.ville) || '',
      secteur_detecte: (window.__GEO && window.__GEO.secteur) || ''
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }

  /* API publique consommee par form.js */
  window.MCN_TRACK = {
    pousser: pousser,
    attribution: function () { return lireAttribution(); },
    consentement: lireConsentement,
    chargerGTM: chargerGTM
  };
})(window, document);
