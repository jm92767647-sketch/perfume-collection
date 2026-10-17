/* Render the palette into the image itself: mobile video compositors need no SVG filters. */
window.createFragranceRenderer=function(video,reduced){
 'use strict';
 const host=video.parentElement,poster=new Image();
 let canvas=document.createElement('canvas'),backend=null,colors=null,dirty=true,lastTime=-1,lastDraw=0;
 canvas.id='background-canvas';canvas.setAttribute('aria-hidden','true');host.insertBefore(canvas,video.nextSibling);
 poster.crossOrigin='anonymous';poster.src=video.poster;poster.onload=()=>{dirty=true;};
 function cover(source,w,h){
  const sw=source.videoWidth||source.naturalWidth,sh=source.videoHeight||source.naturalHeight;
  if(!sw||!sh)return null;
  const scale=Math.max(w/sw,h/sh),dw=sw*scale,dh=sh*scale;
  return{sw,sh,dx:(w-dw)*.7,dy:(h-dh)*.5,dw,dh,sx:Math.min(1,w/dw),sy:Math.min(1,h/dh)};
 }
 function makeGL(){
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,premultipliedAlpha:false});
  if(!gl)throw Error('WebGL unavailable');
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Shader compilation failed');return s;}
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}'));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 uv;uniform sampler2D frame;uniform sampler2D palette;uniform vec2 crop;uniform vec2 offset;void main(){vec3 c=texture2D(frame,offset+uv*crop).rgb;float l=clamp(dot(c,vec3(.213,.715,.072)),0.,1.);gl_FragColor=vec4(texture2D(palette,vec2((l*64.+.5)/65.,.5)).rgb,1.);}'));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader link failed');gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  function texture(unit){gl.activeTexture(gl.TEXTURE0+unit);const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
  const frame=texture(0),palette=texture(1),crop=gl.getUniformLocation(program,'crop'),offset=gl.getUniformLocation(program,'offset');
  gl.uniform1i(gl.getUniformLocation(program,'frame'),0);gl.uniform1i(gl.getUniformLocation(program,'palette'),1);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallbackCPU();});
  return{kind:'webgl',setColors(values){const bytes=new Uint8Array(65*4);values.forEach((c,i)=>{for(let k=0;k<3;k++)bytes[i*4+k]=Math.round(c[k]*255);bytes[i*4+3]=255;});gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,palette);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,65,1,0,gl.RGBA,gl.UNSIGNED_BYTE,bytes);},
   draw(source){const g=cover(source,canvas.width,canvas.height);if(!g)return false;gl.viewport(0,0,canvas.width,canvas.height);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,frame);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.uniform2f(crop,g.sx,g.sy);gl.uniform2f(offset,(1-g.sx)*.7,(1-g.sy)*.5);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return true;}};
 }
 function makeCPU(){
  const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true});if(!ctx)throw Error('Canvas unavailable');
  let lookup=new Uint8ClampedArray(4096*3);
  return{kind:'canvas2d',setColors(values){for(let i=0;i<4096;i++){const x=i/4095*64,lo=Math.floor(x),hi=Math.min(64,lo+1),t=x-lo;for(let c=0;c<3;c++)lookup[i*3+c]=(values[lo][c]+(values[hi][c]-values[lo][c])*t)*255;}},
   draw(source){const g=cover(source,canvas.width,canvas.height);if(!g)return false;ctx.drawImage(source,g.dx,g.dy,g.dw,g.dh);const image=ctx.getImageData(0,0,canvas.width,canvas.height),p=image.data;for(let i=0;i<p.length;i+=4){const j=Math.min(4095,Math.round((p[i]*.213+p[i+1]*.715+p[i+2]*.072)/255*4095))*3;p[i]=lookup[j];p[i+1]=lookup[j+1];p[i+2]=lookup[j+2];p[i+3]=255;}ctx.putImageData(image,0,0);return true;}};
 }
 function replaceCanvas(){const next=document.createElement('canvas');next.id='background-canvas';next.setAttribute('aria-hidden','true');canvas.replaceWith(next);canvas=next;}
 function fallbackCPU(){
  replaceCanvas();
  try{backend=makeCPU();canvas.dataset.renderer=backend.kind;resize();if(colors)backend.setColors(colors);dirty=true;}
  catch{backend=null;canvas.dataset.renderer='palette-fallback';}
 }
 function resize(){
  const w=host.clientWidth,h=host.clientHeight;
  const scale=backend?.kind==='webgl'?Math.min(devicePixelRatio||1,1.5,Math.sqrt(2000000/(w*h))):Math.min(1,Math.sqrt(350000/(w*h)));
  canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));dirty=true;
 }
 try{if(new URLSearchParams(location.search).get('renderer')==='canvas2d')throw Error('CPU verification');backend=makeGL();canvas.dataset.renderer=backend.kind;resize();}catch{fallbackCPU();}
 function paint(now){
  requestAnimationFrame(paint);if(document.hidden||!colors)return;
  const interval=backend?.kind==='webgl'?1000/24:1000/12;if(now-lastDraw<interval)return;
  const live=video.readyState>=2&&video.currentTime>0&&!reduced.matches;
  const source=live?video:poster,time=live?video.currentTime:-1;
  if(!dirty&&time===lastTime)return;
  if(!live&&(!poster.complete||!poster.naturalWidth))return;
  if(!backend)return;
  try{if(backend.draw(source)){lastDraw=now;lastTime=time;dirty=false;canvas.dataset.source=live?'video':'poster';canvas.dataset.colored='true';}}
  catch{if(backend.kind==='webgl')fallbackCPU();else{backend=null;canvas.dataset.renderer='palette-fallback';canvas.style.display='none';}}
 }
 addEventListener('resize',resize);video.addEventListener('loadeddata',()=>{dirty=true;});reduced.addEventListener('change',()=>{dirty=true;});requestAnimationFrame(paint);
 return{setColors(values){colors=values;dirty=true;backend?.setColors(values);const picks=[values[0],values[24],values[46]].map(c=>'rgb('+c.map(v=>Math.round(v*255)).join(' ')+')');host.style.background=`radial-gradient(ellipse at 76% 44%,${picks[2]},transparent 58%),radial-gradient(ellipse at 18% 75%,${picks[1]},transparent 60%),${picks[0]}`;canvas.dataset.palette=values[0].map(v=>Math.round(v*255)).join(',');}};
};
