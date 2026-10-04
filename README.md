# Rénov'Nord — page de captation de leads isolation / pompe à chaleur (Nord, 59)

Page d'atterrissage pour des publicités « isolation » et « pompe à chaleur »,
ciblant les propriétaires de 45 à 70 ans du département du Nord.

Site statique sans framework ni étape de build, hébergé sur **Vercel**. La
page tient dans `index.html` (HTML + CSS + JS). Le seul code serveur est la
fonction `api/lead.js`, qui reçoit le formulaire.

---

## 1. Arborescence

```
index.html                 la page (HTML + CSS + JS)
mentions-legales.html      pages légales autonomes
confidentialite.html
conditions-generales.html
api/lead.js                fonction serverless Vercel : reçoit le formulaire
assets/img/                photo de l'en-tête + favicon
assets/fonts/              police DM Sans (licence OFL), auto-hébergée
vercel.json                en-têtes de sécurité, URL propres, redirections
```

URL en ligne (sans `.html`, grâce à `cleanUrls`) : `/`, `/mentions-legales`,
`/confidentialite`, `/conditions-generales` (et `/cgu`). Les anciennes
adresses `/isolation-pac` et `/isolation-pompe-a-chaleur` redirigent vers `/`.

---

## 2. Déploiement sur Vercel

1. Sur vercel.com : **Add New → Project → Import** ce dépôt.
2. Réglages du projet :
   - **Framework Preset : Other**
   - **Build Command, Output Directory, Install Command : vides**
3. **Settings → Git → Production Branch** : choisir la branche qui doit être
   en ligne (celle qui contient ce README). Les autres branches ne donnent
   que des prévisualisations.
4. Ajouter les variables d'environnement (§ 3), puis **Deploy**.
5. **Settings → Domains** : ajouter le domaine.

Après chaque modification de variable d'environnement, **redéployer**.

---

## 3. Réception des leads — variables d'environnement

Vercel **ne stocke pas** les formulaires : un lead n'existe que s'il arrive
sur au moins un canal. Configurez-en **au moins deux**.

| Variable | Canal | Rôle |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Telegram | Jeton du bot (`@BotFather` → `/newbot`) |
| `TELEGRAM_CHAT_ID` | Telegram | Identifiant du groupe qui reçoit les alertes |
| `RESEND_API_KEY` | E-mail | Clé API resend.com |
| `LEAD_EMAIL_TO` | E-mail | Destinataire(s), séparés par des virgules |
| `LEAD_EMAIL_FROM` | E-mail (facultatif) | Expéditeur sur un domaine vérifié dans Resend |
| `LEAD_WEBHOOK_URL` | Webhook | Make / Zapier / Google Apps Script / CRM — reçoit le lead en JSON |

**Telegram :** créer le bot avec `@BotFather`, l'ajouter à un groupe, y écrire
un message, puis ouvrir `https://api.telegram.org/bot<JETON>/getUpdates` et
relever `message.chat.id` (négatif pour un groupe).

**Historique des leads :** le plus simple est un webhook Make ou Zapier qui
ajoute une ligne dans un Google Sheet.

Comportement de `api/lead.js` :

| Cas | Réponse | Ce que voit le visiteur |
|---|---|---|
| Au moins un canal a accepté | `200` | Écran de remerciement |
| Aucun canal configuré / tous en échec | `502` | Message d'erreur (le lead est écrit dans **Vercel → Logs** en dernier recours) |
| Téléphone invalide | `400` | Message d'erreur |
| Champ anti-robot rempli | `200` | Rien n'est transmis |

Pour tester l'envoi en local : `npx vercel dev` avec les variables dans un
fichier `.env` (jamais versionné, `.gitignore` le bloque).

---

## 4. Le formulaire

Une question par écran, avancement automatique au clic :

1. Maison / appartement
2. Projet (murs par l'extérieur, combles, pompe à chaleur, je ne sais pas)
3. Statut (propriétaire occupant, bailleur, locataire)
4. Chauffage actuel
5. Période de construction
6. Personnes au foyer
7. Revenu fiscal de référence — tranches MaPrimeRénov' calculées selon la
   taille du foyer (`CONFIG.plafonds`)
8. Code postal (**59 uniquement**, `CONFIG.departements`) et coordonnées

Les paramètres `utm_*`, `fbclid` et `gclid` de l'URL publicitaire sont
recopiés dans des champs cachés et partent avec le lead.

Événements poussés dans `window.dataLayer` : `form_start`, `form_step`,
`cta_click`, `hors_zone`, `lead_submit`.

---

## 5. À compléter avant diffusion

Repérés par `[A REMPLACER]` dans la page et surlignés en jaune (classe
`a-completer`) dans les pages légales :
`grep -rn "A REMPLACER\|a-completer" *.html`

1. Nom et logo de la marque (provisoirement « Rénov'Nord »).
2. Chiffres et note 4,8/5 de l'en-tête : uniquement des chiffres réels.
3. **Avis clients : ce sont des exemples de mise en page.** Les remplacer par
   de vrais avis avant toute diffusion (faux avis = pratique commerciale
   trompeuse).
4. Exemples de chantiers : idéalement de vrais chantiers.
5. Téléphone de l'en-tête : `CONFIG.telephone` (vide = masqué).
6. Plafonds de revenus `CONFIG.plafonds` : barème 2025 hors Île-de-France, à
   vérifier sur france-renov.gouv.fr.
7. Pages légales : entreprise RGE partenaire, nom de domaine, médiateur de la
   consommation, crédit de la photo, adresse de Vercel, services d'e-mail /
   webhook utilisés.
8. Pixel Meta ou balise Google : non installés. Il faudra ajouter leurs
   domaines dans la CSP de `vercel.json`, un bandeau de consentement, et
   mettre à jour la section « Cookies » de `confidentialite.html`.
