/* Persistent screensaver paths; palette changes never restart their clocks. */
(()=>{'use strict';const host=document.querySelector('#atmosphere');
const specs=[{group:0,size:.52,speed:1.25,phase:.3,opacity:.34,blur:17},{group:0,size:.43,speed:.96,phase:3.7,opacity:.29,blur:13},{group:0,size:.34,speed:1.08,phase:5.4,opacity:.25,blur:10},{group:1,size:.31,speed:1.42,phase:1.6,opacity:.38,blur:9},{group:1,size:.24,speed:1.12,phase:4.8,opacity:.32,blur:12},{group:1,size:.19,speed:1.30,phase:6.1,opacity:.27,blur:8},{group:2,size:.15,speed:1.58,phase:2.8,opacity:.42,blur:6},{group:2,size:.11,speed:1.38,phase:5.9,opacity:.34,blur:5}];
let time=0,last=0,lastDraw=0,width=innerWidth,height=innerHeight;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const bubbles=specs.map((s,i)=>{const el=document.createElement('div');el.className='travelling-bubble';el.dataset.colorGroup=String(s.group+1);el.style.cssText=`--alpha:${s.opacity};--blur:${s.blur}px;--shape:${43+i*2}%`;host.append(el);return {...s,el}});
function resize(){width=host.clientWidth;height=host.clientHeight;bubbles.forEach(b=>{b.pixels=Math.max(90,Math.min(width,height)*b.size*(width<701?1.6:1.5));b.el.style.width=b.el.style.height=b.pixels+'px'});draw()}
function palette(p){bubbles.forEach(b=>{b.el.style.backgroundColor=p.palette[b.group+1]});}palette(PERFUMES[0]);document.addEventListener('perfumechange',e=>palette(e.detail));
function draw(){bubbles.forEach((b,i)=>{const t=time*b.speed,ph=b.phase;
// Incommensurate periods create a long, non-repeating-looking course across both axes.
const x=(.5+.61*Math.sin(t*.022+ph)+.045*Math.sin(t*.069+ph*2))*(width+b.pixels*.2)-b.pixels*.5;
const y=(.5+.61*Math.sin(t*.0183+ph*1.73)+.055*Math.cos(t*.051+ph))*(height+b.pixels*.15)-b.pixels*.5;
b.el.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${(Math.sin(t*.03+ph)*18).toFixed(2)}deg) scale(${(1+Math.sin(t*.047+ph)*.04).toFixed(3)},${(1-Math.sin(t*.047+ph)*.04).toFixed(3)})`;});}
function frame(now){requestAnimationFrame(frame);if(!last)last=now;const dt=Math.min((now-last)/1000,.08);last=now;if(document.hidden||reduced.matches||document.body.classList.contains('paused'))return;time+=dt;if(now-lastDraw<32)return;lastDraw=now;draw();}
resize();addEventListener('resize',resize);requestAnimationFrame(frame);
})();
