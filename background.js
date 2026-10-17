/* The shared collection film already contains forward/reverse motion in one loop. */
(()=>{
 'use strict';
 const video=document.querySelector('#background-video'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const channels=['r','g','b'].map(c=>document.querySelector('#tone-'+c));
 const rgb=hex=>hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255);
 let current=[],transition=0;
 function apply(colors){current=colors;channels.forEach((el,c)=>el.setAttribute('tableValues',colors.map(color=>color[c].toFixed(4)).join(' ')));}
 function toneMap(p){
  const colors=p.palette.map(rgb),base=colors[0];
  const dark=(base[0]*.299+base[1]*.587+base[2]*.114)*255<122;
  const empty=rgb(dark?'#090a0c':'#fcfcfa');
  document.documentElement.style.setProperty('--void',dark?'#090a0c':'#fcfcfa');
  // The film's near-black pixels are open space, not a colored reflective surface.
  const stops=[[0,empty],[.025,empty],[.08,base],[.28,base]];
  const accents=colors.slice(1);
  accents.forEach((color,i)=>stops.push([.44+i*.44/Math.max(1,accents.length-1),color]));
  stops.push([1,accents.at(-1).map(v=>v+(1-v)*.2)]);
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
 palette(PERFUMES[0],true);
 document.addEventListener('perfumechange',e=>palette(e.detail));
 function playback(){if(document.hidden||reduced.matches)video.pause();else video.play().catch(()=>{});}
 video.muted=true;
 document.addEventListener('visibilitychange',playback);
 document.addEventListener('pointerdown',playback,{once:true,passive:true});
 reduced.addEventListener('change',playback);
 playback();
})();
