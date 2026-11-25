# École Numérique — dépôt GitHub (site web + APK Android + application Windows)

Un seul dépôt, trois livrables construits automatiquement par GitHub Actions :

| Livrable | Workflow | Quand |
|---|---|---|
| Site web (PWA) sur GitHub Pages | `pages.yml` | à chaque envoi sur `main` |
| **APK Android** | `android.yml` | à la main, ou quand vous créez une étiquette `v…` |
| **Application Windows** (installateur + version portable `.exe`) | `windows.yml` | à la main, ou quand vous créez une étiquette `v…` |

## Contenu du dépôt
- `www/` : l'application (index.html, app-*.js, manifest, service worker, icônes).
- `sql/` : scripts Supabase (à lancer dans Supabase, jamais publiés avec le site).
- `docs/` : guides (DREPPNF, services, ministère, comptes…).
- `electron/` + `package.json` : enveloppe Windows. `mobile/` + `scripts/` : enveloppe Android (Capacitor).
- `tests/` : tests automatiques (`npm test`), lancés avant chaque mise en ligne du site.

## Étape 1 — Mettre le dépôt sur GitHub
1. Sur github.com : **New repository** (par exemple `ecole-numerique`), sans README.
2. Envoyez tout le contenu de ce dossier (glisser-déposer dans « uploading an existing file », ou `git`) :
   ```
   git init && git add . && git commit -m "École Numérique v55"
   git branch -M main
   git remote add origin https://github.com/VOTRE-COMPTE/ecole-numerique.git
   git push -u origin main
   ```
   ⚠ N'oubliez pas le dossier caché `.github` (il contient les workflows).

## Étape 2 — Site web (GitHub Pages)
1. **Settings → Pages → Source : GitHub Actions**.
2. L'onglet **Actions** lance « Site web » ; au bout de 1 à 2 minutes l'adresse apparaît :
   `https://VOTRE-COMPTE.github.io/ecole-numerique/`
3. Ouvrez-la sur téléphone ou PC → « Installer l'application » fonctionne déjà (PWA).

## Étape 3 — APK Android et application Windows
**Méthode simple (sans étiquette)** : onglet **Actions** → choisir « Application Android (APK) » (ou « Application Windows ») → **Run workflow**. À la fin (≈ 5 à 10 min), ouvrez l'exécution et téléchargez le fichier dans **Artifacts**.

**Méthode « version publiée »** : créez une étiquette, les deux workflows partent seuls et joignent les fichiers à une **Release** téléchargeable par tous :
```
git tag v55.1.0
git push origin v55.1.0
```
Fichiers obtenus : `EcoleNumerique-Android.apk`, `EcoleNumerique-Setup-55.1.0.exe` (installateur), `EcoleNumerique-Portable-55.1.0.exe` (sans installation).

## Installer
- **Android** : copier l'APK sur le téléphone → l'ouvrir → autoriser « installer des applications inconnues » pour le gestionnaire de fichiers.
  L'APK est signé avec une clé de test : parfait pour une installation directe, mais **pas pour le Play Store** (voir plus bas).
- **Windows** : lancer le `.exe`. Comme il n'est pas signé par un éditeur payant, SmartScreen affiche « Windows a protégé votre PC » → **Informations complémentaires → Exécuter quand même**.

## Mises à jour
Modifiez les fichiers dans `www/`, envoyez sur `main` (le site se met à jour), puis changez `version` dans `package.json` et `mobile/package.json` et créez une nouvelle étiquette (`v55.0.1`…) pour de nouveaux APK/.exe.
**Mise à jour automatique du site / de la PWA** : rien à changer à la main. À chaque envoi sur `main`, `pages.yml` donne un nouveau nom au cache du service worker (`sw.js`) ; les utilisateurs qui ouvrent l'application avec internet reçoivent la nouvelle version et un bandeau « Actualiser » apparaît. Hors ligne, la copie en cache continue de fonctionner.
**APK et .exe : mises à jour automatiques aussi.** Depuis la v55.1.0, l'APK et l'application Windows chargent le **site en ligne** (GitHub Pages) au lieu de leur copie embarquée. Vous publiez sur `main` → tous les clients (site, APK, Windows) reçoivent la nouvelle version à leur prochaine ouverture avec internet. Il n'y a plus besoin de renvoyer un APK/.exe, sauf pour changer l'enveloppe elle-même (icône, nom, version d'Android/Electron).
- L'adresse utilisée est déduite du dépôt (`https://COMPTE.github.io/DEPOT/`). Si vous avez un domaine personnalisé : **Settings → Secrets and variables → Actions → Variables → New repository variable** nommée `URL_SITE`.
- Le **premier lancement** demande internet (pour charger le site une fois). Ensuite, le service worker garde la copie hors ligne. Sans internet au tout premier lancement, l'APK affiche « Connexion requise » et Windows ouvre sa copie locale.
Les données restent dans Supabase : seule l'enveloppe change.

## Play Store (plus tard)
Il faut un fichier de signature (keystore) et un `.aab`. Dites-moi quand vous voulez le faire : j'ajouterai l'étape de signature avec vos secrets GitHub.

## En cas d'échec d'un workflow
Ouvrez l'exécution en rouge dans l'onglet **Actions**, copiez les dernières lignes de l'étape qui a échoué et envoyez-les-moi.
