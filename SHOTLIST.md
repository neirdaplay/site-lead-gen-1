# Photos à fournir

Toutes les images vivent dans `assets/img/`. **Gardez exactement ces noms de
fichier** : le HTML les appelle tels quels.

Les emplacements manquants sont occupés par des **gabarits gris aux bonnes
dimensions**. La mise en page est donc déjà juste : déposer la vraie photo ne
déplacera rien, et le score de stabilité visuelle reste intact.

---

## 1. Avant / après — cinq chantiers

Le carrousel de la section « Avant / Après » affiche cinq paires. Chaque paire
tient en deux photos du **même toit, sous le même angle**.

| Fichier | Chantier | État |
|---|---|---|
| `avant-3.jpg` / `apres-3.jpg` | **Dunkerque** — ouvre le carrousel | ✅ fournies |
| `avant-1.jpg` / `apres-1.jpg` | Hazebrouck | ✅ fournies |
| `avant-2.jpg` / `apres-2.jpg` | Orchies | ✅ fournies |
| `avant-4.jpg` / `apres-4.jpg` | Sainghin-en-Weppes | ✅ fournies |
| `avant-5.jpg` / `apres-5.jpg` | Valenciennes | ✅ fournies |

L'ordre d'affichage n'est pas l'ordre des fichiers : **Dunkerque ouvre le
carrousel** parce que c'est la comparaison la plus démonstrative. L'ordre est
défini dans `index.html`, dans la liste `#piste-paires`.

Les cinq chantiers portent la même étiquette : **Nettoyage + reprotection en
résine hydrofuge colorée**.

Les paires 4 et 5 ont été livrées en **portrait** (3:4). Comme l'affichage
impose le 4/3 paysage, elles ont été recadrées sur une bande prise un peu
au-dessus du centre : sur une photo de maison la toiture est toujours en haut,
et un recadrage centré l'aurait coupée.

**Attention à l'extension.** Plusieurs fichiers ont été déposés en `.JPG`
majuscules. Netlify distingue la casse, contrairement à Windows : ces images
s'affichaient en local et auraient renvoyé une **404 en ligne**. Elles ont été
renommées en minuscules. Vérifiez ce point à chaque nouvel envoi.

Toutes ont été ramenées de 318 Ko – 1 Mo à **96 – 264 Ko**.

**Format : 1200 × 900 px (4/3), JPEG, moins de 250 Ko.**

L'affichage force le ratio 4/3 et recadre au centre. Une photo prise en 16/9
fonctionne, mais elle sera rognée en haut et en bas : cadrez un peu large.

### Ce qui fait une bonne paire

- **Le même angle, à quelques degrés près.** C'est la seule chose qui rend la
  comparaison crédible. Repérez un point fixe — une cheminée, un velux, un
  angle de mur — et replacez-vous dessus.
- **La même météo si possible.** Un avant sous les nuages et un après en plein
  soleil, ça se voit, et ça décrédibilise le reste.
- **Pas de personne identifiable, pas de plaque d'immatriculation, pas de
  numéro de rue lisible.** Une autorisation écrite du propriétaire est
  préférable dès lors que sa maison est reconnaissable.

Après avoir déposé les photos, mettez à jour les deux légendes correspondantes
dans `index.html` — cherchez `paire__legende` — ainsi que le texte alternatif
de chaque image. Les légendes 2 et 3 portent un surlignage jaune
`à compléter` qui disparaîtra une fois renseignées.

---

## 2. Interlocuteur

| Fichier | Sujet | État |
|---|---|---|
| `interlocuteur.jpg` | Portrait | ✅ fournie |

**Format : 480 × 480 px (carré), JPEG, moins de 120 Ko.**

L'original fourni faisait 922 × 1152 et 677 Ko, pour un affichage en rond de
160 px et une vignette de 36 px dans le formulaire. Il a été **recadré en carré
sur le visage et compressé à 30 Ko** — même rendu, vingt fois plus léger. Si
vous en changez, refaites cette étape : une photo de téléphone brute pèse
plusieurs mégaoctets et se paie en secondes de chargement sur mobile.

Le même visage sert à trois endroits : le bloc interlocuteur (160 px), le pied
du formulaire (36 px) et l'écran de confirmation (72 px).

Le texte du bloc est en placeholder, marqué `<!-- À VALIDER -->` dans
`index.html`. Il parle volontairement de l'**interlocuteur et du suivi**,
jamais de l'exécution des travaux ni d'une qualification technique : les pages
légales disent que les travaux sont réalisés par Technitoit, et les deux ne
doivent pas se contredire.

---

## 3. Déjà en place

| Fichier | Emplacement | Format |
|---|---|---|
| `hero-couvreur.jpg` | Fond du hero | 1600 px de large |
| `og-partage.jpg` | Aperçu de partage | 1200 × 630 |
| `favicon.svg` | Icône d'onglet | vectoriel |

Les fichiers `avant-hazebrouck.jpg` et `apres-hazebrouck.jpg` sont les
originaux du premier chantier ; `avant-1.jpg` et `apres-1.jpg` en sont la
copie utilisée par le carrousel.

---

## Avant de déposer quoi que ce soit

- **Ce sont vos photos.** Aucune image de banque, aucune photo trouvée en
  ligne : la page promet des chantiers réels, et une image achetée reconnue
  ruine la confiance qu'elle était censée créer.
- **Compressez.** Un JPEG sorti du téléphone pèse 3 à 5 Mo ; visez 250 Ko.
  [Squoosh](https://squoosh.app) fait ça dans le navigateur, sans rien
  installer.
- **Ne changez ni les dimensions ni les noms de fichier**, sinon il faudra
  aussi toucher au HTML.
