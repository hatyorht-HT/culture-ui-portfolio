(()=>{'use strict';
 const records=window.EXPANDED_IMAGES=structuredClone(window.ARCH_IMAGES||{});
 Object.assign(records['jilue-2'],{title:'己略黄公祠 · 院内与柱列',observation:'看天空、檐下与柱列之间的关系；空间名称和精确位置仍需建筑资料核实。'});
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 const options={outside:{key:'jilue-facade',title:'门前的边界',description:'门额、门洞和门前的人，构成外部与内部的交界。',label:'门面来源摄影'},gate:{key:'jilue-facade',title:'门洞与门额',description:'这是同一门面照片的局部。先辨认门洞，不从一张照片推断完整通行路径。',label:'同图局部 · 非独立拍摄',crop:true},court:{key:'jilue-2',title:'院内与柱列',description:'天空、檐下与柱列形成内外层次。先辨认边界，再看人在其中的位置。',label:'院内来源摄影'},hall:{pending:true,title:'厅堂记录待补',description:'缺独立空间影像、名称依据和所在位置。当前不以院内照片代替厅堂记录。'},object:{key:'jilue-4',title:'梁柱之间的构件',description:'凤凰木雕与梁柱相邻。照片显示可见关系，精确位置和构件尺寸仍需可靠资料。',label:'构件来源摄影'}};
 const unit=document.querySelector('#space'),media=unit.querySelector('.spatial-media'),figure=unit.querySelector('.spatial-photo'),pending=unit.querySelector('.space-pending'),buttons=[...unit.querySelectorAll('[data-space]')],keys=Object.keys(options),copy=unit.querySelector('.space-copy');
 let selected='court',serial=0;
 document.body.classList.add('final-ready','signature-ready');
 function cancelSpatial(){media.querySelectorAll('.space-ghost').forEach(e=>e.remove());for(const e of [figure.querySelector('.photo-link'),pending,copy])e.getAnimations().forEach(a=>a.cancel());}
 function caption(r,crop){const c=figure.querySelector('figcaption'),title=document.createElement('span'),credit=document.createElement('span'),date=document.createElement('time'),source=document.createElement('a');title.textContent=r.title+(crop?' · 同图局部':'');credit.append(document.createTextNode(r.author+' · '));date.dateTime=r.date;date.textContent=r.date;source.textContent='来源 ↗';source.href=r.source;source.target='_blank';source.rel='noopener';credit.append(date,document.createTextNode(' '),source);c.replaceChildren(title,credit);}
 async function select(key,animate=true){if(key===selected)return;selected=key;const o=options[key],current=++serial;
  buttons.forEach((b,i)=>{b.setAttribute('aria-pressed',String(b.dataset.space===key));b.dataset.relation=i<keys.indexOf(key)?'previous':'future';});
  let preload;if(o.key){preload=new Image();preload.src='assets/temporary-reference/'+records[o.key].file;try{await preload.decode();}catch{if(current===serial)unit.querySelector('[data-space-credit]').textContent='照片未加载，可从来源查看。';return;}}if(current!==serial)return;
  cancelSpatial();const old=figure.hidden?pending:figure.querySelector('.photo-link');let ghost;
  if(animate&&!reduce.matches){ghost=old.cloneNode(true);ghost.classList.add('space-ghost');ghost.removeAttribute('hidden');ghost.setAttribute('aria-hidden','true');ghost.removeAttribute('href');ghost.removeAttribute('data-viewer');ghost.querySelectorAll('a,button').forEach(e=>e.setAttribute('tabindex','-1'));ghost.style.height=old.offsetHeight+'px';if(figure.classList.contains('is-crop'))ghost.classList.add('ghost-crop');media.append(ghost);}
  figure.hidden=!!o.pending;pending.hidden=!o.pending;
  unit.querySelector('.space-position').textContent=String(keys.indexOf(key)+1).padStart(2,'0')+'　'+buttons[keys.indexOf(key)].querySelector('.magnetic-label').textContent;unit.querySelector('[data-space-title]').textContent=o.title;unit.querySelector('[data-space-description]').textContent=o.description;
  if(o.pending){unit.querySelector('[data-space-credit]').textContent='待补真实资料 · 未展示替代照片';}
  else{const r=records[o.key],a=figure.querySelector('.photo-link'),img=a.querySelector('img');a.dataset.viewer=o.key;a.href=preload.src;a.setAttribute('aria-label','查看'+r.title+'完整来源照片');img.src=preload.src;img.alt=r.title+'。'+o.description;img.width=r.size[0];img.height=r.size[1];figure.classList.toggle('is-crop',!!o.crop);caption(r,o.crop);unit.querySelector('[data-space-credit]').textContent=r.author+' · '+r.date+' · '+o.label;}
  if(ghost){const timing={duration:520,easing:'cubic-bezier(.22,.65,.25,1)'};ghost.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.985)'}],timing).finished.catch(()=>{}).then(()=>ghost.remove());const next=o.pending?pending:figure.querySelector('.photo-link');next.animate([{opacity:0,transform:'scale(1.015)'},{opacity:1,transform:'scale(1)'}],timing);copy.animate([{opacity:.5,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],timing);}
 }
 buttons.forEach(b=>{b.addEventListener('click',()=>{manualSelect(b.dataset.space);});b.addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let i=buttons.indexOf(b);i=e.key==='Home'?0:e.key==='End'?4:(i+(e.key==='ArrowDown'||e.key==='ArrowRight'?1:-1)+5)%5;buttons[i].focus({preventScroll:true});buttons[i].click();});});
 new IntersectionObserver((entries,observer)=>{if(entries.some(e=>e.isIntersecting)){for(const key of ['jilue-facade','jilue-2','jilue-4']){const img=new Image();img.src='assets/temporary-reference/'+records[key].file;}observer.disconnect();}},{rootMargin:'600px'}).observe(unit);


 // Only the image/text child moves: link and selector hit areas remain fixed.
 const resets=[];document.querySelectorAll('[data-proximity]').forEach(link=>{const img=link.querySelector('.crop-inner')||link.querySelector('img'),strength=Number(link.dataset.proximity);if(!img||!strength)return;let rect,frame=0,point;
  function reset(){cancelAnimationFrame(frame);frame=0;point=null;img.style.removeProperty('--px');img.style.removeProperty('--py');img.style.removeProperty('--ps');}
  link.addEventListener('pointerenter',()=>{rect=link.getBoundingClientRect();});link.addEventListener('pointermove',e=>{if(reduce.matches||!fine.matches)return;rect??=link.getBoundingClientRect();point={x:e.clientX,y:e.clientY};if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(!point)return;const x=Math.max(-1,Math.min(1,(point.x-rect.left)/rect.width*2-1)),y=Math.max(-1,Math.min(1,(point.y-rect.top)/rect.height*2-1));img.style.setProperty('--px',(x*strength)+'px');img.style.setProperty('--py',(y*strength)+'px');img.style.setProperty('--ps',String(1+strength*.003));});});link.addEventListener('pointerleave',reset);link.addEventListener('blur',reset);resets.push(reset);
 });
 document.querySelectorAll('[data-magnetic]').forEach(link=>{const child=link.querySelector('.magnetic-label');if(!child)return;let rect,frame=0,point;const amount=Number(link.dataset.magnetic);
  const reset=()=>{cancelAnimationFrame(frame);frame=0;point=null;child.style.transform='';};link.addEventListener('pointerenter',()=>rect=link.getBoundingClientRect());link.addEventListener('pointermove',e=>{if(reduce.matches||!fine.matches)return;rect??=link.getBoundingClientRect();point={x:e.clientX,y:e.clientY};if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(!point)return;const x=Math.max(-amount,Math.min(amount,(point.x-rect.left-rect.width/2)*.035)),y=Math.max(-amount,Math.min(amount,(point.y-rect.top-rect.height/2)*.06));child.style.transform=`translate(${x}px,${y}px)`;});});link.addEventListener('pointerleave',reset);link.addEventListener('blur',reset);resets.push(reset);});
 const hero=document.querySelector('.b-title'),object=document.querySelector('.b-object .photo-link'),context=document.querySelector('.b-context-small');
 function enter(){if(reduce.matches)return;hero.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,easing:'ease-out'});object.animate([{transform:'scale(1.012)'},{transform:'scale(1)'}],{duration:750,easing:'ease-out'});context.animate([{opacity:0},{opacity:1}],{duration:650,delay:150,easing:'ease-out'});}
 document.fonts.ready.then(enter);
 reduce.addEventListener('change',()=>{resets.forEach(f=>f());if(reduce.matches){cancelSpatial();document.getAnimations().forEach(a=>a.cancel());}});fine.addEventListener('change',()=>resets.forEach(f=>f()));
 // 03 is the only scroll-driven scene. A short pin carries a real photographic aperture.
 const aperture=unit.querySelector('.threshold-window'),drawing=unit.querySelector('.threshold-drawing'),resume=unit.querySelector('.threshold-resume'),status=unit.querySelector('.threshold-status'),currentLabel=unit.querySelector('.threshold-current');
 const phaseLabels={outside:'门前',gate:'门 · 边界',court:'天井与院内',hall:'厅堂 · 资料待补',object:'构件'};
 let following=!reduce.matches,scrollJob=0,opening=1;
 function openingAt(p,still=false){
  opening=p;const inset=still?8:(innerWidth<761?9.1:14)*(1-Math.min(1,p/.8));aperture.style.setProperty('--opening-inset',inset+'%');media.style.setProperty('--opening-inset',inset+'%');aperture.style.setProperty('--threshold-scale',String(1+(innerWidth<761?.02275:.035)*(1-p)));
  const x=inset*10+8;drawing.querySelector('path').setAttribute('d',`M ${x} 980 V 20 H ${1000-x} V 980`);drawing.style.opacity=String(.65+.2*p);unit.dataset.progress=p.toFixed(4);
 }
 function coverControls(){unit.querySelectorAll('.threshold-covered').forEach(e=>e.classList.remove('threshold-covered'));}
 function showCurrent(key){status.textContent=phaseLabels[key];currentLabel.textContent=String(keys.indexOf(key)+1).padStart(2,'0')+' · '+phaseLabels[key];buttons.forEach((b,i)=>b.dataset.emphasis=i===keys.indexOf(key)?'current':Math.abs(i-keys.indexOf(key))===1?'adjacent':'other');}
 function geometry(){
  const photo=figure.hidden?pending:figure.querySelector('.photo-link'),height=photo.offsetHeight;drawing.style.height=height+'px';aperture.style.setProperty('--picture-height',height+'px');
  const pair=unit.querySelector('.spatial-pair'),left=unit.querySelector('.space-reading');pair.style.setProperty('--threshold-height',Math.max(left.offsetHeight,unit.querySelector('.spatial-media').offsetHeight)+Math.min(innerHeight*.28,250)+'px');coverControls();
 }
 function updateThreshold(){
  scrollJob=0;if(!following||reduce.matches||document.querySelector('dialog').open)return;
  const r=unit.getBoundingClientRect(),p=Math.max(0,Math.min(1,(innerHeight*.83-r.top)/(innerHeight*1.35)));openingAt(p);coverControls();
  const key=p<.25?'outside':p<.5?'gate':p<.75?'court':p<.80?'hall':'object';if(innerWidth>=761)showCurrent(key);else showCurrent(selected);unit.dataset.mode='scroll';
  if(innerWidth>=761&&key!==selected)select(key,r.bottom>0&&r.top<innerHeight).then(geometry);
 }
 function scheduleThreshold(){if(!scrollJob)scrollJob=requestAnimationFrame(updateThreshold);}
 function manualSelect(key){const current=buttons[keys.indexOf(key)],row=unit.querySelector('.space-selectors');if(innerWidth<761){const b=current.getBoundingClientRect(),r=row.getBoundingClientRect();if(b.left<r.left)row.scrollLeft+=b.left-r.left-2;else if(b.right>r.right)row.scrollLeft+=b.right-r.right+2;}following=false;unit.dataset.mode=reduce.matches?'static':'manual';resume.textContent='恢复随滚动';showCurrent(key);openingAt(1,true);coverControls();select(key).then(()=>{geometry();unit.querySelector('[data-selection-announcement]').textContent=options[key].title+'。'+options[key].description;});}
 resume.hidden=reduce.matches;resume.textContent='随滚动进入';resume.addEventListener('click',()=>{following=true;resume.textContent='随滚动进入';scheduleThreshold();});
 window.addEventListener('scroll',scheduleThreshold,{passive:true});window.addEventListener('resize',()=>{geometry();scheduleThreshold();},{passive:true});
 new ResizeObserver(geometry).observe(aperture);document.fonts.ready.then(()=>{geometry();if(following)scheduleThreshold();else{openingAt(1,true);unit.dataset.mode='static';showCurrent(selected);}});
 reduce.addEventListener('change',()=>{following=false;resume.hidden=reduce.matches;resume.textContent='恢复随滚动';unit.dataset.mode=reduce.matches?'static':'manual';openingAt(1,true);showCurrent(selected);geometry();});

 // Photographic coordinates project into each responsive crop; labels remain small and calm.
 function projectMarks(link){
  const img=link.querySelector('img'),layer=link.querySelector('.observation-layer');if(!layer||!img.naturalWidth)return;const w=link.clientWidth,h=link.clientHeight;if(!(w&&h))return;
  const fit=getComputedStyle(img).objectFit,scale=fit==='contain'?Math.min(w/img.naturalWidth,h/img.naturalHeight):Math.max(w/img.naturalWidth,h/img.naturalHeight);
  const pos=getComputedStyle(img).objectPosition.split(' ').map(v=>parseFloat(v)/100),ox=(img.naturalWidth*scale-w)*(pos[0]||.5),oy=(img.naturalHeight*scale-h)*(pos[1]||.5);
  const svg=layer.querySelector('svg');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);const paths=[...svg.querySelectorAll('path')];
  layer.querySelectorAll('.observation-label').forEach((el,i)=>{const sx=Number(el.dataset.sourceX)*img.naturalWidth*scale-ox,sy=Number(el.dataset.sourceY)*img.naturalHeight*scale-oy;
   const x=Math.max(8,Math.min(w-el.offsetWidth-8,w*Number(el.dataset.labelX))),y=Math.max(8,Math.min(h-el.offsetHeight-8,h*Number(el.dataset.labelY)));el.style.left=x+'px';el.style.top=y+'px';el.dataset.projectedX=String(sx);el.dataset.projectedY=String(sy);
   el.hidden=sx<0||sx>w||sy<0||sy>h;paths[i].style.display=el.hidden?'none':'';paths[i].setAttribute('d',`M ${sx} ${sy} L ${x-12} ${y+8} H ${x-3}`);
  });
  if(link.querySelector('.hero-focus')){link.style.setProperty('--focus-x',((.46*img.naturalWidth*scale-ox)/w*100)+'%');link.style.setProperty('--focus-y',((.65*img.naturalHeight*scale-oy)/h*100)+'%');}
 }
 document.querySelectorAll('a:has(>.observation-layer)').forEach(link=>{new ResizeObserver(()=>projectMarks(link)).observe(link);const img=link.querySelector('img');img.addEventListener('load',()=>projectMarks(link));document.fonts.ready.then(()=>projectMarks(link));
  let observationFrame=0,observationPoint=null;link.addEventListener('pointermove',event=>{if(!fine.matches||reduce.matches||!link.querySelector('.detail-observation'))return;observationPoint={clientX:event.clientX,clientY:event.clientY};if(observationFrame)return;observationFrame=requestAnimationFrame(()=>{observationFrame=0;const e=observationPoint;if(!e)return;const r=link.getBoundingClientRect(),labels=[...link.querySelectorAll('.observation-label')];let index=0,best=Infinity;labels.forEach((el,i)=>{const d=Math.hypot(e.clientX-r.x-Number(el.dataset.projectedX),e.clientY-r.y-Number(el.dataset.projectedY));if(d<best){best=d;index=i;}});link.classList.add('has-observation');labels.forEach((el,i)=>{el.classList.toggle('is-near',i===index);link.querySelectorAll('.observation-lines path')[i].classList.toggle('is-near',i===index);});const el=labels[index];window.ARCH_OBSERVATION_FOCUS={x:Number(el.dataset.sourceX),y:Number(el.dataset.sourceY),index};});});
  link.addEventListener('pointerleave',()=>{cancelAnimationFrame(observationFrame);observationFrame=0;observationPoint=null;link.classList.remove('has-observation');link.querySelectorAll('.observation-label,.observation-lines path').forEach(el=>el.classList.remove('is-near'));});
 });

 const mobile=matchMedia('(max-width:760px)'),toggle=document.querySelector('.nav-toggle'),nav=document.querySelector('#chapter-navigation');
 function closeMenu(){nav.hidden=mobile.matches;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','展开章节目录');}
 function responsive(){toggle.hidden=!mobile.matches;closeMenu();document.querySelectorAll('.meta-fold').forEach(d=>d.open=!mobile.matches);document.querySelector('.archive-mobile-more').open=!mobile.matches;document.querySelectorAll('#materials details').forEach(d=>d.open=false);}
 toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'收起章节目录':'展开章节目录');nav.hidden=!open;});
 nav.addEventListener('click',e=>{if(mobile.matches&&e.target.closest('a'))closeMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mobile.matches&&!nav.hidden){closeMenu();toggle.focus();}});mobile.addEventListener('change',responsive);responsive();
})();
