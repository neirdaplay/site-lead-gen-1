/*!
 * site.js — script commun à toutes les pages.
 *
 *  1. Menu de l'en-tête (bouton mobile + sous-menu « Aides Isolation »)
 *  2. Formulaire pas à pas, construit dans #formulaire
 *  3. Barre collante du bas
 *
 * Le formulaire est le même sur toutes les pages. Ce qui change vient des
 * attributs de #formulaire :
 *   data-projet="Isolation extérieure (ITE)"   projet fixé par la page
 *   data-projet=""                              on pose la question
 */
(function () {
  'use strict';

  /* ================================================================
     Configuration — à ajuster
     ================================================================ */
  var CONFIG = {
    /* [A REMPLACER] numéro affiché dans l'en-tête. Vide = masqué. */
    telephone: '',
    /* Départements acceptés (2 premiers chiffres du code postal). */
    departements: ['59'],
    /* Adresse de la fonction serveur (api/lead.js). */
    envoi: '/api/lead'
  };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function tracer(evenement, donnees) {
    window.dataLayer = window.dataLayer || [];
    var d = donnees || {}; d.event = evenement;
    window.dataLayer.push(d);
  }

  var ICO = {
    retour: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    lieu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    personne: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>',
    tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 16.5v.5"/></svg>'
  };

  /* ================================================================
     1. Menu
     ================================================================ */
  var entete = $('.entete');
  var boutonMenu = $('.menu-bouton');
  if (boutonMenu && entete) {
    boutonMenu.addEventListener('click', function () {
      var ouvert = entete.classList.toggle('menu-ouvert');
      boutonMenu.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });
  }
  $$('.menu__btn').forEach(function (b) {
    b.addEventListener('click', function () {
      b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
    });
  });
  /* Page courante surlignée dans le menu */
  var chemin = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  $$('.menu a').forEach(function (a) {
    if (a.getAttribute('href') === chemin) { a.setAttribute('aria-current', 'page'); }
  });

  if (CONFIG.telephone) {
    $$('[data-tel]').forEach(function (lien) {
      lien.href = 'tel:' + CONFIG.telephone.replace(/[^0-9+]/g, '');
      var t = $('[data-tel-texte]', lien); if (t) { t.textContent = CONFIG.telephone; }
      lien.hidden = false;
    });
  }

  $$('[data-cta]').forEach(function (a) {
    a.addEventListener('click', function () { tracer('cta_click', { emplacement: a.dataset.cta }); });
  });

  /* ================================================================
     2. Formulaire
     ================================================================ */
  var carte = $('#formulaire');
  var corpsCarte = $('#formulaire-corps');
  if (!carte || !corpsCarte) { return; }

  var projetFixe = carte.getAttribute('data-projet') || '';

  function option(nom, valeur, ico, libelle) {
    return '<label class="option"><input type="radio" name="' + nom + '" value="' + valeur + '">' +
      '<span class="option__ico" aria-hidden="true">' + ico + '</span>' + libelle + '</label>';
  }

  /* Chaque étape : un <fieldset class="etape">. Les étapes à choix avancent
     seules ; les étapes à saisie ont leur bouton. */
  var etapesHtml = [];

  if (!projetFixe) {
    etapesHtml.push(
      '<fieldset class="etape" data-nom="projet"><legend>Quel est votre projet&nbsp;?</legend><div class="choix">' +
      option('projet', 'Isolation extérieure (ITE)', '🧱', 'Isoler les murs par l’extérieur') +
      option('projet', 'Isolation des combles', '🏠', 'Isoler les combles') +
      option('projet', 'Pompe à chaleur air/eau', '♨️', 'Pompe à chaleur') +
      option('projet', 'Ne sait pas encore', '💬', 'Je ne sais pas encore') +
      '</div></fieldset>');
  }

  etapesHtml.push(
    '<fieldset class="etape" data-nom="logement"><legend>Vous vivez en&nbsp;:</legend><div class="choix">' +
    option('logement', 'Maison', '🏡', 'Maison') +
    option('logement', 'Appartement', '🏢', 'Appartement') +
    '</div></fieldset>',

    '<fieldset class="etape" data-nom="statut"><legend>Vous êtes&nbsp;:</legend><div class="choix">' +
    option('statut', 'Propriétaire', '🏠', 'Propriétaire') +
    option('statut', 'Locataire', '🔑', 'Locataire') +
    '</div></fieldset>',

    '<fieldset class="etape" data-nom="chauffage"><legend>Aujourd’hui, comment chauffez-vous principalement votre maison&nbsp;?</legend><div class="choix choix--3">' +
    option('chauffage', 'Fioul', '🛢️', 'Chauffage au fioul') +
    option('chauffage', 'Électrique', '⚡', 'Chauffage électrique') +
    option('chauffage', 'Gaz', '💧', 'Chauffage au gaz') +
    option('chauffage', 'Bois', '🔥', 'Chauffage au bois') +
    option('chauffage', 'Pompe à chaleur', '🌿', 'Pompe à chaleur') +
    option('chauffage', 'Charbon', '⛏️', 'Chauffage au charbon') +
    '</div></fieldset>',

    '<fieldset class="etape" data-nom="coordonnees"><legend>Vos coordonnées</legend>' +
    '<p class="etape__note">Pour calculer les aides disponibles dans votre commune</p>' +
    '<div class="champ">' + ICO.lieu + '<input id="cp" name="code_postal" type="text" inputmode="numeric" autocomplete="postal-code" maxlength="5" placeholder="Code postal (ex : 59000)" aria-label="Code postal"><p class="champ__erreur" id="err-cp"></p></div>' +
    '<div class="duo">' +
    '<div class="champ">' + ICO.personne + '<input id="prenom" name="prenom" type="text" autocomplete="given-name" placeholder="Prénom" aria-label="Prénom"></div>' +
    '<div class="champ">' + ICO.personne + '<input id="nom" name="nom" type="text" autocomplete="family-name" placeholder="Nom" aria-label="Nom"></div>' +
    '</div>' +
    '<button type="button" class="btn-etape" data-suivant disabled>Continuer</button></fieldset>',

    '<fieldset class="etape" data-nom="contact"><legend>Dernière étape&nbsp;!</legend>' +
    '<p class="etape__note">Un conseiller vous rappelle pour confirmer vos aides</p>' +
    '<div class="champ">' + ICO.tel + '<input id="tel" name="telephone" type="tel" inputmode="tel" autocomplete="tel" placeholder="Téléphone (ex : 06 12 34 56 78)" aria-label="Téléphone"><p class="champ__erreur" id="err-tel">Indiquez un numéro à 10 chiffres, par exemple 06 12 34 56 78.</p></div>' +
    '<div class="champ">' + ICO.mail + '<input id="email" name="email" type="email" autocomplete="email" placeholder="E-mail" aria-label="E-mail"><p class="champ__erreur" id="err-email">Cette adresse e-mail semble incomplète.</p></div>' +
    '<button type="submit" class="btn-etape" id="envoyer" disabled>Obtenir mon estimation</button></fieldset>'
  );

  var cachesUtm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid']
    .map(function (n) { return '<input type="hidden" name="' + n + '">'; }).join('');

  corpsCarte.innerHTML =
    '<button type="button" class="precedent" id="precedent" hidden>' + ICO.retour + 'Précédent</button>' +
    '<form id="form-lead" method="POST" action="' + CONFIG.envoi + '" novalidate>' +
    '<input type="hidden" name="formulaire" value="' + (carte.getAttribute('data-page') || 'site') + '">' +
    (projetFixe ? '<input type="hidden" name="projet" value="' + projetFixe + '">' : '') +
    '<input type="hidden" name="page">' + cachesUtm +
    '<p class="hp"><label>Ne pas remplir <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>' +
    etapesHtml.join('') +
    '<p class="alerte" id="alerte-envoi" role="alert"></p>' +
    '</form>' +
    '<div class="ecran ecran--stop" id="ecran-stop" role="status">' +
    '<div class="ecran__ico">' + ICO.stop + '</div><h3>Désolé, vous n’êtes pas concerné(e)</h3>' +
    '<p id="stop-texte"></p>' +
    '<button type="button" class="btn-etape" id="stop-retour">Modifier ma réponse</button></div>' +
    '<div class="ecran" id="ecran-merci" role="status" tabindex="-1">' +
    '<div class="ecran__ico">' + ICO.ok + '</div><h3>Merci <span id="merci-prenom"></span>, c’est bien reçu&nbsp;!</h3>' +
    '<p>Un conseiller vous rappelle <strong>sous 24&nbsp;h ouvrées</strong> pour calculer vos aides et répondre à vos questions.</p></div>' +
    '<p class="mentions-form" id="mentions-form">En validant, vous acceptez d’être recontacté(e) au sujet de votre projet. ' +
    '<a href="https://www.bloctel.gouv.fr" target="_blank" rel="noopener nofollow">bloctel.gouv.fr</a> · ' +
    '<a href="/confidentialite">Confidentialité</a></p>';

  var form = $('#form-lead');
  var etapes = $$('.etape', form);
  var total = etapes.length;
  var courante = 0;
  var btnPrecedent = $('#precedent');
  var barre = $('#barre');
  var progression = $('.progression');
  var ecranStop = $('#ecran-stop');
  var demarre = false;

  /* Paramètres publicitaires */
  try {
    var params = new URLSearchParams(window.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'].forEach(function (cle) {
      if (params.get(cle)) { form.elements[cle].value = params.get(cle).slice(0, 200); }
    });
  } catch (e) {}
  form.elements.page.value = window.location.pathname;

  function majProgression(i) {
    var pct = Math.round(((i + 1) / total) * 100);
    barre.style.width = pct + '%';
    if (progression) { progression.setAttribute('aria-valuenow', String(pct)); }
  }

  function afficher(i) {
    etapes.forEach(function (e, k) { e.classList.toggle('est-active', k === i); });
    courante = i;
    majProgression(i);
    btnPrecedent.hidden = i === 0;
  }

  function remonter() {
    var haut = carte.getBoundingClientRect().top;
    if (haut < 0 || haut > window.innerHeight * 0.6) { carte.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  function avancer() {
    if (courante >= total - 1) { return; }
    tracer('form_step', { etape: etapes[courante].dataset.nom });
    afficher(courante + 1);
    var champ = etapes[courante].querySelector('input:not([type=radio])');
    if (champ && window.matchMedia('(min-width: 760px)').matches) { champ.focus({ preventScroll: true }); }
    remonter();
  }

  /* Écran « non concerné » : appartement ou locataire */
  var MESSAGES_STOP = {
    Appartement: 'Les aides et les travaux que nous proposons concernent uniquement les <strong>maisons individuelles</strong>. Si vous possédez aussi une maison dans le Nord, vous pouvez modifier votre réponse.',
    Locataire: 'Les aides à la rénovation sont réservées aux <strong>propriétaires</strong>. Vous pouvez en parler à votre propriétaire : c’est lui qui peut faire la demande.'
  };
  function arreter(valeur) {
    form.hidden = true;
    btnPrecedent.hidden = true;
    $('#stop-texte').innerHTML = MESSAGES_STOP[valeur];
    ecranStop.classList.add('est-visible');
    tracer('non_eligible', { motif: valeur });
  }
  $('#stop-retour').addEventListener('click', function () {
    ecranStop.classList.remove('est-visible');
    form.hidden = false;
    afficher(courante);
  });

  form.addEventListener('change', function (ev) {
    var cible = ev.target;
    if (cible.type !== 'radio') { return; }
    if (!demarre) { demarre = true; tracer('form_start'); }
    /* Repli pour les navigateurs sans :has() */
    $$('input[name="' + cible.name + '"]', form).forEach(function (r) { r.closest('.option').classList.toggle('est-coche', r.checked); });
    if (MESSAGES_STOP[cible.value]) { setTimeout(function () { arreter(cible.value); }, 250); return; }
    setTimeout(avancer, 250);
  });

  btnPrecedent.addEventListener('click', function () { if (courante > 0) { afficher(courante - 1); } });

  /* ---------- Validation des champs ---------- */
  var cp = form.elements.code_postal, prenom = form.elements.prenom, nom = form.elements.nom,
      tel = form.elements.telephone, email = form.elements.email;

  function telNormalise(v) { return v.replace(/[\s.\-()]/g, '').replace(/^\+33/, '0').replace(/^0033/, '0'); }
  function cpOk() { return /^\d{5}$/.test(cp.value) && CONFIG.departements.indexOf(cp.value.slice(0, 2)) !== -1; }
  function coordOk() { return cpOk() && prenom.value.trim().length >= 2 && nom.value.trim().length >= 2; }
  function telOk() { return /^0[1-9]\d{8}$/.test(telNormalise(tel.value)); }
  function emailOk() { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()); }

  function erreur(id, champ, visible, message) {
    var el = $('#' + id);
    if (message) { el.textContent = message; }
    el.classList.toggle('est-visible', visible);
    champ.setAttribute('aria-invalid', visible ? 'true' : 'false');
  }

  var btnCoord = $('[data-suivant]', form);
  var btnEnvoyer = $('#envoyer');

  cp.addEventListener('input', function () {
    cp.value = cp.value.replace(/\D/g, '').slice(0, 5);
    if (cp.value.length === 5 && !cpOk()) {
      erreur('err-cp', cp, true, 'Désolé, nous intervenons uniquement dans le département du Nord (59).');
      tracer('hors_zone', { code_postal: cp.value });
    } else {
      erreur('err-cp', cp, false);
    }
  });
  [cp, prenom, nom].forEach(function (c) { c.addEventListener('input', function () { btnCoord.disabled = !coordOk(); }); });
  [tel, email].forEach(function (c) { c.addEventListener('input', function () { btnEnvoyer.disabled = !(telOk() && emailOk()); }); });
  tel.addEventListener('blur', function () { if (tel.value) { erreur('err-tel', tel, !telOk()); } });
  email.addEventListener('blur', function () { if (email.value) { erreur('err-email', email, !emailOk()); } });

  btnCoord.addEventListener('click', function () { if (coordOk()) { avancer(); } });
  /* Entrée dans un champ de l'étape coordonnées = Continuer */
  [cp, prenom, nom].forEach(function (c) {
    c.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); if (coordOk()) { avancer(); } }
    });
  });

  /* ---------- Envoi ---------- */
  var envoi = false;
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (envoi) { return; }
    if (!telOk() || !emailOk()) {
      erreur('err-tel', tel, !telOk()); erreur('err-email', email, !emailOk());
      return;
    }
    var alerte = $('#alerte-envoi');
    alerte.classList.remove('est-visible');

    if (window.location.protocol === 'file:') {
      alerte.textContent = 'Aperçu local : l’envoi ne fonctionne qu’une fois le site en ligne.';
      alerte.classList.add('est-visible');
      return;
    }

    envoi = true;
    btnEnvoyer.disabled = true;
    btnEnvoyer.textContent = 'Envoi en cours…';

    fetch(CONFIG.envoi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (r) {
      if (!r.ok) { throw new Error('HTTP ' + r.status); }
      tracer('lead_submit', { projet: (form.elements.projet || {}).value || '', code_postal: cp.value });
      form.hidden = true;
      btnPrecedent.hidden = true;
      $('#mentions-form').hidden = true;
      $('#merci-prenom').textContent = prenom.value.trim();
      barre.style.width = '100%';
      var merci = $('#ecran-merci');
      merci.classList.add('est-visible');
      merci.focus();
    })['catch'](function () {
      envoi = false;
      btnEnvoyer.disabled = false;
      btnEnvoyer.textContent = 'Obtenir mon estimation';
      alerte.textContent = 'L’envoi n’a pas abouti. Vérifiez votre connexion et réessayez.';
      alerte.classList.add('est-visible');
    });
  });

  afficher(0);

  /* ================================================================
     3. Barre collante : visible une fois l'en-tête dépassé
     ================================================================ */
  var barreCollante = $('#barre-collante');
  var hero = $('.hero');
  if (barreCollante && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entrees) {
      var hors = !entrees[0].isIntersecting && !form.hidden;
      barreCollante.classList.toggle('est-visible', hors);
      barreCollante.setAttribute('aria-hidden', hors ? 'false' : 'true');
      $('a', barreCollante).tabIndex = hors ? 0 : -1;
    }, { threshold: 0 }).observe(hero);
  }
})();
