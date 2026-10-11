importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:'AIzaSyCxNdOs69QAD-1FTIDVyf0N0N2YGqWNgOo',
  authDomain:'nexcart-db-7a02f.firebaseapp.com',
  projectId:'nexcart-db-7a02f',
  storageBucket:'nexcart-db-7a02f.firebasestorage.app',
  messagingSenderId:'868851396316',
  appId:'1:868851396316:web:951e1988f3f2e4b065ce19'
});

firebase.messaging().onBackgroundMessage(function(payload){
  var n=payload.notification||{},data=payload.data||{};
  return self.registration.showNotification(n.title||data.title||'ZORRA',{body:n.body||data.body||'',tag:data.tag||'zorra-order-update',data:{url:data.url||'./home.html'}});
});
self.addEventListener('notificationclick',function(event){event.notification.close();var url=(event.notification.data&&event.notification.data.url)||'./home.html';event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){for(var i=0;i<list.length;i++){if('focus' in list[i]){list[i].navigate(url);return list[i].focus();}}return clients.openWindow?clients.openWindow(url):null;}));});
