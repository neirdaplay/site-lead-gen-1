# Mon Couvreur Nord — landing page de génération de leads (Nord, 59)

Page unique de captation de demandes de devis en toiture, alimentée par Google
Ads Search. **Tout le site tient dans `index.html`** : le HTML, le CSS dans une
balise `<style>`, le JavaScript dans une balise `<script>`. Aucun framework,
aucune dépendance, aucune étape de build, **aucune requête réseau externe**.

`index.html` s'ouvre et fonctionne en double-cliquant dessus en local. Seul
l'envoi final du formulaire nécessite le site en ligne — c'est indiqué à
l'écran dans ce cas.

---

## Table des matières

1. [Arborescence](#1-arborescence)
2. [Variables d'environnement Netlify](#2-variables-denvironnement-netlify)
3. [Notification Telegram](#3-notification-telegram)
4. [Notification e-mail Netlify Forms](#4-notification-e-mail-netlify-forms)
5. [Déploiement](#5-déploiement)
6. [À compléter avant mise en ligne](#6-à-compléter-avant-mise-en-ligne)
7. [Le formulaire](#7-le-formulaire)
8. [Détection de ville](#8-détection-de-ville)
9. [Attribution publicitaire](#9-attribution-publicitaire)
10. [Icônes](#10-icônes)
11. [Ce qui est volontairement absent](#11-ce-qui-est-volontairement-absent)
12. [Checklist de vérification](#12-checklist-de-vérification)

---

## 1. Arborescence

```
index.html                             tout le site : HTML + CSS + JS
mentions-legales.html                  page autonome, CSS minimal inline
confidentialite.html                   page autonome, CSS minimal inline
conditions-generales.html              page autonome, CSS minimal inline
assets/img/                            visuels (gabarits gris à remplacer)
netlify/functions/
  submission-created.js                notification Telegram (seul fichier serveur)
netlify.toml                           publication, en-têtes, redirections
README.md
```

Les trois pages légales sont obligatoires pour la validation Google Ads. Elles
sont liées depuis le pied de page de chaque page.

`netlify/functions/submission-created.js` est le **seul** fichier serveur. Son
nom est réservé par Netlify : la fonction se déclenche automatiquement à chaque
soumission acceptée par Netlify Forms. Elle n'est jamais appelée depuis
`index.html`.

---

## 2. Variables d'environnement Netlify

À créer dans **Site configuration → Environment variables**. **Aucune clé ne
doit être committée** — `.gitignore` bloque déjà `.env`.

| Variable | Obligatoire | Rôle |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | oui, pour la notification | Jeton du bot, donné par `@BotFather` |
| `TELEGRAM_CHAT_ID` | oui, pour la notification | Identifiant du salon ou de la conversation qui reçoit les alertes |

Si l'une des deux manque, la fonction journalise un avertissement et retourne
quand même `200` : **le lead reste enregistré dans Netlify Forms**. Une
notification ratée ne fait jamais perdre un lead.

---

## 3. Notification Telegram

### Obtenir les deux valeurs

1. Écrire à `@BotFather` sur Telegram, envoyer `/newbot`, suivre les questions.
   Le jeton renvoyé va dans `TELEGRAM_BOT_TOKEN`.
2. Créer un groupe, y ajouter le bot, envoyer un message quelconque dedans.
3. Ouvrir `https://api.telegram.org/bot<JETON>/getUpdates` dans un navigateur et
   relever `result[0].message.chat.id`. Cette valeur va dans
   `TELEGRAM_CHAT_ID` (elle est négative pour un groupe).

### Format du message

```
🔔 Nouveau lead toiture

Projet : Reprotection de toiture
Tuiles : Tuiles béton
Surface : 100 à 150 m²
Délai : Urgent (fuite en cours)
Code postal : 59310

Jean Dupont
📞 06 12 34 56 78          ← cliquable
✉️ jean.dupont@exemple.fr

Source : toiture-nord / reprotection tuiles
```

Le numéro est un lien `tel:` : un appui suffit pour rappeler depuis le
téléphone. Les valeurs sont échappées avant d'être insérées dans le message,
qui est envoyé en `parse_mode: "HTML"`.

---

## 4. Notification e-mail Netlify Forms

Filet de sécurité indépendant de Telegram. Elle **se configure dans le
dashboard, pas dans le code** :

**Forms → Form notifications → Add notification → Email notification**
→ choisir le formulaire `lead` → saisir l'adresse de contact.

Gardez les deux actives : si l'API Telegram est indisponible, l'e-mail passe
quand même, et la soumission reste de toute façon consultable dans
**Forms → lead**.

---

## 5. Déploiement

1. Pousser ce dépôt sur GitHub.
2. Sur Netlify : **Add new site → Import an existing project**.
3. Netlify lit `netlify.toml` : rien à saisir. Publication à la racine, aucune
   commande de build, fonctions dans `netlify/functions`.
4. Renseigner les deux variables d'environnement (§ 2).
5. Déployer.

Le glisser-déposer du dossier dans l'interface Netlify fonctionne également :
il n'y a aucune dépendance à installer.

### Détection du formulaire

Netlify analyse le HTML au déploiement pour détecter les formulaires. Deux
éléments le garantissent :

- le formulaire visible porte `name="lead"`, `data-netlify="true"`,
  `netlify-honeypot="bot-field"` et un champ caché `form-name` ;
- un **formulaire caché en doublon**, en bas de `index.html`, déclare tous les
  noms de champs, y compris ceux que le script remplit.

Ne supprimez ni ne renommez ce doublon. Après le premier déploiement,
vérifiez que le formulaire `lead` apparaît bien dans **Forms**.

### Aperçu local

`index.html` s'ouvre directement dans un navigateur, sans serveur. Toute la
page fonctionne : les 7 étapes, les écrans de sortie, la FAQ, la détection de
ville. Seul l'envoi final affiche un message expliquant qu'il nécessite le site
en ligne — Netlify Forms n'existe pas en `file://`.

---

## 6. À compléter avant mise en ligne

Toutes les valeurs manquantes sont **surlignées en jaune** dans les pages, via
la classe `a-completer`. Pour les lister :

```sh
grep -rn "a-completer" *.html
```

| Élément | Où |
|---|---|
| Raison sociale, SIRET, forme juridique, RCS, TVA | les 3 pages légales + pieds de page |
| Directeur de la publication | `mentions-legales.html` (« Adrien Heddebaut » à confirmer) |
| Adresse e-mail de contact | `mentions-legales.html`, `confidentialite.html` |
| Adresse de Netlify, Inc. | `mentions-legales.html` (à vérifier sur netlify.com) |
| Raison sociale de l'entreprise partenaire | `confidentialite.html` § 4 |
| Dates de mise à jour | les 3 pages légales |
| Communes des photos avant / après | `index.html`, section « Avant / après » |
| Nom de domaine | `<link rel="canonical">` et balises `og:` de chaque page |

### Photos

`assets/img/` contient des **gabarits gris aux bonnes dimensions** : la mise en
page est déjà juste, déposer une photo ne déplacera rien.

Trois fichiers à déposer, **exactement sous ces noms** :

| Fichier | Emplacement sur la page | Format | Poids |
|---|---|---|---|
| `assets/img/hero-couvreur.jpg` | Fond du hero, en faible opacité sous le voile bleu nuit | 1600 × 1067 | 157 Ko |
| `assets/img/avant-hazebrouck.jpg` | Vignette « Avant » | 1600 × 900 | 178 Ko |
| `assets/img/apres-hazebrouck.jpg` | Vignette « Après » | 1600 × 900 | 221 Ko |
| `assets/img/og-partage.jpg` | Aperçu lors d'un partage (Facebook, LinkedIn, WhatsApp) | 1200 × 630 | 104 Ko |
| `assets/img/favicon.svg` | Icône d'onglet | — | 0,4 Ko |

**Les quatre visuels sont en place.** Les gabarits gris ont été supprimés, ainsi
que les replis (`onerror` sur les vignettes, seconde couche de fond sur le
hero) qui n'avaient plus de raison d'être.

> **Compressez avant de déposer.** La photo du hero est arrivée en
> 2560 × 1707 pour 545 Ko ; elle a été ramenée à 1600 px et 157 Ko, soit
> 71 % de moins, sans différence visible. C'est la ressource la plus lourde
> de la page et elle pèse directement sur le temps de chargement en 4G.
> Visez **moins de 200 Ko** pour chaque photo, en 1600 px de large.
>
> Et **un seul fichier par image** : un `hero-couvreur.jpeg` en doublon du
> `.jpg` a été supprimé. Le nom attendu est celui du tableau ci-dessus, à la
> lettre près.

Pour remplacer une photo, écrasez le fichier en gardant le même nom : il n'y a
aucun chemin à modifier dans le code. Gardez le format 1600 × 900 pour les
vignettes — les attributs `width` et `height` du HTML valent 1600 et 900, et
c'est ce qui garantit qu'aucun décalage de mise en page ne se produit au
chargement.

`og-partage.jpg` est un recadrage de la photo du hero en 1200 × 630. C'est un
JPEG et non un SVG : les réseaux sociaux ne savent pas afficher un SVG en
aperçu de partage.

#### Réglage du hero

La photo du hero est volontairement en **faible opacité** : elle sert de
texture, pas de sujet. Le bleu nuit reste la couleur dominante, et un voile
bleu passe encore par-dessus. Deux réglages, tous deux dans le `<style>` de
`index.html` :

| Réglage | Mobile | Desktop (≥ 1000 px) | Effet |
|---|---|---|---|
| `.hero__fond { opacity }` | `.18` | `.24` | Combien de photo on laisse passer |
| `.hero__voile { background }` | `rgba(15,39,69,.45)` | `rgba(15,39,69,.35)` | Intensité du bleu par-dessus |

Monter l'opacité rend la photo plus présente **et le texte moins lisible** :
le contraste a été mesuré sur le composite réel, pixel par pixel, avec ces
valeurs. Sur le fond le plus clair derrière le titre, on obtient 9,9:1 pour le
blanc et 3,8:1 pour le mot en vert (grand texte). Si vous augmentez `opacity`,
remesurez — ou compensez en augmentant l'alpha du voile.

Choisissez malgré tout une photo **lumineuse et lisible** : à 24 % d'opacité,
une prise de vue sombre ne donne plus qu'un aplat. Sujet décentré vers la
droite, le texte occupe la gauche sur desktop.

Pour l'avant / après, le **même angle** est ce qui rend la preuve crédible :
repérez un point fixe (souche de cheminée, poteau, lampadaire) et gardez-le au
même endroit dans le cadre.

> **Les légendes mentionnent Hazebrouck et une toiture en tuile béton.** Si
> vous changez de chantier, changez la commune et le matériau dans les deux
> `figcaption`, dans les deux `alt` et dans le sous-titre de la section. Ne
> légendez jamais une photo avec une commune où le chantier n'a pas eu lieu.

> **Le sous-titre annonce « tranquille pendant 15 ans »** alors que le tableau
> de prix annonce « garantie 10 ans ». Les deux peuvent coexister — une durée
> de vie constatée n'est pas une garantie contractuelle — mais un lecteur
> attentif verra la différence, et une durabilité annoncée doit pouvoir être
> justifiée. Harmonisez, ou assumez la distinction en la formulant
> explicitement.

### Chiffres affichés

La section « Intervention dans le Nord » affiche **2012** (année de création),
**250** chantiers par an et **3 000+** toitures traitées depuis l'ouverture.

Ce sont des affirmations commerciales au sens du Code de la consommation :
elles doivent rester **exactes et justifiables**. Mettez-les à jour quand elles
évoluent, et ne les arrondissez jamais vers le haut. Un commentaire le rappelle
à l'endroit du code concerné.

La carte est un tracé du département dessiné à la main en SVG inline —
aucune requête réseau. Elle porte huit villes repères (Dunkerque, Hazebrouck,
Lille, Roubaix, Douai, Valenciennes, Cambrai, Maubeuge) pour que le lecteur se
situe, et 116 points semés sur une trame régulière bruitée à l'intérieur du
contour. Sur petit écran, les deux repères les plus proches d'un autre
(Roubaix, Douai) sont masqués et les libellés grossis.

La légende dit « **répartition indicative** » et non « un point = un
chantier » : 116 points ne représentent pas les 3 000 chantiers réalisés, ils
en montrent l'étendue géographique. Gardez cette formulation tant que vous ne
disposez pas de la liste réelle des communes ; le jour où vous l'aurez,
remplacez les coordonnées des `<circle>` et reformulez la légende.

---

## 7. Le formulaire

Sept étapes, une question par écran, cartes cliquables pleine largeur qui font
avancer automatiquement. Aucun bouton « suivant » sur les questions à choix.

| Étape | Question | Champ |
|---|---|---|
| 1 | Votre projet de toiture concerne | `projet` |
| 2 | Vous êtes | `statut` |
| 3 | Quel type de tuiles | `tuiles` |
| 4 | Surface approximative | `surface` |
| 5 | Pour quand | `delai` |
| 6 | Votre code postal | `code_postal` |
| 7 | Vos coordonnées | `prenom`, `nom`, `email`, `telephone`, `consentement` |

Il n'y a pas de question sur le type de logement : le métier implique une
maison.

### Deux sorties sans envoi

- **Locataire** (étape 2) → écran de sortie immédiat. Aucun envoi, aucune
  collecte de coordonnées, pas de formulaire de repli. Le message invite à
  transmettre l'information au propriétaire.
- **Code postal hors 59** (étape 6) → écran de sortie courtois indiquant la
  zone couverte. Aucun envoi.

Dans les deux cas les réponses restent dans le navigateur et rien ne part.

### Champs cachés transmis

`gclid`, `gbraid`, `wbraid`, `utm_source`, `utm_medium`, `utm_campaign`,
`utm_content`, `utm_term`, `page_url`, `consent_text`, `consent_timestamp`,
`user_agent`, `ville_detectee`.

### Consentement

Case **non pré-cochée et obligatoire**. Le texte affiché est :

> J'accepte d'être recontacté par des professionnels pour mon projet. Voir notre
> politique de confidentialité.

Il est recopié **intégralement** dans le champ `consent_text` au moment de
l'envoi, avec l'horodatage ISO 8601 dans `consent_timestamp` : c'est la pièce
justificative en cas de contestation. Si vous modifiez ce texte dans
`index.html`, répercutez-le dans `confidentialite.html` § 2.2.

---

## 8. Détection de ville

Un script inline synchrone dans le `<head>` contient la table des communes du
Nord (377 communes, 8 secteurs) et lit le paramètre d'URL `?ville=`, à alimenter
depuis Google Ads. **Aucune géolocalisation IP, aucune API, aucun fichier
séparé.**

Le texte est écrit avant la première peinture : `__appliquerGeo()` est appelé
une première fois juste après le hero — donc avant que le navigateur n'ait peint
son contenu — puis une seconde fois en fin de document pour les sections
suivantes. Sans paramètre `?ville=`, la page affiche « dans le Nord », qui est
déjà le texte présent dans le HTML : il n'y a donc rien à remplacer et aucun
flash possible.

La résolution tolère accents, apostrophes, casse, « Orchies, Nord, France » et
les formes abrégées non ambiguës (`Templeuve` → `Templeuve-en-Pévèle`).

Où la ville apparaît : le `<h1>` (mot surligné en vert), le titre de la section
zone d'intervention, le nom du secteur, les puces de communes voisines, le CTA
final et le `<title>`.

**Honnêteté :** les formulations sont « Intervention à X » et « Nous intervenons
à X ». Jamais « Basé à X », jamais de gentilé. Une implantation locale fausse,
générée dynamiquement pour deux cents communes, est une allégation trompeuse.

### Test rapide

```
index.html?ville=Orchies
index.html?ville=Villeneuve-d%27Ascq     ← la plus longue, vérifie la hauteur du titre
index.html?ville=Le%20Cateau             ← vérifie « au Cateau-Cambrésis »
index.html?ville=Paris                   ← doit retomber sur « dans le Nord »
index.html                               ← « dans le Nord »
```

---

## 9. Attribution publicitaire

Au chargement, le script lit dans l'URL `gclid`, `gbraid`, `wbraid` et les
`utm_*`, puis les écrit dans le cookie first-party `attr`, valable 90 jours.
**Une valeur existante n'est jamais écrasée par une valeur vide** : un visiteur
qui revient en direct conserve son attribution d'origine. Les valeurs sont
injectées dans les champs cachés au moment de l'envoi.

Le script pousse par ailleurs des événements dans `window.dataLayer`
(`form_start`, `form_step`, `lead_submit`, `lead_disqualified`, `phone_click`,
`cta_formulaire`). **Aucune requête n'est faite** : c'est un simple tableau en
mémoire. Si vous ajoutez un jour un conteneur GTM, branchez la conversion
Google Ads sur **`lead_submit` et sur lui seul** — jamais sur
`lead_disqualified`, sans quoi l'algorithme apprendrait à acheter des locataires
et des demandes hors zone.

---

## 10. Icônes

Toutes les icônes sont des SVG inline définis **une seule fois** dans un
`<svg style="display:none">` en haut du `<body>`, sous forme de `<symbol>`,
réutilisés via `<use href="#id">`.

Règle unique, sans exception : `24 × 24`, `fill="none"`,
`stroke="currentColor"`, `stroke-width="1.5"`, extrémités et jonctions
arrondies, couleur héritée (bleu nuit `#0F2745`). **Style ligne uniquement :
pas d'emoji, pas d'icône pleine, pas de couleur, pas de mélange de styles.**

Chaque option de réponse porte son icône dans une tuile carrée arrondie de
44 px, fond gris très clair `#F5F7FA`, alignée à gauche de la carte.

Un même symbole réutilisé plusieurs fois est voulu — c'est ce qui garantit la
cohérence. `i-calendrier` sert pour « Dans 3 mois » et « Dans 3 à 6 mois »,
`i-horloge` pour « Dans 6 à 12 mois » et « L'année prochaine », `i-question`
pour les deux « Je ne sais pas ». N'inventez pas de variantes.

---

## 11. Ce qui est volontairement absent

Ces absences sont des décisions, pas des oublis :

- **Aucun faux avis, aucune fausse note, aucun compteur de chantiers inventé.**
  Le bloc « avis » existe, est stylé, et reste `hidden` tant qu'il n'y a pas de
  vrais avis Google. Le commentaire dans `index.html` indique où les brancher.
  Attention : un widget chargé depuis un domaine tiers casserait la règle
  « zéro requête réseau externe » — préférez une recopie manuelle depuis la
  fiche, avec le lien public vers celle-ci pour vérification.
- **Aucun flux d'activité en direct, aucun compte à rebours, aucune rareté
  artificielle, aucune promesse de résultat non vérifiable.**
- **Aucune affirmation d'implantation locale.** « Intervention à », jamais
  « Basé à ».
- **Aucune police externe** : pile système. **Aucun CDN, aucune bibliothèque
  d'icônes, aucun outil de mesure d'audience.** L'onglet Network doit rester
  vide de tout domaine tiers.
- **Aucun service en dehors des trois proposés.** Ni gouttières, ni zinguerie,
  ni toit plat, ni isolation, ni étanchéité, ni réparation d'urgence comme
  prestation distincte.

La réassurance repose uniquement sur des faits vérifiables : assurance
décennale, zone d'intervention, délai de rappel, un seul technicien.

---

## 12. Checklist de vérification

- [ ] `index.html` s'ouvre et fonctionne en double-cliquant dessus, hors serveur
- [ ] Onglet Network : aucune requête vers un domaine tiers
- [ ] Le build Netlify passe sans erreur
- [ ] Le formulaire `lead` apparaît dans **Forms** après le premier déploiement
- [ ] `?ville=Orchies` affiche la ville dans le titre, sans flash
- [ ] Sans paramètre, le titre affiche « dans le Nord »
- [ ] Les 7 étapes s'enchaînent, le bouton retour fonctionne
- [ ] « Locataire » affiche l'écran de sortie et n'envoie rien
- [ ] Un code postal hors 59 affiche l'écran de sortie et n'envoie rien
- [ ] La case de consentement est non pré-cochée et bloque l'envoi
- [ ] Toutes les icônes partagent le même style de trait
- [ ] Aucun token, aucune clé, aucun identifiant dans `index.html` ni dans un
      fichier versionné
- [ ] `.gitignore` couvre `.env`
- [ ] `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID` créées sur Netlify
- [ ] Notification e-mail Netlify Forms activée vers l'adresse de contact
- [ ] Une soumission de test déclenche bien la notification Telegram
- [ ] Plus aucune occurrence de `a-completer` : `grep -rn "a-completer" *.html`
- [x] Photo du hero déposée et compressée
- [ ] Photos avant / après déposées sous les noms exacts, `onerror` retirés
- [ ] Commune des légendes avant / après exacte (Hazebrouck par défaut)
- [ ] Chiffres 2012 / 250 / 3 000+ vérifiés et à jour
- [ ] Test sur mobile réel : le formulaire est visible sans défilement
