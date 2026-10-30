/* ============================================================
   sw.js — Service Worker : fonctionnement hors ligne complet
   ============================================================ */

// Ce nom est remplacé automatiquement à chaque publication (workflow pages.yml,
// étape « Version du cache ») : inutile de le modifier à la main.
const CACHE_NAME = 'ecole-bf-cache-v55';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './db.js',
  './supabase-sync.js',
  './app-core.js',
  './app-crud.js',
  './app-people.js',
  './app-fiche-scolarite.js',
  './app-pedagogie.js',
  './app-registre.js',
  './app-registre-matricule.js',
  './app-courrier.js',
  './app-gestion.js',
  './app-patrimoine.js',
  './app-admin.js',
  './app-cahier-bord.js',
  './app-cahier-enseignant.js',
  './app-cahier-sync.js',
  './app-cahier-semaine.js',
  './app-print-a4.js',
  './app-pdf.js',
  './app-word.js',
  './app-parents.js',
  './app-examens-calcul.js',
  './app-examens.js',
  './app-examens-correction.js',
  './app-examens-docs.js',
  './app-examens-remontee.js',
  './app-examens-circuit.js',
  './app-reseau.js',
  './app-listes-ceb.js',
  './app-cep-core.js',
  './app-cep-tableaux.js',
  './app-cep-calendrier.js',
  './app-cep-validation.js',
  './app-cep-jourj.js',
  './app-personnel-reseau.js',
  './app-matricules-cep.js',
  './app-scanner.js',
  './app-bureaux.js',
  './app-services.js',
  './app-cantine-rations.js',
  './app-ui.js',
  './hors-ligne.html',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

// Bibliothèque externe indispensable au démarrage (client Supabase). Elle est
// chargée depuis un CDN (voir index.html) : sans mise en cache explicite, le
// service worker l'ignorait (voir plus bas, requêtes hors origine) et
// l'application affichait "Configuration manquante" dès que le réseau
// mobile était faible ou coupé au moment du chargement.
const EXTERNAL_SHELL = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

const EXTERNAL_ALT = [
  'https://fastly.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://gcore.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.all([
      // cache: 'reload' = on ignore le cache HTTP du navigateur / de GitHub Pages
      // (valable ~10 min) pour être sûr de mettre en cache les fichiers
      // les plus récents. Si un seul fichier échoue, l'installation est
      // abandonnée et l'ancienne version reste en place (pas de mélange).
      ...APP_SHELL.map((url) => fetch(new Request(url, { cache: 'reload' })).then((res) => {
        if (!res || !res.ok) throw new Error('Échec de mise en cache : ' + url);
        return cache.put(url, res);
      })),
      // Requêtes indépendantes : si le CDN est momentanément injoignable à
      // l'installation, on ne bloque pas la mise en cache du reste de
      // l'application pour autant.
      ...EXTERNAL_SHELL.map((url) => fetch(url).then((res) => {
        if (res && res.status === 200) return cache.put(url, res);
      }).catch(() => {}))
    ])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Ne jamais mettre en cache les appels vers Supabase (API, temps réel) : ils
  // doivent toujours atteindre le réseau pour refléter les données à jour.
  if (url.hostname.endsWith('.supabase.co')) return;
  // Les fichiers de l'application (même origine) ET la bibliothèque du CDN
  // listée ci-dessus passent par le cache, pour permettre le fonctionnement
  // hors ligne dès que le premier chargement a réussi une fois.
  const isAppShell = url.origin === self.location.origin;
  const isExternalShell = EXTERNAL_SHELL.includes(event.request.url) || EXTERNAL_ALT.includes(event.request.url);
  if (!isAppShell && !isExternalShell) return;
  // Fichiers de l'application : RÉSEAU D'ABORD. Dès qu'une connexion existe,
  // l'utilisateur reçoit la dernière version publiée. Si le réseau est absent
  // ou trop lent (> DELAI_RESEAU), on sert la copie en cache : l'application
  // reste utilisable hors ligne. La bibliothèque du CDN, elle, ne change pas :
  // cache d'abord.
  if (isExternalShell) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      }))
    );
    return;
  }
  event.respondWith(reseauDabord(event.request));
});

const DELAI_RESEAU = 4000; // ms avant de se rabattre sur le cache (réseau mobile faible)

function reseauDabord(request) {
  return new Promise((resolve) => {
    let repondu = false;
    const depuisCache = () => caches.match(request, { ignoreSearch: request.mode === 'navigate' });
    const minuteur = setTimeout(() => {
      depuisCache().then((cached) => { if (cached && !repondu) { repondu = true; resolve(cached); } });
    }, DELAI_RESEAU);
    fetch(request, { cache: 'reload' }).then((res) => {
      clearTimeout(minuteur);
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      if (!repondu) { repondu = true; resolve(res); }
    }).catch(() => {
      clearTimeout(minuteur);
      if (repondu) return;
      depuisCache().then((cached) => { repondu = true; resolve(cached || Response.error()); });
    });
  });
}
