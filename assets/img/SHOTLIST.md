# Shotlist — visuels à produire

Les fichiers actuellement présents dans `placeholder/` sont des **gabarits gris
aux dimensions exactes**. La mise en page est donc déjà juste : remplacer une
image ne déplacera rien (CLS = 0), à condition de respecter le ratio indiqué.

> **Règle absolue** : aucune image de banque américaine, aucun toit en shingle
> asphalté, aucun ciel californien. Le visiteur du Nord reconnaît un toit du Nord.
> Une photo qui « sonne faux » coûte plus cher en méfiance qu'elle ne rapporte en
> esthétique.

---

## 1. Hero — couvreur en action

| | |
|---|---|
| **Emplacement** | Fond du hero, en surimpression sous un voile bleu nuit à 72 % (80 % sur mobile) |
| **Fichier cible** | `assets/img/hero-couvreur-1600.jpg` (+ `-1200`, `-800`) |
| **Ratio / taille** | 16/10, 1600 × 1000 px minimum |
| **Placeholder actuel** | `placeholder/hero-couvreur.svg` |

**Ce qu'il faut** : un couvreur en tenue de travail, en action sur un versant en
tuiles, vu de trois quarts arrière ou de profil. Lumière naturelle de jour,
ciel du Nord (gris clair, nuages hauts — pas de grand bleu méditerranéen).
Tuiles rouges ou brunes, pas de shingle. Le sujet doit être décentré vers la
droite : le texte du hero occupe la gauche sur desktop.

**Ce qu'il faut éviter** : le pouce levé, le sourire face caméra, le casque
blanc de chef de chantier immaculé, la pose figée.

**Attention** : le voile bleu couvre 72 % de l'image. Une photo trop sombre
disparaît. Privilégier une prise de vue lumineuse et contrastée.

---

## 2. Avant / après démoussage — le visuel le plus persuasif du métier

| | |
|---|---|
| **Emplacement** | Section « Chantiers récents », première vignette |
| **Fichier cible** | `assets/img/realisations/demoussage-avant-apres.jpg` |
| **Ratio / taille** | 4/3, 800 × 600 px minimum |
| **Placeholder actuel** | `placeholder/realisation-1.svg` |

**Ce qu'il faut** : **exactement le même angle**, le même cadrage et si possible
la même heure de la journée, avant et après. Deux photos montées côte à côte ou
en diptyque vertical. Le versant nord chargé de mousse verte, puis le même
versant propre.

Le « même angle » n'est pas un détail : c'est ce qui rend la preuve crédible.
Repérer un point fixe (une souche de cheminée, un poteau) et le garder au même
endroit dans le cadre.

**Légende à écrire** : commune réelle, surface réelle, durée réelle.
Ne jamais légender avec une commune où le chantier n'a pas eu lieu.

---

## 3. Détail technique — la texture

| | |
|---|---|
| **Emplacement** | Section « Chantiers récents », deuxième vignette |
| **Fichier cible** | `assets/img/realisations/detail-solin.jpg` |
| **Ratio / taille** | 4/3, 800 × 600 px minimum |
| **Placeholder actuel** | `placeholder/realisation-2.svg` |

**Ce qu'il faut** : un gros plan. Une main gantée sur une tuile, un solin repris
au mortier contre une souche de cheminée, une jonction de zinc, un crochet de
gouttière. On doit voir le grain du matériau et la trace du geste.

C'est la photo qui dit « cette personne sait ce qu'elle fait » sans qu'on ait
besoin de l'écrire.

---

## 4. Chantier avec échafaudage — le sérieux

| | |
|---|---|
| **Emplacement** | Section « Chantiers récents », troisième vignette |
| **Fichier cible** | `assets/img/realisations/chantier-echafaudage.jpg` |
| **Ratio / taille** | 4/3, 800 × 600 px minimum |
| **Placeholder actuel** | `placeholder/realisation-3.svg` |

**Ce qu'il faut** : une façade avec échafaudage monté, filets de protection,
matériel rangé. Vue depuis la rue ou le jardin. Cette image dit deux choses à
l'avatar : l'entreprise investit dans la sécurité, et elle est assurée.

Sur une maison de type briques rouges du Nord si possible.

---

## 5. Portrait de l'artisan — le levier de confiance le plus fort

