# Rénov'Nord — pages de captation de leads isolation / pompe à chaleur (Nord, 59)

Page d'atterrissage pour des publicités « isolation » et « pompe à chaleur »,
ciblant les propriétaires de 45 à 70 ans du département du Nord.

Site statique sans framework ni étape de build, hébergé sur **Vercel** :
quatre pages HTML qui partagent un fichier de styles et un script. Le seul
code serveur est la fonction `api/lead.js`, qui reçoit le formulaire.

---

## 1. Arborescence

```
index.html                   accueil — isolation & pompe à chaleur (pose la question du projet)
isolation-exterieure.html    page « Isolation extérieure (ITE) »
isolation-combles.html       page « Isolation des combles »
pompe-a-chaleur.html         page « Pompe à chaleur air/eau »
mentions-legales.html        pages légales autonomes
confidentialite.html
conditions-generales.html
assets/css/site.css          styles communs aux 4 pages
assets/js/site.js            menu + formulaire communs aux 4 pages
assets/img/                  photo de l'en-tête, logos RGE / CEE, favicon
assets/fonts/                police DM Sans (licence OFL), auto-hébergée
api/lead.js                  fonction serverless Vercel : reçoit le formulaire
vercel.json                  en-têtes de sécurité, URL propres, redirections
```

URL en ligne (sans `.html`, grâce à `cleanUrls`) : `/`, `/isolation-exterieure`,
`/isolation-combles`, `/pompe-a-chaleur`, `/mentions-legales`,
`/confidentialite`, `/conditions-generales` (et `/cgu`).

Pour une publicité ITE, envoyez le trafic sur `/isolation-exterieure` ; pour
une publicité pompe à chaleur, sur `/pompe-a-chaleur`. Le lead indique la page
et le projet.

**Menu de l'en-tête** : « Aides Isolation » (sous-menu : Isolation extérieure,
Isolation des combles) et « Aides Pompe à Chaleur ». Sur mobile, il s'ouvre
avec le bouton ☰.

**Labels RGE Qualibat et CEE** : affichés à côté du bouton « Simulation
gratuite » (et au-dessus du titre sur mobile). Ne les laissez que si
l'entreprise qui réalise les travaux est **réellement qualifiée RGE** : un
label affiché sans qualification est une pratique commerciale trompeuse.

**Photo d'en-tête** : les 4 pages utilisent pour l'instant la même photo
(chantier d'isolation extérieure). Pour en changer sur une page, déposer
`assets/img/xxx-1600.webp` et `xxx-800.webp`, puis modifier l'attribut
`style="--photo:...;--photo-m:..."` de `.hero__photo` dans la page.

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

Construit par `assets/js/site.js` dans `#formulaire`, identique sur les 4 pages.
Le projet vient de l'attribut `data-projet` de `#formulaire` ; s'il est vide
(accueil), une première question le demande.

1. *(accueil uniquement)* Projet : ITE, combles, pompe à chaleur, je ne sais pas
2. Vous vivez en : Maison / Appartement
3. Vous êtes : Propriétaire / Locataire
4. Chauffage principal : fioul, électrique, gaz, bois, pompe à chaleur, charbon
5. Vos coordonnées : code postal (**59 uniquement**), prénom, nom → Continuer
6. Dernière étape : téléphone, e-mail → Obtenir mon estimation

**Appartement** ou **Locataire** → écran « Désolé, vous n'êtes pas
concerné(e) », avec un bouton pour modifier la réponse. Rien n'est envoyé.

Les boutons « Continuer » et « Obtenir mon estimation » restent grisés tant
que les champs ne sont pas valides. Les paramètres `utm_*`, `fbclid` et
`gclid` de l'URL publicitaire partent avec le lead.

Événements poussés dans `window.dataLayer` : `form_start`, `form_step`,
`non_eligible`, `hors_zone`, `cta_click`, `lead_submit`.

---

## 5. À compléter avant diffusion

Repérés par `[A REMPLACER]` dans la page et surlignés en jaune (classe
`a-completer`) dans les pages légales :
`grep -rn "A REMPLACER\|a-completer" *.html`

1. Nom et logo de la marque (provisoirement « Rénov'Nord »).
2. Chiffres de l'en-tête (« +300 chantiers réalisés », « 70 à 90 % financé
   par les aides* », note 4,8/5) : uniquement des chiffres réels et
   justifiables. Le « 70 à 90 % » est expliqué en bas de page (foyers aux
   revenus modestes et très modestes) ; ajustez-le si vos dossiers montrent
   autre chose.
3. **Avis clients : ce sont des exemples de mise en page.** Les remplacer par
   de vrais avis avant toute diffusion (faux avis = pratique commerciale
   trompeuse).
4. Exemples de chantiers (avant / après, DPE avant → après, économie par an) :
   ce sont des exemples de mise en page, illustrés par des dessins. Remplacez
   par de vrais chantiers : photos avant / après, DPE réels, économie
   constatée, avec l'accord des clients.
5. Téléphone de l'en-tête : `CONFIG.telephone` dans `assets/js/site.js` (vide = masqué).
6. Labels RGE / CEE : uniquement si l’entreprise partenaire est qualifiée.
7. Pages légales : entreprise RGE partenaire, nom de domaine, médiateur de la
   consommation, crédit de la photo, adresse de Vercel, services d'e-mail /
   webhook utilisés.
8. Pixel Meta ou balise Google : non installés. Il faudra ajouter leurs
   domaines dans la CSP de `vercel.json`, un bandeau de consentement, et
   mettre à jour la section « Cookies » de `confidentialite.html`.
