(function(){
  var P='#2ECC71', A='#1E9E57';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function read(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
  function nav(active){var items=[['home.html','Home','⌂'],['shops.html','Shops','▦'],['products.html','Products','□'],['account.html','Account','◉'],['settings.html','Settings','⚙']];return '<header class="jora-topbar"><a class="jora-brand" href="home.html">Jora</a><nav class="jora-toplinks">'+items.map(function(x){return '<a href="'+x[0]+'" '+(active===x[1].toLowerCase()?'aria-current="page"':'')+'>'+x[1]+'</a>'}).join('')+'</nav></header><nav class="jora-bottomnav" aria-label="Primary">'+items.map(function(x){return '<a href="'+x[0]+'" data-icon="'+x[2]+'" '+(active===x[1].toLowerCase()?'aria-current="page"':'')+'>'+x[1]+'</a>'}).join('')+'</nav>'}
  function image(x,label){return '<div class="jora-card__image">'+(x?'<img loading="lazy" src="'+esc(x)+'" alt="'+esc(label)+'">':'J')+'</div>'}
  function money(v){return '₹'+(Number(v)||0).toLocaleString('en-IN')}
  window.JoraShell={nav:nav,read:read,esc:esc,image:image,money:money,primary:P,active:A};
  document.documentElement.dataset.theme=localStorage.getItem('jora_theme')||'light';
})();