| | |
|---|---|
| **Emplacement** | À insérer dans la section « Comment ça se passe » ou près de la FAQ (bloc à créer) |
| **Fichier cible** | `assets/img/portrait-artisan.jpg` |
| **Ratio / taille** | 1/1, 600 × 600 px minimum |
| **Placeholder actuel** | `placeholder/portrait-artisan.svg` |

**Ce qu'il faut** : visage net, tenue de travail ou casque, **regard caméra**,
expression neutre ou légèrement souriante. Fond réel (chantier flou, camionnette,
atelier), pas de fond blanc studio.

Sur une audience de 45–70 ans méfiante, un visage identifiable fait plus pour la
conversion que trois arguments supplémentaires. C'est la photo à produire en
priorité si le budget est limité.

**Important** : recueillir l'autorisation écrite de la personne photographiée
(droit à l'image), et l'archiver avec les mentions légales.

---

## 6. Visuel de partage (Open Graph)

| | |
|---|---|
| **Emplacement** | `<meta property="og:image">` — aperçu lors d'un partage |
| **Fichier cible** | `assets/img/og-partage.jpg` |
| **Ratio / taille** | 1200 × 630 px exactement |
| **Placeholder actuel** | `placeholder/og-partage.svg` |

Reprise du visuel hero, recadrée, avec le nom du service en surimpression.
Texte court et gros : il sera lu en vignette.

---

## Spécifications techniques communes

### Formats à produire

Pour chaque photo, générer trois formats et trois largeurs :

```
nom-800.avif   nom-800.webp   nom-800.jpg
nom-1200.avif  nom-1200.webp  nom-1200.jpg
nom-1600.avif  nom-1600.webp  nom-1600.jpg
```

Commandes de référence (ImageMagick + cwebp + avifenc) :

```sh
# redimensionnement
magick source.jpg -resize 1200x -quality 82 nom-1200.jpg
# webp
cwebp -q 80 nom-1200.jpg -o nom-1200.webp
# avif
avifenc --min 24 --max 32 nom-1200.jpg nom-1200.avif
```

### Balisage à mettre en place une fois les vraies photos livrées

Les vignettes utilisent aujourd'hui une simple balise `<img>` pointant vers un
SVG, afin que **rien ne soit cassé au premier chargement**. Une fois les fichiers
AVIF/WebP/JPEG réellement produits, remplacer chaque `<img>` par ce bloc — et
seulement à ce moment-là, car un `<source>` qui pointe vers un fichier absent
affiche une image cassée sans revenir au `<img>` de repli :

```html
<picture>
  <source type="image/avif"
          srcset="/assets/img/realisations/nom-800.avif   800w,
                  /assets/img/realisations/nom-1200.avif 1200w,
                  /assets/img/realisations/nom-1600.avif 1600w"
          sizes="(min-width: 900px) 33vw, 100vw">
  <source type="image/webp"
          srcset="/assets/img/realisations/nom-800.webp   800w,
                  /assets/img/realisations/nom-1200.webp 1200w,
                  /assets/img/realisations/nom-1600.webp 1600w"
          sizes="(min-width: 900px) 33vw, 100vw">
  <img src="/assets/img/realisations/nom-1200.jpg"
       width="800" height="600"
       loading="lazy" decoding="async"
       alt="Description réelle de ce que montre la photo">
</picture>
```

**Le hero fait exception** : il est posé en `background-image` dans le CSS
critique (`.hero__fond`), ce qui évite toute image cassée si le fichier manque.
Pour le remplacer, modifier une seule ligne dans le `<style>` de `index.html` :

```css
.hero__fond{background-image:url('/assets/img/hero-couvreur-1600.jpg')}
```

Et, pour servir l'AVIF/WebP aux navigateurs qui les acceptent :

```css
.hero__fond{
  background-image: image-set(
    url('/assets/img/hero-couvreur-1600.avif') type('image/avif'),
    url('/assets/img/hero-couvreur-1600.webp') type('image/webp'),
    url('/assets/img/hero-couvreur-1600.jpg')  type('image/jpeg'));
}
```

### Règles non négociables

- `width` et `height` explicites sur **chaque** `<img>` — c'est ce qui garantit
  un CLS à 0.
- `loading="lazy"` partout **sauf** le visuel du hero.
- `alt` descriptif réel : ce que montre la photo, pas un mot-clé.
  « Couvreur remplaçant des tuiles gélives sur un versant nord » — pas
  « couvreur Nord 59 devis toiture pas cher ».
- Poids cible : moins de 150 Ko par image en 1200 px de large.
- Aucune image hébergée sur un domaine tiers.
