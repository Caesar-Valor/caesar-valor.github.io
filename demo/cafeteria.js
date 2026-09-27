(function(){
const WHATSAPP='18492674546';
const RD=n=>'RD$ '+n.toLocaleString('es-DO');
const EXTRAS_CAL=[{n:'Shot extra de espresso',p:50},{n:'Sirope de vainilla',p:40},{n:'Leche de avena',p:45},{n:'Leche deslactosada',p:25}];
const EXTRAS_FRIO=EXTRAS_CAL.slice(1);
const BASE_BATIDA=[{n:'Con agua',p:180},{n:'Con leche',p:210}];
const T='de temporada';

const MENU=[
 {id:'calientes',nombre:'Café caliente',items:[
  ['Espresso',110],['Americano',120],['Cortado',130],['Café con leche',150],['Capuchino',165],
  ['Latte',180],['Latte de vainilla',210],['Mocaccino',215],['Chocolate caliente',175]
 ].map(([n,p])=>({n,p,extras:EXTRAS_CAL}))},
 {id:'frios',nombre:'Café frío',items:[
  ['Americano frío',140],['Cold brew',190],['Latte frío',195],['Latte frío de caramelo',235],['Café tonic',220]
 ].map(([n,p])=>({n,p,extras:EXTRAS_FRIO}))},
 {id:'frappes',nombre:'Frappés',items:[
  {n:'Frappé de café',p:240},{n:'Frappé de moca',p:265},{n:'Frappé de caramelo',p:260},{n:'Frappé de galleta',p:275}
 ]},
 {id:'batidas',nombre:'Batidas y jugos',nota:'Batidas con agua RD$ 180, con leche RD$ 210',items:[
  {n:'Batida de fresa',v:BASE_BATIDA},{n:'Batida de guineo',v:BASE_BATIDA},{n:'Batida de lechosa',v:BASE_BATIDA},
  {n:'Batida de mango',v:BASE_BATIDA,tag:T},{n:'Jugo de chinola',p:150,tag:T},{n:'Jugo de naranja',p:150},
  {n:'Limonada',p:120},{n:'Limonada de coco',p:160}
 ]},
 {id:'bebidas',nombre:'Bebidas',items:[
  {n:'Agua',p:50},{n:'Agua con gas',p:90},{n:'Refresco',p:75},{n:'Té frío de limón',p:110}
 ]},
 {id:'desayunos',nombre:'Desayunos',items:[
  {n:'Mangú con los tres golpes',p:350,d:'Mangú con cebolla, huevo frito, salami y queso frito.'},
  {n:'Tostada francesa',p:320,d:'Pan brioche con canela, miel y frutas frescas.'},
  {n:'Huevos revueltos con tostadas',p:260,d:'Dos huevos revueltos, pan tostado y mantequilla.'},
  {n:'Avena con frutas',p:220,d:'Avena caliente con guineo, fresas y un toque de canela.'}
 ]},
 {id:'sandwiches',nombre:'Sándwiches',items:[
  {n:'Sándwich de pollo',p:380,d:'Pollo a la plancha, lechuga, tomate y mayonesa de ajo en pan de agua.'},
  {n:'Club sándwich',p:420,d:'Pavo, jamón, queso, tocineta, lechuga y tomate en tres pisos de pan.'},
  {n:'Jamón y queso a la plancha',p:290,d:'Pan de molde, jamón, queso amarillo y mantequilla.'},
  {n:'Caprese en ciabatta',p:360,d:'Tomate, mozzarella fresca, albahaca y aceite de oliva.'},
  {n:'Atún gratinado',p:370,d:'Ensalada de atún con queso gratinado en pan de campo.'}
 ]},
 {id:'ensaladas',nombre:'Ensaladas',items:[
  {n:'Ensalada de la casa',p:310,d:'Mezcla de lechugas, tomate, pepino, zanahoria y vinagreta de limón.'},
  {n:'Ensalada de pollo y aguacate',p:390,d:'Pollo a la plancha, lechuga, maíz, aguacate y aderezo de yogur.'},
  {n:'Ensalada tropical',p:360,d:'Lechuga, piña, mango, queso fresco y nueces tostadas.'}
 ]},
 {id:'horno',nombre:'Del horno',items:[
  {n:'Croissant de mantequilla',p:110},{n:'Croissant de jamón y queso',p:180,d:'Relleno de jamón y queso, recién gratinado.'},
  {n:'Galleta de chispas de chocolate',p:85},{n:'Muffin del día',p:120},{n:'Hojaldre de frutos rojos',p:150},
  {n:'Pan de guineo',p:100,d:'Una rebanada gruesa, con nueces.'},{n:'Cheesecake de chinola',p:210,tag:T}
 ]}
];
let uid=0; MENU.forEach(c=>c.items.forEach(it=>{it.id='i'+(uid++);it.cat=c.id}));
const byId=new Map(); MENU.forEach(c=>c.items.forEach(it=>byId.set(it.id,it)));

/* ---------- horario y estado ---------- */
const HORARIO=[[8,14],[7,19],[7,19],[7,19],[7,19],[7,19],[8,20]]; // 0=domingo
const DIAS=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const fmtH=h=>{const s=h>=12?'p. m.':'a. m.';const x=h%12||12;return x+':00 '+s};
function ahoraRD(){
  const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Santo_Domingo',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
  const g=t=>p.find(x=>x.type===t).value;
  const d=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(g('weekday'));
  return {d,h:(+g('hour'))%24+(+g('minute'))/60};
}
function pintarHorario(){
  const {d,h}=ahoraRD();
  const orden=[1,2,3,4,5,6,0];
  document.getElementById('horario').innerHTML=orden.map(i=>{
    const r=HORARIO[i];
    return `<tr class="${i===d?'hoy':''}"><td>${DIAS[i]}${i===d?' (hoy)':''}</td><td>${r?fmtH(r[0])+' a '+fmtH(r[1]):'Cerrado'}</td></tr>`;
  }).join('');
  const el=document.getElementById('estado'); const r=HORARIO[d]; let txt;
  if(r&&h>=r[0]&&h<r[1]){el.classList.add('abierto');txt='Abierto ahora, cerramos a las '+fmtH(r[1]);}
  else{
    el.classList.remove('abierto');
    if(r&&h<r[0]) txt='Cerrado, abrimos hoy a las '+fmtH(r[0]);
    else{let n=(d+1)%7;while(!HORARIO[n])n=(n+1)%7;txt='Cerrado, abrimos el '+DIAS[n].toLowerCase()+' a las '+fmtH(HORARIO[n][0]);}
  }
  el.querySelector('span').textContent=txt;
}
pintarHorario(); setInterval(pintarHorario,60000);

/* ---------- guirnalda ---------- */
const g=document.getElementById('bombillos');
for(let i=0;i<11;i++){const x=15+i*37;const t=x/400;const y=10+ (t<.5? 35*Math.sin(t*Math.PI*2)*.6:  -4*Math.sin((t-.5)*Math.PI*2)) +4;
  const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('cx',x);c.setAttribute('cy',y.toFixed(1));c.setAttribute('r','4');
  c.style.animationDelay=(.3+i*.12)+'s';g.appendChild(c)}

/* ---------- menú ---------- */
const chips=document.getElementById('chips'), lista=document.getElementById('lista'), buscar=document.getElementById('buscar');
let filtro='todo';
chips.innerHTML=[{id:'todo',nombre:'Todo'},...MENU].map(c=>`<button class="chip" data-c="${c.id}" aria-pressed="${c.id==='todo'}">${c.nombre}</button>`).join('');
chips.addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;filtro=b.dataset.c;
  chips.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',x===b));pintarMenu();
  document.getElementById('menu').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
buscar.addEventListener('input',pintarMenu);
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function precioDesde(it){return it.v? 'desde '+RD(it.v[0].p) : RD(it.p)}
function pintarMenu(){
  const q=norm(buscar.value.trim()); let html='';
  MENU.forEach(c=>{
    if(filtro!=='todo'&&filtro!==c.id)return;
    const its=c.items.filter(it=>!q||norm(it.n+' '+(it.d||'')+' '+c.nombre).includes(q));
    if(!its.length)return;
    html+=`<section class="cat" aria-label="${c.nombre}"><div class="cat-head"><h3>${c.nombre}</h3>${c.nota?`<span>${c.nota}</span>`:''}</div><div class="items">`+
      its.map(it=>`<article class="item"><h4>${it.n}<span class="dots"></span></h4><span class="precio">${precioDesde(it)}</span>
        ${it.d?`<p>${it.d}</p>`:''}${it.tag?`<p><span class="tag">Fruta ${it.tag}</span></p>`:''}
        <button class="add" data-id="${it.id}" aria-label="Agregar ${it.n} al pedido" title="Agregar al pedido">+</button></article>`).join('')+`</div></section>`;
  });
  if(html){lista.innerHTML=html;return}
  const vacio=document.createElement('p');vacio.className='vacio';
  vacio.textContent='No encontramos «'+buscar.value+'». Prueba con otra palabra o escríbenos por WhatsApp.';
  lista.replaceChildren(vacio);
}
pintarMenu();

/* ---------- pedido ---------- */
const MAX_Q=99;
// Arma una línea del pedido desde el catálogo: nombre, detalle y precio nunca vienen de fuera
function crearLinea(it,vi,exi,q){
  const variante=vi===null?null:it.v[vi], extras=exi.map(i=>it.extras[i]);
  const p=(variante?variante.p:it.p)+extras.reduce((a,x)=>a+x.p,0);
  const det=[variante&&variante.n,...extras.map(x=>'+ '+x.n)].filter(Boolean).join(', ');
  return {key:it.id+'|'+det,id:it.id,v:vi,ex:exi,n:it.n,det,p,q};
}
// Valida una línea guardada; devuelve null si no coincide con un producto real del menú
function lineaValida(x){
  if(!x||typeof x!=='object'||typeof x.id!=='string'||!byId.has(x.id))return null;
  const it=byId.get(x.id);
  if(!Number.isInteger(x.q)||x.q<1||x.q>MAX_Q)return null;
  let vi=null;
  if(it.v){if(!Number.isInteger(x.v)||x.v<0||x.v>=it.v.length)return null;vi=x.v}
  else if(x.v!==null)return null;
  if(!Array.isArray(x.ex))return null;
  if(x.ex.length&&!it.extras)return null;
  for(let k=0;k<x.ex.length;k++){
    const i=x.ex[k];
    if(!Number.isInteger(i)||i<0||i>=it.extras.length||(k>0&&i<=x.ex[k-1]))return null;
  }
  return crearLinea(it,vi,x.ex.slice(),x.q);
}
let carrito=[];
try{
  const guardado=JSON.parse(localStorage.getItem('cafeteria-pedido')||'[]');
  if(Array.isArray(guardado))guardado.forEach(x=>{
    const l=lineaValida(x);
    if(l&&!carrito.some(y=>y.key===l.key))carrito.push(l);
  });
}catch(e){carrito=[]}
const guardar=()=>{try{localStorage.setItem('cafeteria-pedido',JSON.stringify(carrito.map(({id,v,ex,q})=>({id,v,ex,q}))))}catch(e){}};
const barra=document.getElementById('barra');
function actualizar(pulso){
  const n=carrito.reduce((a,l)=>a+l.q,0), t=carrito.reduce((a,l)=>a+l.q*l.p,0);
  document.getElementById('cuenta').textContent=n;
  document.getElementById('barra-total').textContent=RD(t);
  document.getElementById('pd-total').textContent=RD(t);
  barra.classList.toggle('visible',n>0);
  if(pulso){barra.classList.remove('pulso');void barra.offsetWidth;barra.classList.add('pulso')}
  guardar();
}
function agregar(it,vi,exi){
  const nueva=crearLinea(it,vi,exi,1); const l=carrito.find(x=>x.key===nueva.key);
  if(l)l.q=Math.min(l.q+1,MAX_Q); else carrito.push(nueva);
  actualizar(true); toast('Agregado: '+it.n);
}
const toastEl=document.getElementById('toast'); let tt;
function toast(m){toastEl.textContent=m;toastEl.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('on'),1800)}

const dlgOp=document.getElementById('dlg-opciones'); let itemActual=null;
lista.addEventListener('click',e=>{
  const b=e.target.closest('.add');if(!b)return;
  const it=byId.get(b.dataset.id); if(!it)return;
  if(!it.v&&!it.extras){agregar(it,null,[]);return}
  itemActual=it;
  document.getElementById('op-titulo').textContent=it.n;
  let h='';
  if(it.v)h+=`<fieldset><legend>Elige la base</legend>${it.v.map((v,i)=>`<label class="opcion"><input type="radio" name="var" value="${i}" ${i===0?'checked':''}><span>${v.n}</span><span>${RD(v.p)}</span></label>`).join('')}</fieldset>`;
  else h+=`<p>Precio base: <b>${RD(it.p)}</b></p>`;
  if(it.extras)h+=`<fieldset><legend>¿Algún extra? (opcional)</legend>${it.extras.map((x,i)=>`<label class="opcion"><input type="checkbox" name="ext" value="${i}"><span>${x.n}</span><span>+ ${RD(x.p)}</span></label>`).join('')}</fieldset>`;
  document.getElementById('op-body').innerHTML=h;
  dlgOp.showModal();
});
document.getElementById('op-agregar').addEventListener('click',()=>{
  const f=document.getElementById('form-opciones'); const it=itemActual;
  const vi=f.querySelector('input[name=var]:checked'); const v=it.v?+vi.value:null;
  const ex=[...f.querySelectorAll('input[name=ext]:checked')].map(x=>+x.value).sort((a,b)=>a-b);
  agregar(it,v,ex); dlgOp.close();
});

const dlgPd=document.getElementById('dlg-pedido'), lineas=document.getElementById('lineas');
// Crea un elemento con clase y texto (el texto siempre como textContent)
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function botonQty(i,d,txt,label){const b=el('button',null,txt);b.type='button';b.dataset.i=i;b.dataset.d=d;b.setAttribute('aria-label',label);return b}
function pintarLineas(){
  if(!carrito.length){lineas.replaceChildren(el('p','vacio','Tu pedido está vacío. Agrega algo del menú para empezar.'));return}
  lineas.replaceChildren(...carrito.map((l,i)=>{
    const fila=el('div','linea'), qty=el('div','qty');
    qty.append(botonQty(i,-1,'−','Quitar uno de '+l.n),el('span',null,l.q),botonQty(i,1,'+','Agregar uno de '+l.n));
    fila.append(el('b',null,l.n),el('span','precio',RD(l.p*l.q)),el('small',null,l.det),qty);
    return fila;
  }));
}
document.getElementById('abrir-pedido').addEventListener('click',()=>{pintarLineas();document.getElementById('err').hidden=true;dlgPd.showModal()});
lineas.addEventListener('click',e=>{const b=e.target.closest('button[data-i]');if(!b)return;
  const l=carrito[+b.dataset.i];if(!l)return;l.q=Math.min(l.q+(+b.dataset.d),MAX_Q);if(l.q<=0)carrito.splice(+b.dataset.i,1);
  actualizar(false);pintarLineas();if(!carrito.length)dlgPd.close();});

function waURL(txt){return 'https://wa.me/'+WHATSAPP+'?text='+encodeURIComponent(txt)}
document.getElementById('enviar').addEventListener('click',()=>{
  const nombre=document.getElementById('f-nombre').value.trim();
  const nota=document.getElementById('f-nota').value.trim();
  const err=document.getElementById('err');
  if(!nombre){err.textContent='Escribe tu nombre para que sepamos de quién es el pedido.';err.hidden=false;return}
  err.hidden=true;
  const total=carrito.reduce((a,l)=>a+l.q*l.p,0);
  let m='¡Hola Amor y Café! Quiero hacer un pedido:\n\n';
  carrito.forEach(l=>{m+=`• ${l.q} × ${l.n}${l.det?' ('+l.det+')':''}: ${RD(l.p*l.q)}\n`});
  m+=`\n*Total: ${RD(total)}* (ITBIS incluido)\n\nEntrega: Para recoger\nNombre: ${nombre}`;
  if(nota)m+=`\nNota: ${nota}`;
  window.open(waURL(m),'_blank','noopener');
});
document.getElementById('btn-vitrina').href=waURL('¡Hola Amor y Café! ¿Qué tienen hoy en vitrina?');
document.getElementById('wa-footer').href=waURL('¡Hola Amor y Café!');
actualizar(false);
})();
