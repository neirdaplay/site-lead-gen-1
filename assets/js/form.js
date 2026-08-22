/*!
 * form.js — Mon Couvreur Nord
 * Formulaire en 5 etapes, auto-avance, disqualification, anti-abandon.
 * Vanilla, aucune dependance. Charge en defer.
 */
(function (window, document) {
  'use strict';

  var CONFIG = window.MCN_CONFIG || {};
  var ENDPOINT = CONFIG.endpoint || '/.netlify/functions/submit-lead';
  var NB_ETAPES = 5;
  var CLE_SESSION = 'mcn_devis_v1';
  var DELAI_AVANCE = 260; /* ms : laisse voir l'etat selectionne avant de passer */

  var formulaire = document.getElementById('formulaire-devis');
  if (!formulaire) { return; }

  /* ================================================================
     Etat
     ================================================================ */
  var etat = {
    id: '',
    etape: 1,
    demarre: false,
    envoi: false,
    reponses: {
      besoin: '', statut: '', logement: '',
      surface: '', delai: '', codePostal: '',
      prenom: '', nom: '', telephone: '', email: ''
    }
  };

  function identifiant() {
    try {
      if (window.crypto && window.crypto.randomUUID) { return window.crypto.randomUUID(); }
    } catch (e) {}
    return 'mcn-' + Date.now().toString(36) + '-' +
      Math.random().toString(36).slice(2, 10);
  }

  /* ================================================================
     Persistance (sessionStorage : survit a un rafraichissement
     accidentel, disparait a la fermeture de l'onglet)
     ================================================================ */
  function sauvegarder() {
    try {
      window.sessionStorage.setItem(CLE_SESSION, JSON.stringify({
        id: etat.id,
        etape: etat.etape,
        reponses: etat.reponses,
        ts: Date.now()
      }));
    } catch (e) { /* navigation privee : on continue sans persistance */ }
  }

  function restaurer() {
    var brut = null;
    try { brut = window.sessionStorage.getItem(CLE_SESSION); } catch (e) { return false; }
    if (!brut) { return false; }
    try {
      var objet = JSON.parse(brut);
      if (!objet || !objet.reponses) { return false; }
      /* On ne restaure pas un parcours vieux de plus de 2 heures. */
      if (objet.ts && (Date.now() - objet.ts) > 72e5) { return false; }
      etat.id = objet.id || identifiant();
      for (var cle in etat.reponses) {
        if (Object.prototype.hasOwnProperty.call(objet.reponses, cle)) {
          etat.reponses[cle] = objet.reponses[cle] || '';
        }
      }
      etat.etape = Math.min(Math.max(parseInt(objet.etape, 10) || 1, 1), NB_ETAPES);
      return true;
    } catch (e) { return false; }
  }

  function effacerSession() {
    try { window.sessionStorage.removeItem(CLE_SESSION); } catch (e) {}
  }

  /* ================================================================
     Raccourcis DOM
     ================================================================ */
  function $(selecteur, racine) { return (racine || document).querySelector(selecteur); }
  function $$(selecteur, racine) {
    return Array.prototype.slice.call((racine || document).querySelectorAll(selecteur));
  }

  var etapes = $$('.etape', formulaire);
  var barre = $('#prog-barre');
  var etiquette = $('#prog-etiquette');
  var pourcent = $('#prog-pourcent');
  var progression = $('#progression');
  var boutonRetour = $('#retour-etape');
  var ecranHorsZone = $('#ecran-hors-zone');
  var ecranProfil = $('#ecran-profil');
  var ecranConfirmation = $('#ecran-confirmation');
  var vivant = $('#formulaire-annonce');

  function tracer(evenement, donnees) {
    if (window.MCN_TRACK && window.MCN_TRACK.pousser) {
      window.MCN_TRACK.pousser(evenement, donnees);
    } else {
      window.dataLayer = window.dataLayer || [];
      var charge = { event: evenement };
      for (var cle in donnees) {
        if (Object.prototype.hasOwnProperty.call(donnees, cle)) { charge[cle] = donnees[cle]; }
      }
      window.dataLayer.push(charge);
    }
  }

  function annoncer(texte) {
    if (vivant) { vivant.textContent = texte; }
  }

  /* ================================================================
     Anti-abandon : ping serveur a chaque changement d'etape.
     Aucun identifiant direct n'est transmis a ce stade (ni nom, ni
     telephone, ni e-mail) : uniquement l'avancement et l'attribution.
     ================================================================ */
  function pingEtape(etiquetteEtape) {
    var charge = {
      type: 'etape',
      id: etat.id,
      etape: etiquetteEtape,
      reponses: {
        besoin: etat.reponses.besoin,
        statut: etat.reponses.statut,
        logement: etat.reponses.logement,
        surface: etat.reponses.surface,
        delai: etat.reponses.delai,
        codePostal: etat.reponses.codePostal
      },
      attribution: attribution(),
      page: {
        url: window.location.href.split('#')[0],
        referrer: document.referrer || ''
      },
      t0: window.__T0 || null,
      dureeMs: Math.round(
        (window.performance && window.performance.now) ? window.performance.now() : 0
      )
    };
    var corps = JSON.stringify(charge);
    try {
      if (navigator.sendBeacon) {
        var paquet = new Blob([corps], { type: 'application/json' });
        if (navigator.sendBeacon(ENDPOINT, paquet)) { return; }
      }
    } catch (e) {}
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: corps,
        keepalive: true
      })['catch'](function () {});
    } catch (e) {}
  }

  function attribution() {
    if (window.MCN_TRACK && window.MCN_TRACK.attribution) {
      return window.MCN_TRACK.attribution();
    }
    return {};
  }

  /* ================================================================
     Navigation entre etapes
     ================================================================ */
  function majProgression(numero) {
    var pct = Math.round((numero / NB_ETAPES) * 100);
    if (barre) { barre.style.width = pct + '%'; }
    if (etiquette) { etiquette.textContent = 'Étape ' + numero + ' sur ' + NB_ETAPES; }
    if (pourcent) { pourcent.textContent = pct + ' %'; }
    if (progression) {
      progression.setAttribute('aria-valuenow', String(pct));
      progression.setAttribute('aria-valuetext', 'Étape ' + numero + ' sur ' + NB_ETAPES);
    }
  }

  function afficherEtape(numero, options) {
    var opts = options || {};
    for (var i = 0; i < etapes.length; i++) {
      var estActive = parseInt(etapes[i].getAttribute('data-etape'), 10) === numero;
      etapes[i].classList.toggle('est-active', estActive);
      etapes[i].hidden = !estActive;
    }
    etat.etape = numero;
    majProgression(numero);

    if (boutonRetour) { boutonRetour.hidden = (numero <= 1); }
    if (progression) { progression.hidden = false; }

    sauvegarder();

    if (!opts.silencieux) {
      tracer('form_step', { step_number: numero, step_name: nomEtape(numero) });
      pingEtape(String(numero));
      annoncer('Étape ' + numero + ' sur ' + NB_ETAPES + ' : ' + nomEtape(numero));
    }

    if (opts.focus !== false) {
      var titre = $('.etape__titre', etapes[numero - 1]);
      if (titre) {
        titre.setAttribute('tabindex', '-1');
        try { titre.focus({ preventScroll: true }); } catch (e) { titre.focus(); }
      }
    }
  }

  function nomEtape(numero) {
    return ({
      1: 'besoin',
      2: 'situation',
      3: 'chantier',
      4: 'code_postal',
      5: 'coordonnees'
    })[numero] || ('etape_' + numero);
  }

  function avancer() {
    if (etat.etape < NB_ETAPES) { afficherEtape(etat.etape + 1); }
  }

  function reculer() {
    if (etat.etape > 1) { afficherEtape(etat.etape - 1); }
  }

  /* ================================================================
     Ecrans de sortie
     ================================================================ */
  function masquerFormulaire() {
    for (var i = 0; i < etapes.length; i++) {
      etapes[i].classList.remove('est-active');
      etapes[i].hidden = true;
    }
    if (progression) { progression.hidden = true; }
    if (boutonRetour) { boutonRetour.hidden = true; }
  }

  function afficherEcran(element) {
    masquerFormulaire();
    if (ecranHorsZone) { ecranHorsZone.hidden = (element !== ecranHorsZone); }
    if (ecranProfil) { ecranProfil.hidden = (element !== ecranProfil); }
    if (ecranConfirmation) { ecranConfirmation.hidden = (element !== ecranConfirmation); }
    if (element) {
      var titre = $('h3', element);
      if (titre) {
        titre.setAttribute('tabindex', '-1');
        try { titre.focus({ preventScroll: true }); } catch (e) { titre.focus(); }
      }
      var haut = formulaire.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: haut > 0 ? haut : 0, behavior: mouvementReduit() ? 'auto' : 'smooth' });
    }
  }

  function mouvementReduit() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /*
   * Disqualification : locataire OU appartement.
   * ATTENTION : cet ecran NE declenche PAS la conversion Google Ads.
   * Il pousse un evenement distinct « lead_disqualified ».
   */
  function disqualifier(motif) {
    var texteMotif = $('#motif-disqualification');
    if (texteMotif) {
      texteMotif.textContent = motif === 'locataire'
        ? 'Vous nous indiquez être locataire du logement.'
        : 'Vous nous indiquez qu’il s’agit d’un appartement ou d’un immeuble en copropriété.';
    }
    tracer('lead_disqualified', {
      motif: motif,
      besoin: etat.reponses.besoin,
      statut: etat.reponses.statut,
      logement: etat.reponses.logement
    });
    pingEtape('disqualifie:' + motif);
    afficherEcran(ecranProfil);
    annoncer('Votre demande ne correspond pas au périmètre du service.');
  }

  /* ================================================================
     Boutons d'options (choix unique)
     ================================================================ */
  function choisir(bouton) {
    var champ = bouton.getAttribute('data-champ');
    var valeur = bouton.getAttribute('data-valeur');
    if (!champ) { return; }

    var groupe = bouton.closest('.options');
    if (groupe) {
      var freres = $$('.option', groupe);
      for (var i = 0; i < freres.length; i++) {
        var actif = freres[i] === bouton;
        freres[i].classList.toggle('est-choisie', actif);
        freres[i].setAttribute('aria-pressed', actif ? 'true' : 'false');
      }
    }
    etat.reponses[champ] = valeur;
    sauvegarder();

    if (!etat.demarre) {
      etat.demarre = true;
      etat.id = etat.id || identifiant();
      tracer('form_start', { premier_champ: champ, premiere_valeur: valeur });
    }

    /* Regles de passage automatique — aucun bouton « suivant ». */
    var numero = parseInt(bouton.closest('.etape').getAttribute('data-etape'), 10);

    if (numero === 1) {
      window.setTimeout(avancer, DELAI_AVANCE);
      return;
    }
    if (numero === 2) {
      if (etat.reponses.statut === 'locataire') {
        window.setTimeout(function () { disqualifier('locataire'); }, DELAI_AVANCE);
        return;
      }
      if (etat.reponses.logement === 'appartement' || etat.reponses.logement === 'copropriete') {
        window.setTimeout(function () { disqualifier('appartement'); }, DELAI_AVANCE);
        return;
      }
      if (etat.reponses.statut && etat.reponses.logement) {
        window.setTimeout(avancer, DELAI_AVANCE);
      }
      return;
    }
    if (numero === 3) {
      if (etat.reponses.surface && etat.reponses.delai) {
        window.setTimeout(avancer, DELAI_AVANCE);
      }
    }
  }

  $$('.option', formulaire).forEach(function (bouton) {
    bouton.addEventListener('click', function () { choisir(bouton); });
  });

  if (boutonRetour) {
    boutonRetour.addEventListener('click', function () { reculer(); });
  }

  /* ================================================================
     Etape 4 — code postal
     ================================================================ */
  var champCP = $('#code-postal');
  var erreurCP = $('#erreur-code-postal');
  var boutonCP = $('#valider-cp');

  function erreur(champ, blocErreur, message) {
    if (blocErreur) {
      blocErreur.textContent = message;
      blocErreur.classList.toggle('est-visible', !!message);
    }
    if (champ) {
      if (message) {
        champ.setAttribute('aria-invalid', 'true');
        try { champ.focus(); } catch (e) {}
      } else {
        champ.removeAttribute('aria-invalid');
      }
    }
  }

  function validerCP() {
    var valeur = (champCP ? champCP.value : '').replace(/\s/g, '');
    if (!/^\d{5}$/.test(valeur)) {
      erreur(champCP, erreurCP, 'Merci d’indiquer un code postal à 5 chiffres.');
      return;
    }
    erreur(champCP, erreurCP, '');
    etat.reponses.codePostal = valeur;
    sauvegarder();

    /* Le code postal saisi PRIME toujours sur la commune detectee. */
    if (valeur.indexOf('59') !== 0) {
      tracer('lead_disqualified', { motif: 'hors_zone', code_postal: valeur });
      pingEtape('hors-zone:' + valeur);
      afficherEcran(ecranHorsZone);
      annoncer('Ce code postal est en dehors de la zone couverte.');
      return;
    }
    avancer();
  }

  if (boutonCP) { boutonCP.addEventListener('click', validerCP); }
  if (champCP) {
    champCP.addEventListener('input', function () {
      champCP.value = champCP.value.replace(/[^\d]/g, '').slice(0, 5);
      if (champCP.value.length === 5) { erreur(champCP, erreurCP, ''); }
    });
    champCP.addEventListener('keydown', function (evenement) {
      if (evenement.key === 'Enter') {
        evenement.preventDefault();
        validerCP();
      }
    });
  }

  /* ================================================================
     Etape 5 — coordonnees
     ================================================================ */
  var champPrenom = $('#prenom');
  var champNom = $('#nom');
  var champTel = $('#telephone');
  var champEmail = $('#email');
  var caseConsentement = $('#consentement');
  var erreurConsentement = $('#erreur-consentement');
  var boutonEnvoi = $('#envoyer');

  /* Formats francais : fixe et mobile, avec ou sans indicatif. */
  var RE_TEL = /^(?:(?:\+|00)33[\s.-]?(?:\(0\)[\s.-]?)?|0)[1-9](?:[\s.-]?\d{2}){4}$/;
  var RE_EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

  function normaliserTel(valeur) {
    var brut = String(valeur || '').replace(/[\s.\-()]/g, '');
    if (brut.indexOf('+33') === 0) { brut = '0' + brut.slice(3); }
    else if (brut.indexOf('0033') === 0) { brut = '0' + brut.slice(4); }
    return brut;
  }

  function validerEtape5() {
    var ok = true;

    if (!champPrenom.value.trim() || champPrenom.value.trim().length < 2) {
      erreur(champPrenom, $('#erreur-prenom'), 'Merci d’indiquer votre prénom.');
      ok = false;
    } else { erreur(champPrenom, $('#erreur-prenom'), ''); }

    if (ok && (!champNom.value.trim() || champNom.value.trim().length < 2)) {
      erreur(champNom, $('#erreur-nom'), 'Merci d’indiquer votre nom.');
      ok = false;
    } else if (champNom.value.trim().length >= 2) {
      erreur(champNom, $('#erreur-nom'), '');
    }

    if (ok && !RE_TEL.test(String(champTel.value).trim())) {
      erreur(champTel, $('#erreur-telephone'),
        'Numéro non reconnu. Exemple : 06 12 34 56 78 ou 03 20 00 00 00.');
      ok = false;
    } else if (RE_TEL.test(String(champTel.value).trim())) {
      erreur(champTel, $('#erreur-telephone'), '');
    }

    if (ok && !RE_EMAIL.test(String(champEmail.value).trim())) {
      erreur(champEmail, $('#erreur-email'), 'Merci d’indiquer une adresse e-mail valide.');
      ok = false;
    } else if (RE_EMAIL.test(String(champEmail.value).trim())) {
      erreur(champEmail, $('#erreur-email'), '');
    }

    if (ok && (!caseConsentement || !caseConsentement.checked)) {
      if (erreurConsentement) {
        erreurConsentement.textContent =
          'Votre accord est nécessaire pour que le professionnel puisse vous rappeler.';
        erreurConsentement.classList.add('est-visible');
      }
      try { caseConsentement.focus(); } catch (e) {}
      ok = false;
    } else if (erreurConsentement) {
      erreurConsentement.classList.remove('est-visible');
    }

    return ok;
  }

  function texteConsentement() {
    var bloc = document.getElementById('texte-consentement');
    return bloc ? bloc.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function chargeUtile(qualifie) {
    return {
      type: 'lead',
      id: etat.id || identifiant(),
      qualified: qualifie !== false,
      besoin: etat.reponses.besoin,
      statut: etat.reponses.statut,
      logement: etat.reponses.logement,
      surface: etat.reponses.surface,
      delai: etat.reponses.delai,
      codePostal: etat.reponses.codePostal,
      prenom: String(champPrenom ? champPrenom.value : '').trim(),
      nom: String(champNom ? champNom.value : '').trim(),
      telephone: normaliserTel(champTel ? champTel.value : ''),
      email: String(champEmail ? champEmail.value : '').trim().toLowerCase(),
      consentTexte: texteConsentement(),
      consentDonne: !!(caseConsentement && caseConsentement.checked),
      attribution: attribution(),
      geo: {
        villeDetectee: (window.__GEO && window.__GEO.ville) || '',
        secteurDetecte: (window.__GEO && window.__GEO.secteur) || '',
        source: (window.__GEO && window.__GEO.source) || 'aucune'
      },
      page: {
        url: window.location.href.split('#')[0],
        referrer: document.referrer || '',
        titre: document.title
      },
      potDeMiel: String(($('#site-web') || {}).value || ''),
      t0: window.__T0 || null,
      dureeMs: Math.round(
        (window.performance && window.performance.now) ? window.performance.now() : 0
      ),
      client: {
        langue: navigator.language || '',
        ecran: (window.screen ? window.screen.width + 'x' + window.screen.height : '')
      }
    };
  }

  function envoyer(charge, boutonSource, surSucces) {
    if (etat.envoi) { return; }
    etat.envoi = true;
    var libelleInitial = boutonSource ? boutonSource.textContent : '';
    if (boutonSource) {
      boutonSource.disabled = true;
      boutonSource.textContent = 'Envoi en cours…';
    }

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(charge)
    }).then(function (reponse) {
      return reponse.json()['catch'](function () { return { ok: reponse.ok }; });
    }).then(function (donnees) {
      etat.envoi = false;
      if (boutonSource) {
        boutonSource.disabled = false;
        boutonSource.textContent = libelleInitial;
      }
      if (donnees && donnees.ok) {
        surSucces(donnees);
      } else {
        echec(donnees && donnees.message);
      }
    })['catch'](function () {
      etat.envoi = false;
      if (boutonSource) {
        boutonSource.disabled = false;
        boutonSource.textContent = libelleInitial;
      }
      echec();
    });
  }

  function echec(message) {
    var bloc = $('#erreur-envoi');
    if (bloc) {
      bloc.textContent = message ||
        'L’envoi n’a pas abouti. Vérifiez votre connexion et réessayez, ou appelez-nous au 07 86 50 55 80.';
      bloc.classList.add('est-visible');
    }
    tracer('form_error', { etape: etat.etape });
  }

  formulaire.addEventListener('submit', function (evenement) {
    evenement.preventDefault();
    if (!validerEtape5()) { return; }
    var bloc = $('#erreur-envoi');
    if (bloc) { bloc.classList.remove('est-visible'); }

    var charge = chargeUtile(true);
    envoyer(charge, boutonEnvoi, function () {
      /* Conversion Google Ads : uniquement ici. */
      tracer('lead_submit', {
        besoin: charge.besoin,
        delai: charge.delai,
        surface: charge.surface,
        code_postal: charge.codePostal,
        valeur_lead: 1
      });
      effacerSession();
      var rappelVille = $('#confirmation-ville');
      if (rappelVille) {
        rappelVille.textContent = charge.codePostal
          ? ('votre demande pour le ' + charge.codePostal)
          : 'votre demande';
      }
      afficherEcran(ecranConfirmation);
    });
  });

  /* ================================================================
     Ecran de disqualification : proposition de transmettre
     l'information au proprietaire (enregistre en qualified:false)
     ================================================================ */
  var dqBouton = $('#dq-envoyer');
  if (dqBouton) {
    dqBouton.addEventListener('click', function () {
      var dqPrenom = $('#dq-prenom');
      var dqEmail = $('#dq-email');
      var dqConsentement = $('#dq-consentement');
      var dqErreur = $('#dq-erreur');

      if (!RE_EMAIL.test(String(dqEmail.value).trim())) {
        dqErreur.textContent = 'Merci d’indiquer une adresse e-mail valide.';
        dqErreur.classList.add('est-visible');
        try { dqEmail.focus(); } catch (e) {}
        return;
      }
      if (!dqConsentement.checked) {
        dqErreur.textContent = 'Votre accord est nécessaire pour vous envoyer ce récapitulatif.';
        dqErreur.classList.add('est-visible');
        return;
      }
      dqErreur.classList.remove('est-visible');

      var charge = {
        type: 'lead',
        id: etat.id || identifiant(),
        qualified: false,
        motifDisqualification: etat.reponses.statut === 'locataire' ? 'locataire' : 'appartement',
        besoin: etat.reponses.besoin,
        statut: etat.reponses.statut,
        logement: etat.reponses.logement,
        surface: etat.reponses.surface,
        delai: etat.reponses.delai,
        codePostal: etat.reponses.codePostal,
        prenom: String(dqPrenom.value).trim(),
        nom: '',
        telephone: '',
        email: String(dqEmail.value).trim().toLowerCase(),
        consentTexte: (document.getElementById('dq-texte-consentement') || {}).textContent || '',
        consentDonne: true,
        attribution: attribution(),
        page: { url: window.location.href.split('#')[0], referrer: document.referrer || '' },
        potDeMiel: String(($('#site-web') || {}).value || ''),
        t0: window.__T0 || null,
        dureeMs: Math.round(
          (window.performance && window.performance.now) ? window.performance.now() : 0
        )
      };
      charge.consentTexte = String(charge.consentTexte).replace(/\s+/g, ' ').trim();

      envoyer(charge, dqBouton, function () {
        /* Toujours PAS de conversion Google Ads sur ce chemin. */
        var zone = $('#dq-formulaire');
        var ok = $('#dq-confirmation');
        if (zone) { zone.hidden = true; }
        if (ok) { ok.hidden = false; }
        effacerSession();
      });
    });
  }

  /* ================================================================
     Preremplissage depuis les tuiles de prestations
     ================================================================ */
  function prerempli(valeur) {
    var bouton = formulaire.querySelector(
      '.option[data-champ="besoin"][data-valeur="' + valeur + '"]'
    );
    afficherEtape(1, { silencieux: true, focus: false });
    if (bouton) {
      var groupe = bouton.closest('.options');
      $$('.option', groupe).forEach(function (frere) {
        var actif = frere === bouton;
        frere.classList.toggle('est-choisie', actif);
        frere.setAttribute('aria-pressed', actif ? 'true' : 'false');
      });
      etat.reponses.besoin = valeur;
      sauvegarder();
      if (!etat.demarre) {
        etat.demarre = true;
        etat.id = etat.id || identifiant();
        tracer('form_start', { premier_champ: 'besoin', premiere_valeur: valeur, origine: 'tuile' });
      }
    }
    var cible = document.getElementById('devis');
    if (cible) {
      var haut = cible.getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({
        top: haut > 0 ? haut : 0,
        behavior: mouvementReduit() ? 'auto' : 'smooth'
      });
    }
    window.setTimeout(function () { avancer(); }, 520);
  }

  $$('[data-prerempli]').forEach(function (element) {
    element.addEventListener('click', function (evenement) {
      evenement.preventDefault();
      prerempli(element.getAttribute('data-prerempli'));
    });
  });

  /* ================================================================
     Ancrage « Ma demande » (header, barre mobile, CTA de section)
     ================================================================ */
  $$('[data-action="aller-au-formulaire"]').forEach(function (element) {
    element.addEventListener('click', function (evenement) {
      evenement.preventDefault();
      var cible = document.getElementById('devis');
      if (!cible) { return; }
      var haut = cible.getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({
        top: haut > 0 ? haut : 0,
        behavior: mouvementReduit() ? 'auto' : 'smooth'
      });
      var premier = formulaire.querySelector('.etape.est-active .option, .etape.est-active input');
      if (premier) {
        window.setTimeout(function () {
          try { premier.focus({ preventScroll: true }); } catch (e) {}
        }, mouvementReduit() ? 0 : 420);
      }
      tracer('cta_formulaire', {
        emplacement: element.getAttribute('data-emplacement') || 'inconnu'
      });
    });
  });

  /* ================================================================
     Initialisation
     ================================================================ */
  function initialiser() {
    var restaure = restaurer();
    etat.id = etat.id || identifiant();

    if (restaure) {
      /* Reapplique les choix visuels et les champs saisis. */
      $$('.option', formulaire).forEach(function (bouton) {
        var champ = bouton.getAttribute('data-champ');
        var valeur = bouton.getAttribute('data-valeur');
        var actif = etat.reponses[champ] === valeur && !!valeur;
        bouton.classList.toggle('est-choisie', actif);
        bouton.setAttribute('aria-pressed', actif ? 'true' : 'false');
      });
      if (champCP && etat.reponses.codePostal) { champCP.value = etat.reponses.codePostal; }
      if (champPrenom && etat.reponses.prenom) { champPrenom.value = etat.reponses.prenom; }
      if (champNom && etat.reponses.nom) { champNom.value = etat.reponses.nom; }
      if (champTel && etat.reponses.telephone) { champTel.value = etat.reponses.telephone; }
      if (champEmail && etat.reponses.email) { champEmail.value = etat.reponses.email; }
      if (etat.reponses.besoin) { etat.demarre = true; }
      afficherEtape(etat.etape, { silencieux: true, focus: false });
    } else {
      afficherEtape(1, { silencieux: true, focus: false });
    }

    /* Sauvegarde des champs texte a la sortie de champ. sessionStorage est
       propre a l'onglet et efface a sa fermeture : rien ne survit a la
       session de navigation, et rien n'est ecrit dans localStorage. */
    [champPrenom, champNom, champTel, champEmail].forEach(function (champ) {
      if (!champ) { return; }
      champ.addEventListener('blur', function () {
        etat.reponses[champ.id] = champ.value;
        sauvegarder();
      });
    });
  }

  initialiser();

  window.MCN_FORM = {
    prerempli: prerempli,
    etat: function () { return { etape: etat.etape, reponses: etat.reponses }; }
  };
})(window, document);
