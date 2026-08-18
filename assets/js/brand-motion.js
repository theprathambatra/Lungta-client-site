(() => {
  if (window.__lungtaBrandMotionLoaded) return;
  window.__lungtaBrandMotionLoaded = true;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cache = new Map();

  const style = document.createElement('style');
  style.id = 'lungta-global-brand-motion';
  style.textContent = `
    .lungta-matte-pending{opacity:0!important}
    .lungta-matte-ready{opacity:1;transition:opacity .22s ease}
    .lungta-cape-live{transform-origin:88% 49%;will-change:transform,filter;animation:lungtaCapeFlight 5.4s cubic-bezier(.37,0,.2,1) infinite;filter:url(#lungtaGlobalCapeWave) drop-shadow(0 18px 40px rgba(0,0,0,.20))}
    .lungta-cape-live:hover{animation-duration:3.1s}
    @keyframes lungtaCapeFlight{
      0%,100%{transform:translate3d(0,0,0) skewY(0deg) scaleX(1) scaleY(1)}
      16%{transform:translate3d(-5px,-5px,0) skewY(-.35deg) scaleX(1.009) scaleY(.997)}
      34%{transform:translate3d(1px,2px,0) skewY(.18deg) scaleX(.998) scaleY(1.003)}
      55%{transform:translate3d(-4px,-8px,0) skewY(-.28deg) scaleX(1.012) scaleY(.995)}
      76%{transform:translate3d(2px,-2px,0) skewY(.12deg) scaleX(1.003) scaleY(1.001)}
    }
    .lungta-horse-stage{position:relative;width:100%;height:100%;display:grid;place-items:center;overflow:visible;isolation:isolate}
    .lungta-horse-stage>img{grid-area:1/1;width:100%;height:100%;object-fit:contain!important}
    .lungta-horse-live{position:relative;z-index:3;transform-origin:61% 60%;will-change:transform,filter;animation:lungtaHorseStride .88s linear infinite;filter:drop-shadow(0 0 10px rgba(255,255,255,.05))}
    .lungta-horse-echo{position:relative;z-index:1;pointer-events:none;opacity:.05;filter:blur(4px);animation:lungtaHorseTrail 1.28s cubic-bezier(.2,.7,.22,1) infinite}
    .lungta-horse-echo.two{opacity:.027;filter:blur(8px);animation-delay:-.58s}
    .lungta-horse-stage:hover .lungta-horse-live{animation-duration:.60s;filter:drop-shadow(0 0 17px rgba(255,255,255,.10))}
    .lungta-horse-stage:hover .lungta-horse-echo{animation-duration:.84s}
    @keyframes lungtaHorseStride{
      0%,100%{transform:translate3d(-5px,2px,0) scaleX(.996) scaleY(1.004)}
      8%{transform:translate3d(-2px,3px,0) scaleX(.992) scaleY(1.007)}
      20%{transform:translate3d(5px,-3px,0) scaleX(1.005) scaleY(.997)}
      34%{transform:translate3d(12px,-9px,0) scaleX(1.015) scaleY(.990)}
      47%{transform:translate3d(16px,-6px,0) scaleX(1.011) scaleY(.993)}
      60%{transform:translate3d(10px,0,0) scaleX(1) scaleY(1.002)}
      69%{transform:translate3d(6px,4px,0) scaleX(.993) scaleY(1.008)}
      80%{transform:translate3d(1px,-2px,0) scaleX(1.004) scaleY(.998)}
      91%{transform:translate3d(-3px,-1px,0) scaleX(1) scaleY(1)}
    }
    @keyframes lungtaHorseTrail{
      0%{opacity:0;transform:translate3d(2%,1px,0) scaleX(1)}
      18%{opacity:.05}
      55%{opacity:.035}
      100%{opacity:0;transform:translate3d(-11%,3px,0) scaleX(.975)}
    }
    @media(prefers-reduced-motion:reduce){.lungta-cape-live,.lungta-horse-live,.lungta-horse-echo{animation:none!important;filter:none!important}}
  `;
  document.head.appendChild(style);

  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width','0');
  svg.setAttribute('height','0');
  svg.style.position='absolute';
  svg.style.pointerEvents='none';
  svg.innerHTML = `<defs><filter id="lungtaGlobalCapeWave" x="-22%" y="-32%" width="144%" height="164%"><feTurbulence id="lungtaCapeNoise" type="fractalNoise" baseFrequency="0.004 0.012" numOctaves="2" seed="11" result="noise"/><feDisplacementMap id="lungtaCapeDisplace" in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter></defs>`;
  document.body.appendChild(svg);

  const noise=document.getElementById('lungtaCapeNoise');
  const displace=document.getElementById('lungtaCapeDisplace');
  let capeHover=0,phase=0,last=performance.now();

  function keyBlackMatte(img){
    const source=img.getAttribute('src')||'';
    if(!source||source.startsWith('data:')||img.dataset.lungtaKeyed==='1') return Promise.resolve();
    img.classList.add('lungta-matte-pending');
    if(cache.has(source)){
      img.src=cache.get(source);
      img.dataset.lungtaKeyed='1';
      img.classList.remove('lungta-matte-pending');
      img.classList.add('lungta-matte-ready');
      return Promise.resolve();
    }
    return new Promise(resolve=>{
      const run=()=>{
        try{
          const c=document.createElement('canvas');
          c.width=img.naturalWidth;
          c.height=img.naturalHeight;
          const ctx=c.getContext('2d',{willReadFrequently:true});
          ctx.drawImage(img,0,0);
          const frame=ctx.getImageData(0,0,c.width,c.height),d=frame.data;
          for(let i=0;i<d.length;i+=4){
            const r=d[i],g=d[i+1],b=d[i+2],m=Math.max(r,g,b);
            if(m<=5){d[i+3]=0;continue;}
            if(m<15){d[i+3]=Math.round((m-5)/10*255);continue;}
            d[i+3]=255;
          }
          ctx.putImageData(frame,0,0);
          const clean=c.toDataURL('image/webp',.98);
          cache.set(source,clean);
          img.src=clean;
          img.dataset.lungtaKeyed='1';
        }catch(err){
          console.warn('LUNGTA matte cleanup fallback',err);
        }
        img.classList.remove('lungta-matte-pending');
        img.classList.add('lungta-matte-ready');
        resolve();
      };
      if(img.complete&&img.naturalWidth) run(); else img.addEventListener('load',run,{once:true});
    });
  }

  const capes=[...document.querySelectorAll('img[src*="wind-flow.webp"]')];
  capes.forEach(img=>{
    keyBlackMatte(img).then(()=>{
      if(!img.closest('[data-wind-flow]')){
        img.classList.add('lungta-cape-live');
        img.addEventListener('pointerenter',()=>capeHover++);
        img.addEventListener('pointerleave',()=>capeHover=Math.max(0,capeHover-1));
      }
    });
  });

  const horses=[...document.querySelectorAll('img[src*="wind-horse-mark.webp"]')];
  horses.forEach(img=>{
    if(img.closest('[data-horse-run]')) return;
    keyBlackMatte(img).then(()=>{
      if(img.closest('.lungta-horse-stage')) return;
      const stage=document.createElement('div');
      stage.className='lungta-horse-stage';
      img.parentNode.insertBefore(stage,img);
      stage.appendChild(img);
      img.classList.add('lungta-horse-live');
      const ghost1=img.cloneNode(false),ghost2=img.cloneNode(false);
      ghost1.removeAttribute('alt');ghost2.removeAttribute('alt');
      ghost1.setAttribute('aria-hidden','true');ghost2.setAttribute('aria-hidden','true');
      ghost1.className='lungta-horse-echo one';ghost2.className='lungta-horse-echo two';
      stage.insertBefore(ghost2,img);stage.insertBefore(ghost1,img);
    });
  });

  if(!reduced&&capes.length&&noise&&displace){
    const tick=now=>{
      const dt=Math.min(42,now-last);last=now;
      phase+=dt*(capeHover?.00125:.00042);
      const f1=.0038+Math.sin(phase*.66)*.0012;
      const f2=.0114+Math.cos(phase*.49)*.0021;
      noise.setAttribute('baseFrequency',`${f1.toFixed(5)} ${f2.toFixed(5)}`);
      displace.setAttribute('scale',(capeHover?8.4+Math.sin(phase)*1.5:4.8+Math.sin(phase*.78)*.9).toFixed(2));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();
