# Mon Couvreur Nord — landing page de génération de leads (Nord, 59)

Page unique de captation de demandes de devis en couverture, alimentée
exclusivement par Google Ads Search. HTML / CSS / JS **vanilla**, sans framework
et sans étape de build : le dossier fonctionne tel quel.

---

## Table des matières

1. [Ce que fait la page](#1-ce-que-fait-la-page)
2. [Variables à compléter avant mise en ligne](#2-variables-à-compléter-avant-mise-en-ligne)
3. [Variables d'environnement Netlify](#3-variables-denvironnement-netlify)
4. [Déploiement](#4-déploiement)
5. [Où se trouve le texte de consentement](#5-où-se-trouve-le-texte-de-consentement)
6. [Permuter le mode de stockage](#6-permuter-le-mode-de-stockage)
7. [Géo-personnalisation](#7-géo-personnalisation)
8. [Tracking, Consent Mode et Google Ads](#8-tracking-consent-mode-et-google-ads)
9. [Structure des fichiers](#9-structure-des-fichiers)
10. [Performance](#10-performance)
11. [Encart France Rénov'](#11-encart-france-rénov)
12. [Ce qui est volontairement absent](#12-ce-qui-est-volontairement-absent)
13. [Checklist avant la première campagne](#13-checklist-avant-la-première-campagne)

---

## 1. Ce que fait la page

Un visiteur arrive depuis une annonce Google Ads géolocalisée. Le titre du hero
affiche **sa commune**. Le formulaire est visible sans défilement, sur mobile
comme sur desktop. Cinq étapes, une question principale par écran, passage
automatique à l'étape suivante.

À l'arrivée du formulaire, la fonction Netlify :

1. valide les champs, le pot de miel et le délai de soumission ;
2. construit un enregistrement complet, **preuve de consentement incluse** ;
3. le persiste (Netlify Blobs ou webhook HTTP) ;
4. envoie une notification Telegram lisible sur mobile ;
5. renvoie un statut, et le front affiche un écran de confirmation qui répète
   **qui rappelle** et **sous quel délai**.

Deux chemins de sortie ne déclenchent **jamais** la conversion Google Ads :

| Situation | Événement `dataLayer` | Conversion Ads |
|---|---|---|
| Demande qualifiée envoyée | `lead_submit` | **oui** |
| Locataire, appartement ou copropriété | `lead_disqualified` | non |
| Code postal hors 59 | `lead_disqualified` | non |
| Clic sur un lien `tel:` | `phone_click` | oui, valeur inférieure |

> **Ne comptez jamais `lead_disqualified` comme conversion.** L'algorithme
> d'enchères apprendrait à acheter des locataires et des demandes hors zone.
> C'est l'erreur la plus coûteuse possible sur ce compte.

---

## 2. Variables à compléter avant mise en ligne

Toutes les valeurs manquantes sont **visuellement signalées en jaune** dans les
pages, via la classe `a-completer`. Cherchez cette classe pour les trouver
toutes :

```sh
grep -rn "a-completer" *.html
```

| Élément | Où | Valeur actuelle |
|---|---|---|
| Raison sociale | `mentions-legales.html`, `confidentialite.html`, `conditions-generales.html`, pied de toutes les pages | à compléter |
| SIRET, RCS, TVA, forme juridique, capital | `mentions-legales.html` | à compléter |
| Directeur de la publication | `mentions-legales.html` | « Adrien Heddebaut » à confirmer |
| Adresse e-mail de contact | `mentions-legales.html`, `confidentialite.html`, pied de page | à créer après achat du domaine |
| Adresse de Netlify, Inc. | `mentions-legales.html` | à vérifier sur netlify.com |
| Raison sociale de l'entreprise partenaire (Technitoit) | `confidentialite.html` § 4 | à compléter |
| Date de dernière mise à jour | les 3 pages légales | à compléter |
| Légendes des photos de chantier | `index.html`, section « Chantiers récents » | à compléter |
| Nom de domaine | `<link rel="canonical">` et balises `og:` de chaque page | `www.mon-couvreur-nord.fr` (à confirmer) |
| `GTM_ID`, `GA4_ID`, `CLARITY_ID` | bloc `window.MCN_CONFIG` de chaque page | placeholders |

Les identifiants de mesure sont **inertes tant qu'ils contiennent un `X`** :
le conteneur GTM n'est pas chargé, aucune requête n'est faite. Le site
fonctionne donc parfaitement avant la création des comptes.

### Photos

Les images sont des gabarits gris aux bonnes dimensions. Tout est décrit dans
[`assets/img/SHOTLIST.md`](assets/img/SHOTLIST.md), y compris le balisage
`<picture>` exact à mettre en place une fois les fichiers AVIF/WebP/JPEG
produits.

> Tant que les vraies photos ne sont pas là, **ne rédigez pas de légendes
> inventées**. Si aucune photo réelle n'est disponible au lancement, ajoutez
> `hidden` sur la balise `<section>` des chantiers plutôt que d'inventer une
> commune. Une légende fausse est une pratique commerciale trompeuse.

---

## 3. Variables d'environnement Netlify

À créer dans **Site configuration → Environment variables**. Le fichier
[`.env.example`](.env.example) sert de modèle. **Aucune clé ne doit être
committée** — `.gitignore` bloque déjà `.env`.

| Variable | Obligatoire | Défaut | Rôle |
|---|---|---|---|
| `STOCKAGE` | non | `blobs` | `blobs`, `webhook`, ou `blobs,webhook` |
| `BLOBS_STORE` | non | `leads` | Nom du magasin Netlify Blobs |
| `WEBHOOK_URL` | si `webhook` | — | URL POST recevant l'enregistrement JSON |
| `WEBHOOK_TOKEN` | non | — | Envoyé en `Authorization: Bearer …` |
| `TELEGRAM_BOT_TOKEN` | recommandé | — | Jeton donné par `@BotFather` |
| `TELEGRAM_CHAT_ID` | recommandé | — | Identifiant du salon ou de la conversation |
| `TELEGRAM_NOTIFIER_NON_QUALIFIES` | non | `false` | `true` pour être aussi notifié des demandes non qualifiées |

### Obtenir les identifiants Telegram

1. Écrire à `@BotFather` sur Telegram, envoyer `/newbot`, suivre les questions.
   Le jeton renvoyé va dans `TELEGRAM_BOT_TOKEN`.
2. Créer un groupe, y ajouter le bot, envoyer un message quelconque.
3. Ouvrir `https://api.telegram.org/bot<JETON>/getUpdates` et relever
   `result[0].message.chat.id`. Cette valeur va dans `TELEGRAM_CHAT_ID`
   (elle est négative pour un groupe).

### Tolérance aux pannes

Si le stockage échoue mais que Telegram passe — ou l'inverse — le visiteur voit
quand même sa confirmation et le lead n'est pas perdu. Le formulaire ne renvoie
une erreur que si **aucun** des deux canaux n'a fonctionné ; dans ce cas
l'enregistrement complet est écrit dans les logs de la fonction, d'où il peut
être récupéré.

---

## 4. Déploiement

### Option A — dépôt Git connecté (recommandé)

1. Pousser ce dépôt sur GitHub.
2. Sur Netlify : **Add new site → Import an existing project**.
3. Netlify lit `netlify.toml` : rien à saisir. `publish = "."`, aucune commande
   de build, fonctions dans `netlify/functions`, Edge Functions dans
   `netlify/edge-functions`.
4. Renseigner les variables d'environnement (§ 3).
5. Déployer.

C'est la seule option qui installe `@netlify/blobs` et permet donc le mode de
stockage `blobs`.

### Option B — glisser-déposer

Le dossier peut être déposé directement dans l'interface Netlify. Le site, le
formulaire et l'Edge Function fonctionnent. En revanche, `npm install` n'étant
pas exécuté, `@netlify/blobs` est absent :

**basculer alors `STOCKAGE` sur `webhook`**, ou se contenter de la notification
Telegram.

### Développement local

```sh
npm install          # uniquement pour @netlify/blobs
npx netlify dev      # sert le site, les fonctions ET les Edge Functions
```

Sans la CLI Netlify, un simple serveur statique suffit pour vérifier la mise en
page — mais ni l'Edge Function ni le formulaire ne répondront :

```sh
python3 -m http.server 8080
```

Dans ce cas, la géo-personnalisation reste testable via le paramètre d'URL :
`http://localhost:8080/?ville=Orchies` (repli JavaScript, cf. § 7).

---

## 5. Où se trouve le texte de consentement

Le texte de la case à cocher est la **pièce juridique** du dispositif. Il existe
à trois endroits qui doivent rester rigoureusement synchronisés :

| Fichier | Repère | Rôle |
|---|---|---|
| `index.html` | `<label id="texte-consentement">` | Le texte **affiché** à l'utilisateur |
| `netlify/functions/submit-lead.js` | constante `TEXTE_CONSENTEMENT_ATTENDU` | Référence de contrôle |
| `confidentialite.html` | § 3 et § 4 | Description du traitement et du destinataire |

Texte actuel :

> J'accepte que mes coordonnées soient transmises à Adrien Heddebaut de chez
> Technitoit afin d'être recontacté(e) au sujet de ma demande de devis. Je peux
> retirer ce consentement à tout moment.

Le front envoie au serveur le **texte intégral effectivement affiché**, pas une
référence. Le serveur l'enregistre tel quel dans `consent.text` et le compare à
la constante : si les deux diffèrent, le lead est accepté mais marqué
`consent.texteConforme: false`. C'est un signal d'alerte — il signifie que la
page et le serveur ont divergé.

**Si vous modifiez ce texte**, modifiez les trois endroits, et incrémentez
`consent.version` dans la fonction. Les consentements déjà recueillis restent
attachés à la version sous laquelle ils ont été donnés.

Le bloc `consent` doit pouvoir être **conservé 3 ans et exporté**. Il contient :

```js
consent: {
  given: true,
  text,            // texte intégral affiché — jamais un résumé
  texteConforme,   // le texte affiché correspondait-il à la référence ?
  timestamp,       // horodatage SERVEUR, ISO 8601
  ip,              // x-nf-client-connection-ip
  userAgent,
  formulaire,      // "devis" ou "recapitulatif-proprietaire"
  version
}
```

### Exporter les preuves de consentement

En mode `blobs`, depuis un poste disposant de la CLI Netlify :

```sh
netlify blobs:list  leads --prefix leads/
netlify blobs:get   leads leads/2026-08-22/lead_xxx.json
```

En mode `webhook`, l'export dépend du système récepteur.

---

## 6. Permuter le mode de stockage

Tout se joue sur la variable `STOCKAGE`, sans toucher au code.

```
STOCKAGE=blobs            # défaut : Netlify Blobs, zéro configuration
STOCKAGE=webhook          # POST JSON vers WEBHOOK_URL
STOCKAGE=blobs,webhook    # les deux, en parallèle
```

Les enregistrements sont rangés par préfixe :

```
leads/AAAA-MM-JJ/<id>.json                 demandes qualifiées
leads-non-qualifies/AAAA-MM-JJ/<id>.json   demandes non qualifiées (avec contact)
parcours/AAAA-MM-JJ/<id>.json              pings d'étape, sans identifiant direct
```

### Brancher un webhook

`WEBHOOK_URL` reçoit un `POST` `application/json` contenant l'enregistrement
complet, avec l'en-tête `Authorization: Bearer <WEBHOOK_TOKEN>` si le jeton est
défini. Cela permet de brancher, sans modifier le code :

- une **Cloud Function Firebase** qui écrit dans Firestore ;
- un **Google Apps Script** publié en application web, qui ajoute une ligne à
  une feuille de calcul ;
- un connecteur **Make / Zapier / n8n** ;
- l'API d'un acheteur de leads.

Schéma de l'enregistrement :

```js
{
  id, receivedAt, type: 'lead',
  besoin, statut, logement, surface, delai, codePostal,
  prenom, nom, telephone, email,
  qualified,                       // booléen
  motifDisqualification,
  attribution: { gclid, gbraid, wbraid, msclkid, utm_*, intent, … },
  geo: { villeDetectee, secteurDetecte, source },
  page: { url, referrer, titre },
  consent: { given, text, texteConforme, timestamp, ip, userAgent, formulaire, version },
  technique: { dureeParcoursMs, langue, ecran }
}
```

> `codePostal` est **toujours** celui saisi à l'étape 4. `geo.villeDetectee` est
> conservé à titre d'information et ne doit jamais être utilisé comme adresse.

---

## 7. Géo-personnalisation

### Ordre de résolution

1. **Paramètre d'URL `?ville=`** — source prioritaire. À alimenter depuis
   Google Ads, soit par une valeur figée par campagne ou groupe d'annonces
   (recommandé, car lisible), soit via ValueTrack.
2. **Géolocalisation IP Netlify** — `context.geo` dans l'Edge Function, avec
   repli sur l'en-tête `x-nf-geo`. Aucun appel à une API tierce côté client.
3. **Repli générique « dans le Nord »** — c'est le texte présent dans le HTML
   statique.

Une commune inconnue dont le code postal commence par 59 reste sur le secteur
générique « le Nord ».

### Aucun flash de contenu

La méthode retenue est l'**Edge Function** `netlify/edge-functions/geo.js` :
elle réécrit le HTML **avant l'envoi**, si bien que le navigateur ne voit jamais
la version générique. Elle injecte aussi `window.__GEO` et `window.__T0`
(horodatage serveur pour le contrôle anti-robot).

Concrètement, la commune est déjà dans le flux d'octets : un `curl` sur la page
renvoie `<em data-geo="a-ville">à Orchies</em>` **avant qu'aucun JavaScript ne
s'exécute**. Il n'y a donc rien à faire côté client, et rien qui puisse clignoter.

En conséquence, **le navigateur ne télécharge pas la table des communes** : ni
script bloquant dans le `<head>`, ni `communes.json`. C'est l'Edge Function qui
a résolu, et elle passe le résultat par `window.__GEO`.

Un **repli** vit dans `assets/js/communes.js`, chargé en `defer`. Il ne se
déclenche que si l'Edge Function n'a pas tourné (aperçu local, hébergement
statique nu) **et** qu'un paramètre `?ville=` est présent : il charge alors
`shared/communes.json`, résout, et applique. Ce chemin-là est asynchrone — il
sert au développement, pas à la production.

Le bloc titre porte un `min-height` calé sur trois lignes en mobile et deux en
desktop, testé avec « Villeneuve-d'Ascq », la commune la plus longue de la table.
Sa hauteur mesurée est identique pour toutes les communes, à chaque point de
rupture : même sur le chemin de repli, aucun décalage de mise en page.

### Où la personnalisation apparaît

- le `<h1>` du hero — la commune est le mot surligné en vert ;
- une puce de réassurance : « Intervention à *[ville]* — rappel sous 24 à 48 h » ;
- le titre de la section zone d'intervention ;
- le nom du secteur et les **puces de communes voisines** sous la carte de zone ;
- le CTA final ;
- le `<title>` et la `meta description`.

### Honnêteté

Les formulations employées sont « **Intervention à X** » et « **Nous
intervenons à X** ». **Jamais « Basé à X »**, jamais de gentilé.
Une implantation locale fausse, générée dynamiquement pour deux cents communes,
est une allégation trompeuse — et c'est exactement le motif que la DGCCRF
recherche sur les sites géo-programmatiques.

### Ajouter des communes

Il n'existe **qu'une seule source de vérité** : `shared/communes.json`.
Aucune donnée n'est dupliquée ailleurs.

| Fichier | Rôle |
|---|---|
| `shared/communes.json` | **La donnée.** 377 communes réparties en 8 secteurs, plus les libellés accentués. C'est le seul fichier à modifier. |
| `netlify/lib/communes.js` | La logique de résolution, côté serveur. Importe le JSON (`with { type: "json" }`) ; esbuild l'incorpore au bundle de l'Edge Function. |
| `assets/js/communes.js` | La même logique, côté navigateur. **Ne contient aucune donnée** : il charge le JSON, et uniquement quand il en a besoin. |

Les tableaux sont ordonnés géographiquement : les communes voisines proposées
sont les entrées les plus proches dans le tableau du secteur. Ajouter une
commune consiste donc à l'insérer **au bon endroit** dans la liste de son
secteur, pas à la mettre en fin de tableau.

Si le libellé comporte un accent, une apostrophe ou une ligature, ajoutez-le
aussi dans `libelles`, indexé sur sa forme normalisée (minuscules, sans accent,
sans séparateur) — par exemple `"villeneuvedascq": "Villeneuve-d'Ascq"`.

### Où vivent les Edge Functions

`netlify/edge-functions/` ne doit contenir **que des Edge Functions** : Netlify
traite chaque fichier `.js` de ce dossier comme une fonction et exige un export
par défaut appelable. Y déposer un module de données fait échouer le bundling au
déploiement. Les modules partagés vont dans `netlify/lib/`, les données dans
`shared/`. Un `README.md` d'une ligne rappelle la règle sur place.

La résolution tolère les variantes courantes : accents, apostrophes, casse,
« Orchies, Nord, France », et les formes abrégées non ambiguës (`Templeuve` →
`Templeuve-en-Pévèle`).

### Test rapide

```
/?ville=Orchies
/?ville=Villeneuve-d%27Ascq     ← la plus longue, vérifie la hauteur du titre
/?ville=Le%20Cateau             ← vérifie « au Cateau-Cambrésis »
/?ville=Paris                   ← doit retomber sur « dans le Nord »
```

---

## 8. Tracking, Consent Mode et Google Ads

### Attribution

Au chargement, `tracking.js` lit dans l'URL `gclid`, `gbraid`, `wbraid`,
`msclkid`, les `utm_*` et des paramètres personnalisés (`intent`, `kw`,
`campaignid`, `adgroupid`, `device`, `matchtype`, `placement`, `ville`), puis les
écrit dans le cookie first-party `attr`, valable 90 jours.

**Une valeur existante n'est jamais écrasée par une valeur vide** : un visiteur
qui revient en direct conserve son attribution d'origine. Les valeurs sont
injectées en champs cachés au moment de la soumission et incluses dans
l'enregistrement serveur.

### Événements `dataLayer`

| Événement | Déclencheur | Paramètres utiles |
|---|---|---|
| `page_ready` | fin du chargement | `page_type`, `ville_detectee`, `secteur_detecte` |
| `form_start` | premier clic dans l'étape 1 | `premier_champ`, `premiere_valeur` |
| `form_step` | changement d'étape | `step_number`, `step_name` |
| `lead_submit` | soumission qualifiée réussie | `besoin`, `delai`, `surface`, `code_postal` |
| `lead_disqualified` | écran de sortie | `motif` |
| `phone_click` | clic sur un lien `tel:` | `emplacement` |
| `cta_formulaire` | clic sur un CTA menant au formulaire | `emplacement` |
| `form_error` | échec d'envoi | `etape` |
| `consent_update` | choix dans le bandeau cookies | `consent_mesure`, `consent_publicite` |

Dans GTM, créer **une action de conversion Google Ads sur `lead_submit`
uniquement**, et une conversion secondaire de valeur inférieure sur
`phone_click`. `lead_disqualified` sert exclusivement à alimenter des audiences
d'exclusion et à repérer les mots-clés à passer en négatif.

### Consent Mode v2

L'état par défaut est **`denied`** pour `ad_storage`, `ad_user_data`,
`ad_personalization` et `analytics_storage`. Il est posé par un script inline du
`<head>, **avant** le conteneur GTM, avec `ads_data_redaction` et
`url_passthrough` activés. Le bandeau appelle ensuite `consent update`.

Deux modes, réglables sans toucher au code, via `window.MCN_CONFIG` :

| `chargerGtmApresChoix` | Comportement |
|---|---|
| `false` (défaut) | Mode **avancé** : GTM est chargé immédiatement avec un consentement refusé. Aucun cookie n'est déposé, mais Google reçoit des pings sans cookie qui permettent la modélisation des conversions. |
| `true` | Mode **strict** : rien n'est chargé tant que l'utilisateur n'a pas accepté. Zéro requête vers Google avant consentement, mais perte des conversions modélisées. |

Dans les deux cas, « Tout refuser » **bloque réellement** : le consentement
reste sur `denied` et les cookies `_ga`, `_gcl`, `_clck`, `_clsk` déjà présents
sont supprimés.

### Anti-abandon

À chaque changement d'étape, un `navigator.sendBeacon` transmet le numéro
d'étape atteint. Cela permet de voir **exactement** où le parcours décroche.
Ce message ne contient ni nom, ni téléphone, ni e-mail, ni adresse IP.

L'état du formulaire est conservé dans `sessionStorage` pour survivre à un
rafraîchissement accidentel — jamais dans `localStorage`.

---

## 9. Structure des fichiers

```
/
├── index.html                      page unique de conversion
├── mentions-legales.html
├── confidentialite.html
├── conditions-generales.html
├── netlify.toml                    publication, en-têtes, redirections
├── package.json                    une seule dépendance : @netlify/blobs
├── .env.example                    modèle des variables d'environnement
├── shared/
│   └── communes.json               SOURCE UNIQUE : communes → secteur
├── assets/
│   ├── css/main.css                feuille différée (sous la ligne de flottaison)
│   ├── js/tracking.js              attribution, dataLayer, Consent Mode, cookies
│   ├── js/form.js                  formulaire 5 étapes, disqualification
│   ├── js/communes.js              logique de résolution, sans donnée (repli)
│   ├── fonts/                      Inter auto-hébergée, woff2, 4 graisses
│   └── img/
│       ├── SHOTLIST.md             visuels à produire, spécifications complètes
│       ├── favicon.svg
│       └── placeholder/            gabarits gris aux dimensions exactes
└── netlify/
    ├── functions/submit-lead.js    réception, validation, stockage, Telegram
    ├── lib/communes.js             logique de résolution, côté serveur
    └── edge-functions/
        ├── README.md               la règle du dossier, en une ligne
        └── geo.js                  réécriture du HTML avant envoi
```

`netlify/edge-functions/` ne contient qu'un seul fichier `.js`, et c'est
volontaire : voir « Où vivent les Edge Functions » plus haut.

Le CSS critique est **inline dans le `<head>`** de chaque page ; `main.css` est
chargé en différé (`rel=preload` + bascule `rel=stylesheet`, avec repli
`<noscript>`).

---

## 10. Performance

- **Polices auto-hébergées** en woff2, sous-ensemble latin, quatre graisses
  (400, 600, 700, 800), environ 24 Ko chacune. Aucun appel à Google Fonts :
  c'est autant un choix RGPD qu'un choix de performance.
- Une **face de repli `Inter Repli`** reproduit les métriques d'Inter
  (`size-adjust: 107.4%`, `ascent-override: 90.2%`) : la bascule de police ne
  déplace aucun texte. **CLS = 0.**
- `preload` sur les deux graisses critiques (400 et 800).
- Le hero est un `background-image` : aucune image cassée si le fichier manque,
  et le texte du titre reste l'élément LCP.
- `width` et `height` explicites sur toutes les images.
- Cache long et immuable sur les polices, une semaine sur CSS/JS, aucun cache
  partagé sur le HTML (il est personnalisé par commune).
- **Aucun script bloquant dans le `<head>`** : la table des communes n'est pas
  expédiée au navigateur en production, l'Edge Function ayant déjà résolu la
  commune côté serveur.
- Aucune bibliothèque tierce, aucune animation au défilement,
  `prefers-reduced-motion` respecté.

Les noms de fichiers CSS/JS ne sont pas hachés. En cas de modification urgente,
ajouter `?v=2` aux URLs dans les `<link>` et `<script>` pour forcer le
rafraîchissement.

---

## 11. Encart France Rénov'

Un emplacement est **réservé mais désactivé** dans le pied de page :
`<p class="pied__france-renov"></p>`, masqué par `display: none` dans
`main.css`.

Il n'a pas lieu d'être pour de la couverture sèche. **Il devient obligatoire**
si la page se met un jour à promouvoir un geste de rénovation énergétique
(isolation de toiture ou de combles, par exemple) : la réglementation impose
alors de mentionner le service public France Rénov'. Retirer le `display: none`
et y placer la mention exigée à ce moment-là — pas avant.

---

## 12. Ce qui est volontairement absent

Ces absences sont des décisions, pas des oublis :

- **Aucun faux avis, aucune note inventée, aucun compteur de chantiers.**
  Le bloc « avis » existe, est stylé, et reste `hidden` tant qu'il n'y a pas de
  vrais avis Google. Le commentaire dans `index.html` indique précisément où
  brancher la fiche Google Business Profile. Écrire « 4,8/5 sur 1 240 avis »
  sans support est une pratique commerciale trompeuse sanctionnée jusqu'à 10 %
  du chiffre d'affaires — et c'est le premier point contrôlé sur ce type de site.
- **Aucune affirmation d'implantation locale.** « Intervention à », jamais
  « Basé à ».
- **Aucun faux compte à rebours**, aucun « plus que 2 places cette semaine »,
  aucun flux d'activité simulé.
- **Aucune mention ni imitation d'un organisme public.**
- **Aucun menu de navigation dans le hero** : une seule action possible.
- Aucun framework, aucun Tailwind CDN, aucun jQuery, aucune bibliothèque
  d'animation, aucune police tierce.

La réassurance repose uniquement sur des faits vérifiables : assurance
décennale, zone d'intervention, délai de rappel, un seul contact.

---

## 13. Checklist avant la première campagne

- [ ] Domaine acheté et branché sur Netlify, HTTPS actif
- [ ] `<link rel="canonical">` et balises `og:` mis à jour avec le vrai domaine
- [ ] Raison sociale, SIRET, forme juridique, RCS, TVA renseignés (3 pages légales + pieds de page)
- [ ] Adresse e-mail de contact créée et renseignée
- [ ] Adresse de Netlify, Inc. vérifiée dans les mentions légales
- [ ] Raison sociale de l'entreprise partenaire renseignée dans la politique de confidentialité
- [ ] Dates de mise à jour renseignées sur les 3 pages légales
- [ ] Plus aucune occurrence de `a-completer` : `grep -rn "a-completer" *.html`
- [ ] Photos réelles en place, ou section « Chantiers récents » masquée
- [ ] Légendes de chantiers exactes (commune réelle)
- [ ] Autorisation écrite pour le portrait de l'artisan (droit à l'image)
- [ ] Variables d'environnement créées sur Netlify
- [ ] Notification Telegram testée de bout en bout
- [ ] Un lead de test reçu, stocké, et sa preuve de consentement relue
- [ ] Un parcours « locataire » testé : **aucune conversion Ads déclenchée**
- [ ] Un parcours « code postal 62 » testé : sortie propre, aucune conversion
- [ ] `GTM_ID`, `GA4_ID`, `CLARITY_ID` renseignés
- [ ] Conversion Google Ads branchée sur `lead_submit` **et sur lui seul**
- [ ] Conversion secondaire `phone_click`, valeur inférieure
- [ ] Bandeau cookies testé : « Tout refuser » ne dépose aucun cookie tiers
- [ ] Géo testée sur cinq communes, dont Villeneuve-d'Ascq et Le Cateau-Cambrésis
- [ ] Test sur mobile réel : formulaire visible sans défilement
- [ ] Lighthouse mobile : LCP < 2 s, CLS = 0
