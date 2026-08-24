# Site Artisan — page de capture

Page unique de captation pour un **abonnement à un site internet à 49 € HT/mois**
destiné aux artisans et aux TPE. Même socle technique que le site toiture :
HTML, CSS et JS dans un seul fichier, aucune dépendance, aucune étape de build.

La mise en page reprend l'architecture d'une page de capture existante que vous
avez fournie en référence. **Les textes ont été réécrits** : reproduire ceux du
modèle aurait à la fois posé un problème de droit d'auteur et mis sur votre site
des affirmations factuelles qui sont vraies chez eux et fausses chez vous
(effectif, ancienneté, ville, client cité).

---

## Sommaire

1. [À compléter avant mise en ligne](#1-à-compléter-avant-mise-en-ligne)
2. [Déploiement](#2-déploiement)
3. [Le formulaire](#3-le-formulaire)
4. [Google Ads](#4-google-ads)
5. [Ce qui vous engage juridiquement](#5-ce-qui-vous-engage-juridiquement)
6. [Structure de la page](#6-structure-de-la-page)
7. [Vérifications](#7-vérifications)

---

## 1. À compléter avant mise en ligne

Toutes les valeurs manquantes sont surlignées en jaune dans la page, avec la
classe `.a-completer`. Cherchez `a-completer` dans les fichiers pour les
retrouver toutes.

| Où | Quoi |
|---|---|
| Partout | **Le nom « Site Artisan »** est un nom de travail. Vérifiez sa disponibilité (INPI, nom de domaine) ou remplacez-le. Il apparaît dans le logo, le `<title>`, les `og:`, le pied de page et les 3 pages légales |
| `<head>` | `canonical` et `og:image` pointent vers `www.site-artisan.fr` — à remplacer par le domaine réel |
| Section « Un exemple » | **Nom du client, métier, ville**, capture de son site, et les deux liens (site + fiche Google). Sans un vrai exemple, retirez la section entière plutôt que d'inventer |
| Bande dorée | Le nom du client dans le rappel « Une semaine » |
| Section « Qui je suis » | Votre photo dans `assets/portrait.jpg`, et le nombre d'années d'expérience |
| Tableau comparatif | Les fourchettes « 400 à 1 300 € » et « 50 à 90 € ». **Vous devez pouvoir les justifier** : relevez trois offres concurrentes réelles et gardez la trace |
| WhatsApp | Le numéro `33786505580` apparaît 4 fois. Vérifiez que c'est bien le bon |
| `index.html` | `CONVERSION_LEAD` et `AW-XXXXXXXXXX` — voir § 4 |
| Pages légales | Le médiateur de la consommation (obligatoire, voir § 5) |

---

## 2. Déploiement

Le dossier `artisans/` est **autonome**. Deux façons de le mettre en ligne :

- **Site Netlify séparé** (recommandé) : créez un second site sur le même dépôt,
  et réglez « Base directory » sur `artisans`. Les deux sites vivent alors leur
  vie, avec leurs propres domaines et leurs propres campagnes.
- **Dépôt à part** : copiez le dossier tel quel à la racine d'un nouveau dépôt.

Variables d'environnement à créer (Site configuration → Environment variables),
pour la notification Telegram :

| Variable | Contenu |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Le jeton du bot |
| `TELEGRAM_CHAT_ID` | L'identifiant de la conversation |

**Aucune clé ne doit figurer dans le dépôt.**

### Détection du formulaire

> **À faire une fois, sinon aucun lead n'arrive.**
> La détection des formulaires est **désactivée par défaut** sur les sites
> Netlify créés depuis avril 2023. Ouvrez **Forms → Usage and configuration →
> Form detection → Enable form detection**, puis **redéployez**. La détection se
> fait à l'analyse du déploiement : activer l'option ne suffit pas.
>
> Tant que ce n'est pas fait, le `POST` répond `404` et la page affiche
> « L'envoi n'a pas abouti… (réf. 404) ».

---

## 3. Le formulaire

Trois champs, dont deux obligatoires : **nom** et **téléphone**. Le métier est
facultatif — chaque champ ajouté coûte des conversions, et le métier se demande
très bien au téléphone.

Champs joints automatiquement à chaque demande :

- `situation` — « A déjà un site » si le visiteur est passé par ce bouton,
  sinon « Ne sait pas encore ». Vous savez ainsi comment aborder l'appel ;
- `gclid`, `utm_*` — la campagne d'origine, retenue 90 jours dans le cookie
  first-party `attr`. **Une valeur existante n'est jamais écrasée par du vide** ;
- `mention_information` et `horodatage` — le texte exact affiché sous le bouton
  et l'heure de l'envoi. C'est votre preuve d'information au sens du RGPD.

En cas d'échec, le message affiche une référence courte :

| Référence | Cause | Correctif |
|---|---|---|
| `réf. 404` / `405` | Netlify n'a pas enregistré le formulaire | Activer la détection (§ 2), **puis redéployer** |
| `réf. 403` | Soumission classée en spam | Voir Forms → rappel → Spam submissions |
| `réf. reseau` | Requête impossible | Connexion ; la console donne le détail |

---

## 4. Google Ads

La balise est en place mais **volontairement inactive** : l'identifiant
`AW-XXXXXXXXXX` est un gabarit, et le chargeur ne s'injecte pas tant qu'il n'est
pas remplacé. Deux valeurs à renseigner :

1. **L'identifiant de conversion** — remplacez `AW-XXXXXXXXXX` (3 occurrences
   dans le `<head>`) par celui de la campagne artisans ;
2. **L'étiquette de conversion** — Google Ads → Objectifs → Conversions → votre
   action → Balise Google, copiez la valeur `send_to` complète dans la constante
   `CONVERSION_LEAD`.

Pensez aussi à déclarer l'identifiant dans le CSP de `netlify.toml` si vous
ajoutez d'autres outils Google — la liste blanche y est stricte.

**Le déclencheur.** Google propose « Chargement de page » ou « Clic ». Aucun des
deux n'est utilisé : la conversion part sur **`lead_submit`**, après que le
serveur a confirmé l'enregistrement. Un clic sur « Envoyer » n'est pas un lead si
l'envoi échoue — compter le clic déclarerait des conversions fantômes sur
lesquelles les enchères automatiques apprendraient.

`CONVERSION_VALEUR` est à **49**, soit un mois d'abonnement. Si vous passez aux
enchères sur la valeur, remplacez-la par la valeur réelle d'un lead : panier
moyen sur la durée de vie du client × taux de transformation.

**Consentement.** Consent Mode v2, les quatre signaux à `denied` avant la
commande `config`. Le bandeau recueille le choix, gardé 6 mois dans
`consentement_pub`. En aperçu local (`file://`), ni script Google ni bandeau : le
double-clic sur `index.html` reste sans aucune requête sortante.

---

## 5. Ce qui vous engage juridiquement

La page affiche trois promesses fortes. Elles sont reprises **à l'article 7 des
CGV**, ce qui les rend opposables. Ne les affichez que si vous comptez les tenir.

| Promesse | Ce que ça vous coûte si vous ne tenez pas |
|---|---|
| Satisfait ou remboursé 30 jours | Vous rendez le premier mois, sans discuter |
| En ligne en 7 jours ouvrés | Un mois remboursé si le retard vient de vous |
| Sans engagement | Aucune indemnité de sortie, résiliation par email |

### Le droit de rétractation s'applique, et beaucoup l'ignorent

L'article **L. 221-3 du Code de la consommation** donne le droit de rétractation
de 14 jours au professionnel qui **emploie 5 salariés ou moins** et dont l'objet
du contrat **n'entre pas dans le champ de son activité principale**. Un maçon qui
souscrit un abonnement à un site internet est très généralement dans ce cas.

C'est traité à l'article 8 des CGV. Ce n'est pas un handicap commercial : votre
garantie 30 jours est déjà plus généreuse. Mais l'omettre serait une clause
abusive.

### Restant à faire

- **Désigner un médiateur de la consommation** (obligatoire dès lors que
  L. 221-3 s'applique, article L. 616-1 du Code de la consommation). Marqué
  `a-completer` dans les mentions légales et les CGV ;
- Vérifier les fourchettes du tableau comparatif ;
- Si vous sous-traitez tout ou partie de la production, il faudra le dire.

---

## 6. Structure de la page

| Section | Rôle |
|---|---|
| Hero | Promesse, prix, 4 preuves, comparatif première année, formulaire |
| Un exemple, en vrai | La preuve par un site livré, plutôt qu'un témoignage |
| Tout est compris | Le forfait détaillé, 12 postes |
| Garanties | Les trois engagements, en cartes |
| Fiche Google | Ce qui fait sonner le téléphone avant le site |
| Une semaine | Le déroulé jour par jour |
| Qui je suis | Le visage derrière l'offre |
| À quoi sert votre site | Le raisonnement des 30 secondes |
| Vous avez déjà un site | Deuxième porte d'entrée, qui qualifie le lead |
| FAQ | 12 objections traitées |
| CTA final | Rappel de l'offre, remontée au formulaire |

**Sur mobile, le formulaire est placé avant les preuves** : la première question
doit être atteignable sans défiler. Le bi-colonnes de bureau les remet à gauche
via `grid-template-areas`.

Le fond du hero est un motif topographique généré comme lignes de niveau d'un
champ périodique — il se répète donc **sans couture**. Fichier :
`assets/topo.svg`, 3,8 Ko.

---

## 7. Vérifications

- [ ] `index.html` s'ouvre en double-cliquant, hors serveur
- [ ] Onglet Network : aucune requête tierce hors domaines Google Ads
- [ ] **Form detection activée** dans Netlify, puis site redéployé
- [ ] Un envoi de test réel arrive dans **Forms → rappel** *et* sur Telegram
- [ ] `AW-…` et `CONVERSION_LEAD` renseignés, conversion visible dans Google Ads
- [ ] Bandeau de consentement : « Refuser » puis « Accepter », choix mémorisé
- [ ] Aucun « Refused to load » dans la console (CSP)
- [ ] Plus aucun surlignage jaune `a-completer` dans les 4 pages
- [ ] Médiateur de la consommation désigné
- [ ] Les 4 pages s'affichent correctement de 320 à 1440 px
