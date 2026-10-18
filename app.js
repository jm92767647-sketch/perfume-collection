(() => {
 'use strict';
 const $=s=>document.querySelector(s), n=PERFUMES.length, reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const initialIndex=Math.max(0,PERFUMES.findIndex(p=>p.id==='724'));
 let selected=initialIndex,position=initialIndex,animation=0,drag=null,suppressClickUntil=0,lastWheel=0,wheelSum=0,paused=reduced.matches;
 const mod=x=>(x%n+n)%n, delta=x=>mod(x+n/2)-n/2;
 const bottles=$('#bottles'), dots=$('#dots');
 // One envelope for the entire collection keeps both arrows fixed between products.
 const collectionHalfWidth=Math.max(...PERFUMES.map(p=>{
  const xs=(p.clip.match(/[\d.]+(?=%)/g)||[]).map(Number).filter((_,i)=>i%2===0);
  return Math.max(50-Math.min(...xs),Math.max(...xs)-50)/100*p.width/p.height/(p.bottom-p.top);
 }));
 const items=PERFUMES.map((p,i)=>{
  const el=document.createElement('div');el.className='bottle';el.setAttribute('aria-hidden','true');
  const frame=document.createElement('div');frame.className='bottle-frame';
  const img=new Image();img.className='bottle-image';img.src=p.image;img.alt=p.korean;img.draggable=false;img.decoding='async';img.style.clipPath=p.clip;
  frame.append(img);el.append(frame);bottles.append(el);
  const dot=document.createElement('button');dot.className='dot';dot.setAttribute('aria-label',`${i+1}. ${p.brand} ${p.name}`);dot.title=p.name;dot.onclick=()=>{if(performance.now()>suppressClickUntil)go(i)};dots.append(dot);
  return {el,frame,img,dot};
 });
 function dimensions(){const mobile=innerWidth<=700;return {h:mobile?Math.min(290,$('#stage').clientHeight*.82):Math.min(515,$('#stage').clientHeight*.79),r:mobile?innerWidth*.96:Math.min(innerWidth*.46,820),angle:mobile?1.17:1.03};}
 function paint(){
  const {h,r,angle}=dimensions();
  const center=$('#bottles'),x=center.offsetLeft;
  const gap=Math.min(collectionHalfWidth*h+(innerWidth<=700?52:66),x-24,innerWidth-x-24);
  $('#product-controls').style.cssText=`--product-x:${x}px;--product-y:${center.offsetTop+h*.36}px;--product-gap:${gap}px`;
  items.forEach(({el,frame,img,dot},i)=>{
   const d=delta(i-position),a=d*angle,visible=Math.abs(d)<1.95;
   el.style.display=visible?'block':'none';
   if(visible){const scale=1-Math.min(.32,Math.abs(d)*.19),x=Math.sin(a)*r,y=(1-Math.cos(a))*r*.9;
    el.style.transform=`translate3d(${x}px,${y}px,${-Math.abs(d)*80}px) rotate(${a*25}deg) scale(${scale})`;
    el.style.opacity=String(Math.max(0,1-Math.max(0,Math.abs(d)-.45)*.80));el.style.filter=`blur(${Math.max(0,Math.abs(d)-.2)*1.7}px)`;
    el.style.zIndex=String(Math.round(100-Math.abs(d)*20));el.classList.toggle('secondary',Math.abs(d)>.1);
    const p=PERFUMES[i],fh=h/(p.bottom-p.top);frame.style.height=fh+'px';frame.style.width=fh*p.width/p.height+'px';frame.style.marginTop=((.5-(p.top+p.bottom)/2)*fh)+'px';
   }
   const da=delta(i-position)*.145, dr=Math.min(160,dots.clientWidth*.58),show=Math.abs(delta(i-position))<=6.8;
   dot.hidden=!show;dot.style.transform=`translate(${Math.sin(da)*dr}px,${(1-Math.cos(da))*dr*.38}px)`;
  });
 }
 function renderInfo(i,animate=true){
  const p=PERFUMES[i];selected=i;
  document.body.classList.toggle('reference-colors',p.colorMapping==='reference');
  const panel=$('#details');panel.getAnimations().forEach(a=>a.cancel());
  panel.innerHTML=`<p class="brand">${p.brand}</p><h2>${p.name}</h2><p class="korean">${p.korean}</p><p class="description">${p.description}</p><p class="accord">${p.accord}</p><p class="notes">${p.notes.join(' · ')}</p><p class="edition">${p.edition}</p>`;
  if(animate&&!paused&&!reduced.matches)panel.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.2,.6,.2,1)'});
  ['--base','--a','--b'].forEach((key,j)=>document.documentElement.style.setProperty(key,p.palette[j]));
  const rgb=(p.emptyColor||p.palette[0]).match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16));const dark=(.299*rgb[0]+.587*rgb[1]+.114*rgb[2])<122;document.documentElement.style.setProperty('--ink',dark?'#fffaf1':'#28312e');document.documentElement.style.setProperty('--muted',dark?'#eee7df':'#434d47');document.documentElement.style.setProperty('--text-halo',dark?'#0009':'#fff9');
  document.dispatchEvent(new CustomEvent('perfumechange',{detail:p}));
  document.querySelectorAll('.picker-item').forEach((el,j)=>el.setAttribute('aria-current',String(j===i)));
  $('#season-label').textContent=p.season;$('#style-label').textContent=p.style;$('#counter').textContent=`${String(i+1).padStart(2,'0')} / ${n}`;
  $('meta[name="theme-color"]').content=p.palette[0];
  items.forEach((o,j)=>o.dot.setAttribute('aria-current',String(i===j)));
  document.querySelectorAll('.matrix-cell').forEach((o,j)=>o.setAttribute('aria-current',String(i===j)));
  $('#stage').setAttribute('aria-label',`${p.korean}. ${p.season}, ${p.style}. 좌우로 드래그하거나 방향키로 향수를 변경하세요.`);
 }
 function settle(target){cancelAnimationFrame(animation);const from=position,distance=target-from,start=performance.now(),duration=paused||reduced.matches?0:Math.min(2100,1000+Math.abs(distance)*100);renderInfo(mod(Math.round(target)));
  function step(t){const k=duration?Math.min(1,(t-start)/duration):1;const ease=k<.5?16*k**5:1-((-2*k+2)**5)/2;position=from+distance*ease;paint();if(k<1)animation=requestAnimationFrame(step);else{position=mod(target);paint();animation=0;}}
  animation=requestAnimationFrame(step);
 }
 function go(i){const step=delta(i-position);settle(position+step);}
 function next(direction){settle(Math.round(position)+direction)}
 $('#previous').onclick=()=>next(-1);$('#next').onclick=()=>next(1);
 function pointerDown(e){if(e.button!==0&&e.pointerType==='mouse')return;cancelAnimationFrame(animation);animation=0;drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:position,moved:false,host:e.currentTarget};}
 function pointerMove(e){if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>6&&!drag.moved){drag.moved=true;drag.host.setPointerCapture(e.pointerId);}if(!drag.moved)return;position=drag.start-dx/(innerWidth<=700?220:360);paint();const i=mod(Math.round(position));if(i!==selected)renderInfo(i,false);}
 function pointerEnd(e){if(!drag||e.pointerId!==drag.id)return;const moved=drag.moved;const dx=e.clientX-drag.x;const start=drag.start;try{drag.host.releasePointerCapture(e.pointerId)}catch{}drag=null;if(moved){suppressClickUntil=performance.now()+250;const target=Math.abs(dx)>45?Math.round(start)+Math.sign(-dx)*Math.max(1,Math.round(Math.abs(position-start))):Math.round(position);settle(target);}else if(Math.abs(position-Math.round(position))>.001)settle(Math.round(position));}
 [$('#stage'),$('#wheel')].forEach(el=>{el.addEventListener('pointerdown',pointerDown);el.addEventListener('pointermove',pointerMove);el.addEventListener('pointerup',pointerEnd);el.addEventListener('pointercancel',()=>{if(drag){drag=null;settle(Math.round(position))}});});
 $('#experience').addEventListener('wheel',e=>{if(document.querySelector('dialog[open]')||e.target.closest('#perfume-picker')||e.ctrlKey)return;e.preventDefault();const t=performance.now();if(t-lastWheel<1050)return;wheelSum+=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(wheelSum)>35){next(Math.sign(wheelSum));lastWheel=t;wheelSum=0;}},{passive:false});
 document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||e.target.closest('#perfume-picker'))return;if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();if(e.key==='Home')go(0);else if(e.key==='End')go(n-1);else next(e.key==='ArrowRight'?1:-1);}});
 const matrix=$('#matrix');matrix.append(document.createElement('div'));
 SEASONS.forEach(s=>{const el=document.createElement('div');el.className='matrix-header';el.textContent=s;matrix.append(el)});
 const categoryPeople=['차은우, Andrew Garfield','김우빈, 박보검, Brad Pitt, Harry Styles','조인성, Jude Law','원빈, Christian Bale','현빈, Daniel Craig'];
 STYLES.forEach((s,row)=>{const label=document.createElement('div');label.className='matrix-style'+(row===3?' is-citylike':'');label.innerHTML=`<span class="style-copy"><span class="style-name">${s}${row===3?' (Icy)':''}</span><small class="style-people">(${categoryPeople[row]})</small></span>`;matrix.append(label);PERFUMES.slice(row*4,row*4+4).forEach((p,col)=>{const i=row*4+col,btn=document.createElement('button');btn.className='matrix-cell';btn.setAttribute('aria-label',`${p.korean}, ${p.season}, ${p.style}`);btn.innerHTML=`<span class="cell-name">${p.name}</span>`;btn.title=p.korean;btn.onclick=()=>{go(i)};matrix.append(btn);});});
 function motion(){document.body.classList.toggle('paused',paused);}
 reduced.addEventListener('change',()=>{paused=reduced.matches;motion();cancelAnimationFrame(animation);position=selected;paint();});
 ['#previous','#next'].forEach(id=>$(id).addEventListener('pointerdown',e=>e.stopPropagation()));
 addEventListener('resize',paint);document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('paused',paused||document.hidden)});

 const picker=$('#perfume-picker'), trigger=$('#map-toggle');
 function openPicker(){if(picker.open)return;pickerTab(true);picker.showModal();trigger.setAttribute('aria-expanded','true');$('#category-tab').focus();}
 function closePicker(){picker.close();}
 trigger.onclick=openPicker;
 trigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();openPicker()}});
 $('#picker-close').onclick=closePicker;
 picker.addEventListener('close',()=>{trigger.setAttribute('aria-expanded','false');trigger.focus();});
 picker.addEventListener('click',e=>{if(e.target!==picker)return;const b=picker.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closePicker();});
 PERFUMES.forEach((p,i)=>{const btn=document.createElement('button');btn.className='picker-item';btn.setAttribute('aria-label',p.korean);btn.setAttribute('aria-current',String(i===selected));
 const preview=document.createElement('span');preview.className='picker-thumb';const img=new Image();img.src=p.image;img.alt='';img.style.clipPath=p.clip;const fh=46/(p.bottom-p.top);img.style.height=fh+'px';img.style.top=(23-(p.top+p.bottom)*fh/2)+'px';preview.append(img);
 const text=document.createElement('span');text.innerHTML=`<small>${p.brand}</small><span>${p.name}</span>`;btn.append(preview,text);btn.onclick=()=>{go(i);closePicker()};$('#picker-list').append(btn)});
 $('#picker-categories').append(matrix);
 function pickerTab(categories){$('#picker-list').hidden=categories;$('#picker-categories').hidden=!categories;$('#list-tab').setAttribute('aria-pressed',String(!categories));$('#category-tab').setAttribute('aria-pressed',String(categories));}
 $('#list-tab').onclick=()=>pickerTab(false);$('#category-tab').onclick=()=>pickerTab(true);
 document.querySelectorAll('.matrix-cell').forEach(btn=>btn.addEventListener('click',closePicker));
 pickerTab(true);

 renderInfo(initialIndex,false);motion();paint();
})();
