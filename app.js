(function(){
  var KEY='mixat-cart', CKEY='mixat-customer';
  var menuEl=document.getElementById('menu'), track=document.querySelector('nav.cats .track');
  function load(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v||d}catch(e){return d}}
  function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
  function priceEl(p){var s=el('span','p');if(p==null||p===''){s.textContent='–';return s}s.textContent=p;s.appendChild(el('small',null,'ج'));return s}
  function srcset(u){
    if(!/images\.unsplash\.com/.test(u))return '';
    var w8=u.replace(/([?&])w=\d+/,'$1w=800');return u+' 480w, '+w8+' 800w';
  }

  fetch('menu.json?v='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(start).catch(function(){
    menuEl.innerHTML='';var p=el('p','loaderr','معرفناش نحمّل المنيو. جرّب تعمل تحديث للصفحة، أو ');
    var a=el('a',null,'اتصل بينا');a.href='tel:01109270440';p.appendChild(a);menuEl.appendChild(p);
  });

  function start(M){
    var WA='2'+String(M.whatsapp||'01109270440').replace(/\D/g,'').replace(/^2?(?=01)/,'');
    var FEE=Math.max(0,parseInt(M.deliveryFee,10)||0);
    var catalog={}; // key -> {name,price}
    var targets={}; // key -> [elements]
    var breadSel={}; // section id -> bread
    menuEl.innerHTML='';
    var listCount=0;

    function reg(key,name,price,node){
      catalog[key]={name:name,price:price};
      (targets[key]=targets[key]||[]).push(node);
    }
    function makeBtn(node,getKey,label){
      node.setAttribute('aria-label','أضف '+label);
      function go(e){if(e.type==='keydown'&&e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();add(getKey())}
      node.addEventListener('click',go);
      if(node.tagName!=='BUTTON'){node.setAttribute('role','button');node.tabIndex=0;node.addEventListener('keydown',go)}
    }

    (M.sections||[]).forEach(function(S){
      var items=(S.items||[]).filter(function(i){return !i.hidden});
      if(!items.length)return;
      var sec=el('section');sec.id=S.id;
      var head=el('div','head'),h2=el('h2','tape '+(S.color||'red'));h2.appendChild(el('span',null,S.title));head.appendChild(h2);sec.appendChild(head);
      if(S.banner){var b=el('img','banner');b.src=S.banner;b.alt='';b.loading='lazy';b.decoding='async';sec.appendChild(b)}
      var pre=S.prefix?S.prefix+' ':'';
      if(S.breads&&S.breads.length){
        breadSel[S.id]=S.breads[0];
        sec.appendChild(el('p','note',S.note||('اختار العيش قبل ما تضيف')));
        var bx=el('div','bread');bx.setAttribute('role','group');bx.setAttribute('aria-label','نوع العيش');
        S.breads.forEach(function(br){
          var btn=el('button',null,br);btn.type='button';btn.setAttribute('aria-pressed',br===breadSel[S.id]);
          btn.onclick=function(){breadSel[S.id]=br;bx.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',x===btn)});badges()};
          bx.appendChild(btn);
        });
        sec.appendChild(bx);
      }else if(S.note){sec.appendChild(el('p','note',S.note))}

      if(S.layout==='cards'){
        var grid=el('div','grid');
        items.forEach(function(it){
          var card=el('article','card'),ph=el('div','ph');
          if(it.img){var im=el('img');im.src=it.img;var ss=srcset(it.img);if(ss){im.srcset=ss;im.sizes='(min-width:880px) 220px, 46vw'}
            im.style.objectPosition=it.pos||'50% 50%';im.alt=it.name;im.loading='lazy';im.decoding='async';ph.appendChild(im)}
          card.appendChild(ph);card.appendChild(el('h3',null,it.name));
          if(S.sizes&&S.sizes.length){
            var sz=el('div','sz');
            S.sizes.forEach(function(size,i){
              var p=(it.prices||[])[i],opt=el('div','opt');opt.appendChild(el('i',null,size));opt.appendChild(priceEl(p));
              if(p==null||p===''){opt.setAttribute('aria-disabled','true')}
              else{var k=it.id+'|'+i,nm=it.name+' ('+size+')';reg(k,nm,+p,opt);makeBtn(opt,function(){return k},nm)}
              sz.appendChild(opt);
            });
            card.appendChild(sz);
          }else{
            var one=el('div','sz one');one.appendChild(priceEl(it.price));
            var k=it.id;reg(k,it.name,+it.price,one);makeBtn(one,function(){return k},it.name);
            card.appendChild(one);
          }
          grid.appendChild(card);
        });
        sec.appendChild(grid);
      }else{
        listCount++;sec.className='half'+(listCount%2?'':' even');
        var ul=el('ul','list');
        items.forEach(function(it){
          var li=el('li');li.appendChild(el('span','n',it.name));li.appendChild(el('span','dots'));li.appendChild(priceEl(it.price));
          var btn=el('button','addbtn','+');btn.type='button';
          if(breadSel[S.id]){
            S.breads.forEach(function(br){reg(it.id+'|'+br,pre+br+' - '+it.name,+it.price,btn)});
            btn.dataset.sec=S.id;btn.dataset.id=it.id;
            makeBtn(btn,function(){return it.id+'|'+breadSel[S.id]},it.name);
          }else{
            var k=it.id;reg(k,pre?pre.trim()+' - '+it.name:it.name,+it.price,btn);makeBtn(btn,function(){return k},it.name);
          }
          li.appendChild(btn);ul.appendChild(li);
        });
        sec.appendChild(ul);
      }
      menuEl.appendChild(sec);
      var a=el('a',null,S.short||S.title);a.href='#'+S.id;track.appendChild(a);
    });

    // category nav highlight
    var links=[].slice.call(track.querySelectorAll('a'));
    function setActive(id){
      links.forEach(function(a){
        var on=a.getAttribute('href')==='#'+id;a.classList.toggle('on',on);
        if(on){var r=a.getBoundingClientRect(),t=track.getBoundingClientRect();
          if(r.left<t.left||r.right>t.right){track.scrollBy({left:(r.left+r.width/2)-(t.left+t.width/2),behavior:'smooth'})}}
      });
    }
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)setActive(e.target.id)})},{rootMargin:'-30% 0px -60% 0px'});
      menuEl.querySelectorAll('section').forEach(function(s){io.observe(s)});
    }
    if(links[0])links[0].classList.add('on');

    // cart — drop anything no longer on the menu and refresh names/prices
    var cart=load(KEY,[]).filter(function(c){return c&&catalog[c.key]&&c.qty>0}).map(function(c){
      return {key:c.key,name:catalog[c.key].name,price:catalog[c.key].price,qty:c.qty}});
    var bar=document.getElementById('orderbar'),toast=document.getElementById('toast'),tt;
    function show(msg){toast.textContent=msg;toast.classList.add('on');clearTimeout(tt);tt=setTimeout(function(){toast.classList.remove('on')},1600)}
    function find(k){for(var i=0;i<cart.length;i++)if(cart[i].key===k)return cart[i]}
    function add(k){var it=catalog[k];if(!it)return;var c=find(k);if(c)c.qty++;else cart.push({key:k,name:it.name,price:it.price,qty:1});changed();show('✓ اتضاف: '+it.name)}
    function setQty(k,d){var c=find(k);if(!c)return;c.qty+=d;if(c.qty<=0)cart=cart.filter(function(x){return x!==c});changed()}
    function sub(){return cart.reduce(function(s,c){return s+c.price*c.qty},0)}
    function count(){return cart.reduce(function(s,c){return s+c.qty},0)}
    function badge(node,q){var b=node.querySelector('.qb');if(q){if(!b){b=el('span','qb');node.appendChild(b)}b.textContent=q}else if(b)b.remove()}
    function badges(){
      var seen=new Set();
      Object.keys(targets).forEach(function(k){targets[k].forEach(function(n){
        if(n.dataset.sec){if(seen.has(n))return;seen.add(n);var c=find(n.dataset.id+'|'+breadSel[n.dataset.sec]);badge(n,c?c.qty:0)}
        else{var c2=find(k);badge(n,c2?c2.qty:0)}
      })});
    }
    var sheet=document.getElementById('sheet'),bg=document.getElementById('sheetBg'),itemsEl=document.getElementById('items');
    function changed(){
      save(KEY,cart);badges();
      var n=count();bar.classList.toggle('has',n>0);
      document.getElementById('cartCount').textContent=n;
      document.getElementById('cartSum').textContent=sub()+' ج';
      renderItems();
      if(!n&&sheet.classList.contains('on'))closeSheet();
    }
    function renderItems(){
      itemsEl.innerHTML='';
      cart.forEach(function(c){
        var li=el('li'),nm=el('div','nm',c.name);nm.appendChild(el('small',null,c.price+' ج'));
        var q=el('div','qty');
        var minus=el('button',null,'−');minus.type='button';minus.setAttribute('aria-label','قلّل');minus.onclick=function(){setQty(c.key,-1)};
        var plus=el('button',null,'+');plus.type='button';plus.setAttribute('aria-label','زوّد');plus.onclick=function(){setQty(c.key,1)};
        q.append(plus,el('span',null,c.qty),minus);
        li.append(nm,q,el('span','p lt',(c.price*c.qty)+' ج'));itemsEl.appendChild(li);
      });
      document.getElementById('feeRow').hidden=!FEE;
      document.getElementById('feeVal').textContent=FEE+' ج';
      document.getElementById('feeNote').hidden=!!FEE;
      document.getElementById('total').textContent=(sub()+FEE)+' ج';
    }
    var lastFocus;
    function openSheet(){lastFocus=document.activeElement;sheet.hidden=false;requestAnimationFrame(function(){sheet.classList.add('on');bg.classList.add('on')});document.body.classList.add('lock');document.getElementById('closeCart').focus()}
    function closeSheet(){sheet.classList.remove('on');bg.classList.remove('on');document.body.classList.remove('lock');setTimeout(function(){if(!sheet.classList.contains('on'))sheet.hidden=true},300);if(lastFocus)lastFocus.focus()}
    document.getElementById('openCart').onclick=openSheet;
    document.getElementById('closeCart').onclick=closeSheet;
    bg.onclick=closeSheet;
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&sheet.classList.contains('on'))closeSheet()});
    document.getElementById('clearCart').onclick=function(){if(confirm('تمسح كل الطلب؟')){cart=[];changed()}};

    var f={name:document.getElementById('cName'),phone:document.getElementById('cPhone'),addr:document.getElementById('cAddr'),note:document.getElementById('cNote')};
    var cu=load(CKEY,{});f.name.value=cu.name||'';f.phone.value=cu.phone||'';f.addr.value=cu.addr||'';
    document.getElementById('orderForm').addEventListener('submit',function(e){
      e.preventDefault();
      var err=document.getElementById('err'),bad=[];
      var ph=f.phone.value.replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).replace(/[^\d]/g,'');
      Object.keys(f).forEach(function(k){f[k].classList.remove('bad')});
      if(!f.name.value.trim())bad.push(f.name);
      if(!/^01\d{9}$/.test(ph))bad.push(f.phone);
      if(!f.addr.value.trim())bad.push(f.addr);
      if(!cart.length){err.textContent='الطلب فاضي';return}
      if(bad.length){bad.forEach(function(x){x.classList.add('bad')});err.textContent=bad.indexOf(f.phone)>-1&&bad.length===1?'اكتب رقم موبايل صحيح (11 رقم يبدأ بـ 01)':'من فضلك كمّل البيانات المطلوبة';bad[0].focus();return}
      err.textContent='';
      save(CKEY,{name:f.name.value.trim(),phone:ph,addr:f.addr.value.trim()});
      var L=['🍔 *طلب جديد - ميكسات*','━━━━━━━━━━'];
      cart.forEach(function(c){L.push(c.qty+' × '+c.name+' = '+(c.price*c.qty)+' ج')});
      L.push('━━━━━━━━━━');
      if(FEE)L.push('التوصيل: '+FEE+' ج','*الإجمالي: '+(sub()+FEE)+' ج*');
      else L.push('*الإجمالي: '+sub()+' ج* (من غير التوصيل)');
      L.push('','👤 الاسم: '+f.name.value.trim(),'📞 الموبايل: '+ph,'📍 العنوان: '+f.addr.value.trim());
      if(f.note.value.trim())L.push('📝 ملاحظات: '+f.note.value.trim());
      window.location.href='https://wa.me/'+WA+'?text='+encodeURIComponent(L.join('\n'));
    });
    changed();
  }
})();
