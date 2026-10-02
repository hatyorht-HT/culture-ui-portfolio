(() => {
 const dialog=document.querySelector('.document-viewer'),image=dialog.querySelector('.viewer-image'),scroll=dialog.querySelector('.viewer-scroll'),caption=dialog.querySelector('.viewer-caption'),level=dialog.querySelector('.viewer-level'),source=dialog.querySelector('.viewer-source');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 reduced.addEventListener('change',()=>{if(reduced.matches)document.getAnimations().forEach(a=>a.cancel());});
 let trigger=null,zoom=1,fitWidth=0;
 function fit(){if(!image.naturalWidth)return;fitWidth=Math.min(scroll.clientWidth-40,(scroll.clientHeight-40)*image.naturalWidth/image.naturalHeight,image.naturalWidth);applyZoom();}
 function applyZoom(){image.style.width=Math.max(1,fitWidth*zoom)+'px';level.value=zoom===1?'适应':Math.round(zoom*100)+'%';}
 function close(){dialog.close();}
 document.addEventListener('click',async event=>{
  const link=event.target.closest('a[data-viewer]');if(!link)return;event.preventDefault();trigger=link;zoom=1;image.removeAttribute('style');image.alt=link.dataset.caption;image.src=link.getAttribute('href');caption.textContent=link.dataset.caption;source.href=link.dataset.source;dialog.showModal();document.body.style.overflow='hidden';
  try{await image.decode();fit();scroll.scrollTop=0;scroll.scrollLeft=0;}catch{caption.textContent+=' · 图版加载失败，请查看馆方来源';}
 });
 dialog.querySelector('.viewer-close').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)close();}});
 dialog.addEventListener('close',()=>{document.body.style.overflow='';trigger?.focus({preventScroll:true});});
 dialog.querySelector('.viewer-plus').addEventListener('click',()=>{zoom=Math.min(4,zoom+.5);applyZoom();});
 dialog.querySelector('.viewer-minus').addEventListener('click',()=>{zoom=Math.max(1,zoom-.5);applyZoom();});
 dialog.querySelector('.viewer-reset').addEventListener('click',()=>{zoom=1;fit();scroll.scrollTo({top:0,left:0,behavior:'instant'});});
 window.addEventListener('resize',()=>{if(dialog.open)fit();});
 document.querySelectorAll('[data-reading]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-reading]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  document.querySelectorAll('[data-reader-panel]').forEach(p=>p.hidden=p.dataset.readerPanel!==button.dataset.reading);
 }));
 document.querySelectorAll('[data-route]').forEach(button=>button.addEventListener('click',()=>{
  const r=window.QiaopiRecords[button.dataset.route];
  document.querySelectorAll('[data-route]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  for(const [selector,text] of [['[data-route-from]',r.from],['[data-route-to]',r.to],['[data-route-sender]',r.sender],['[data-route-date]',r.date],['[data-selected-title]',r.title]])document.querySelector(selector).textContent=text;
  document.querySelector('[data-route-figure]').innerHTML=r.letterFigure;
  document.querySelector('[data-selected-figure]').innerHTML=r.frontFigure;
  document.querySelector('[data-selected-meta]').innerHTML=r.metadata;
  if(!reduced.matches)document.querySelector('[data-route-figure]').animate([{opacity:.6},{opacity:1}],{duration:220,easing:'ease-out'});
 }));
 document.querySelectorAll('.mobile-nav nav a').forEach(a=>a.addEventListener('click',()=>a.closest('details').open=false));
 if(!reduced.matches&&document.querySelector('.b-letter')){
  const paper=document.querySelector('.b-letter');
  paper.querySelector('img').decode().then(()=>paper.animate([{opacity:.75},{opacity:1}],{duration:360,easing:'ease-out'})).catch(()=>{});
 }
})();
