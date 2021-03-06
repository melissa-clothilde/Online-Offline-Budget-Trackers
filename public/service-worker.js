const FILES_TO_CACHE = ["/", "/index.html", "/styles.css", "/index.js", "/manifest.webmanifest"];

const iconSizes = ["192", "512"];
const iconFiles = iconSizes.map(
  (size) => `/icons/icon-${size}x${size}.png`
);

const staticFilesToPreCache = [...FILES_TO_CACHE, ...iconFiles];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// install
self.addEventListener("install", function(evt) {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(staticFilesToPreCache);
    })
  );

  self.skipWaiting();
});

// activate
self.addEventListener("activate", function(evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetch
self.addEventListener("fetch", function (evt) {
  const { url } = evt.request;
  if (url.includes("/api/transaction")) {
    
    evt.respondWith(
      caches
        .open(DATA_CACHE_NAME)
        .then((cache) => {
          return fetch(evt.request)
            .then((response) => {
              console.log("response!", response)
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(url, response.clone());
              }

              return response;
            })
            .catch((err) => {
              console.log("network request failed!", evt.request)//DATA NOT CACHING, BUT VISIBLE IN PREVEIW under Applications tab--> data cache
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
              
            });
        })
        .catch((err) => console.log(err))
    );
  } else {
    // respond from static cache, request is not for /api/*
    evt.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(evt.request).then((response) => {
          return response || fetch(evt.request);
        });
      })
    );
  }
});
