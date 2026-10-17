/* The shared collection film already contains forward/reverse motion in one loop. */
(()=>{
 'use strict';
 const video=document.querySelector('#background-video'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const channels=['r','g','b'].map(c=>document.querySelector('#tone-'+c));
 const rgb=hex=>hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255);
 let current=[],transition=0;
 function apply(colors){current=colors;channels.forEach((el,c)=>el.setAttribute('tableValues',colors.map(color=>color[c].toFixed(4)).join(' ')));}
 function palette(p,instant=false){
  // Three color anchors: liquid/base, first reflection, second reflection.
  const target=p.palette.map(rgb);
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
