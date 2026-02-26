const CACHE_NAME = 'ai-fridge-app-v1';
const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'assets/images/app-icon-192.png',
  'assets/images/app-icon-512.png',
  'assets/images/app-icon-maskable.png',
  'assets/images/add-icon.png',
  'assets/images/inventory-icon.png',
  'assets/images/logo.png',
  'assets/images/placeholder.jpg',
  'assets/images/camera-placeholder.jpg'
];

// 安装Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果在缓存中找到响应，则返回缓存的响应
        if (response) {
          return response;
        }

        // 否则发起网络请求
        return fetch(event.request)
          .then((response) => {
            // 确保响应有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应，因为响应是流，只能使用一次
            const responseToCache = response.clone();

            // 将新的响应添加到缓存中
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // 如果网络请求失败，返回一个离线页面或错误响应
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('index.html');
            }
          });
      })
  );
});

// 处理推送通知
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: 'assets/images/app-icon-192.png',
      badge: 'assets/images/app-icon-192.png',
      data: {
        url: data.url || 'index.html'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});