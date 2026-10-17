/* The shared collection film already contains forward/reverse motion in one loop. */
(()=>{
 'use strict';
 const video=document.querySelector('#background-video'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const renderer=window.createFragranceRenderer(video,reduced);
 const rgb=hex=>hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255);
 let current=[],transition=0;
 function apply(colors){current=colors;document.documentElement.style.setProperty('--void',`rgb(${colors[0].map(v=>Math.round(v*255)).join(' ')})`);renderer.setColors(colors);}
 function toneMap(p){
  const colors=p.palette.map(rgb),base=colors[0];
  const dark=(base[0]*.299+base[1]*.587+base[2]*.114)*255<122;
  const empty=rgb(p.emptyColor||(dark?'#090a0c':'#fcfcfa'));
  // Reference screenshots used four fragrance colors plus the original warm specular light.
  if(p.colorMapping==='legacy'||p.colorMapping==='reference'){
   const anchors=p.colorMapping==='reference'?[...colors,rgb('#fff8e7')]:colors;
   return Array.from({length:65},(_,i)=>{
    const x=i/64*(anchors.length-1),lo=Math.floor(x),hi=Math.min(anchors.length-1,lo+1),u=x-lo;
    return anchors[lo].map((v,c)=>v+(anchors[hi][c]-v)*u);
   });
  }
  // Near-black source pixels use each fragrance's separately chosen open-space color.
  const baseStart=['oud-satin-mood','herod'].includes(p.id)?.08:.16;
  const stops=[[0,empty],[.025,empty],[baseStart,base],[.28,base]];
  const accents=colors.slice(1);
  accents.forEach((color,i)=>stops.push([.44+i*.44/Math.max(1,accents.length-1),color]));
  stops.push([1,accents.at(-1).map(v=>v+(1-v)*.2)]);
  if(p.orangeBoost)stops.splice(0,stops.length,[0,empty],[.025,empty],[.13,base],[.20,base],[.36,accents[0]],[.50,accents[1]],[.86,accents[1]],[1,accents[1].map(v=>v+(1-v)*.2)]);
  // A fixed-size table also allows smooth transitions between 3-, 4-, and 5-color palettes.
  return Array.from({length:65},(_,i)=>{
   const t=i/64,hi=stops.findIndex(s=>s[0]>=t);
   if(hi<=0)return [...stops[0][1]];
   const [a,x]=stops[hi-1],[b,y]=stops[hi],u=(t-a)/(b-a);
   return x.map((v,c)=>v+(y[c]-v)*u);
  });
 }
 function palette(p,instant=false){
  const target=toneMap(p);
  cancelAnimationFrame(transition);
  if(instant||reduced.matches){apply(target);return;}
  const from=current.map(c=>[...c]),start=performance.now();
  function tick(now){const t=Math.min(1,(now-start)/1400),u=t*t*(3-2*t);apply(target.map((color,i)=>color.map((v,c)=>from[i][c]+(v-from[i][c])*u)));if(t<1)transition=requestAnimationFrame(tick);}
  transition=requestAnimationFrame(tick);
 }
 palette(PERFUMES.find(p=>p.id==='724')||PERFUMES[0],true);
 document.addEventListener('perfumechange',e=>palette(e.detail));
 function playback(){if(document.hidden||reduced.matches)video.pause();else video.play().catch(()=>{});}
 video.muted=true;
 document.addEventListener('visibilitychange',playback);
 document.addEventListener('pointerdown',playback,{once:true,passive:true});
 reduced.addEventListener('change',playback);
 playback();
})();
