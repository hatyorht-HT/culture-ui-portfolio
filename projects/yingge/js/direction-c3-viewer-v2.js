(() => {
  const bus=window.C3Interaction;
  let closing=false;
  const links=[...document.querySelectorAll('a[data-photo-preview]')];
  if(!links.length||!HTMLDialogElement.prototype.showModal)return;
  const dialog=document.createElement('dialog');
  dialog.className='photo-viewer';dialog.setAttribute('aria-label','完整照片预览');
  dialog.innerHTML=`<div class="photo-viewer-top"><h2 class="photo-viewer-heading">完整照片</h2><div class="photo-viewer-actions"><a class="photo-viewer-download" download aria-label="下载临时原图" title="下载临时原图"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></svg></a><button type="button" class="photo-viewer-close" aria-label="关闭照片预览" title="关闭（Esc）"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div></div><div class="photo-viewer-stage"><img class="photo-viewer-image" alt="" draggable="false" hidden><div class="photo-viewer-message" role="status">正在读取原图…</div></div><div class="photo-viewer-bottom"><p class="photo-viewer-caption"></p><div class="photo-viewer-meta"><span class="photo-viewer-size"></span><span>临时视觉素材</span><a class="photo-viewer-source" target="_blank" rel="noopener">查看原出处 ↗</a></div><div class="photo-viewer-zoom" aria-label="照片缩放"><button type="button" class="photo-viewer-minus" aria-label="缩小照片">−</button><output class="photo-viewer-percent" aria-label="当前图片显示比例">—</output><button type="button" class="photo-viewer-plus" aria-label="放大照片">＋</button><button type="button" class="photo-viewer-fit">适应窗口</button></div><p class="photo-viewer-hint">滚轮缩放 · 放大后拖动 · Esc 关闭</p></div>`;
  document.body.append(dialog);
  const get=selector=>dialog.querySelector(selector);
  const stage=get('.photo-viewer-stage'),image=get('.photo-viewer-image'),message=get('.photo-viewer-message');
  const percent=get('.photo-viewer-percent'),minus=get('.photo-viewer-minus'),plus=get('.photo-viewer-plus');
  let origin=null,token=0,loaded=false,fit=1,zoom=1,pan={x:0,y:0},savedY=0;
  const pointers=new Map();let pinch=null,dragged=false,startedOnImage=false;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const signal=()=>document.dispatchEvent(new CustomEvent('photo-preview-change',{detail:{open:dialog.open}}));
  function paint(){
    const w=image.naturalWidth*fit*zoom,h=image.naturalHeight*fit*zoom;
    pan.x=clamp(pan.x,-Math.max(0,(w-stage.clientWidth)/2),Math.max(0,(w-stage.clientWidth)/2));
    pan.y=clamp(pan.y,-Math.max(0,(h-stage.clientHeight)/2),Math.max(0,(h-stage.clientHeight)/2));
    image.style.setProperty('--photo-zoom',zoom.toFixed(4));
    image.style.setProperty('--pan-x',pan.x.toFixed(2)+'px');image.style.setProperty('--pan-y',pan.y.toFixed(2)+'px');
    stage.dataset.zoomed=String(zoom>1.001);
    percent.textContent=loaded?Math.round(fit*zoom*100)+'%':'—';
    minus.disabled=!loaded||zoom<=1.001;plus.disabled=!loaded||fit*zoom>=1.999;
    get('.photo-viewer-fit').disabled=!loaded;
  }
  function refit(){
    if(!loaded)return;
    fit=Math.min(1,(stage.clientWidth-24)/image.naturalWidth,(stage.clientHeight-24)/image.naturalHeight);
    fit=Math.max(.01,fit);zoom=1;pan={x:0,y:0};
    image.style.width=image.naturalWidth*fit+'px';image.style.height=image.naturalHeight*fit+'px';paint();
  }
  function changeZoom(value){if(!loaded)return;zoom=clamp(value,1,2/fit);paint();}
  async function open(link){
    closing=false;dialog.dataset.phase='opening';origin=link;savedY=scrollY;loaded=false;zoom=1;pan={x:0,y:0};pointers.clear();pinch=null;
    const current=++token;
    get('.photo-viewer-caption').textContent=link.dataset.photoCaption||'完整来源照片';
    get('.photo-viewer-size').textContent='';
    const source=get('.photo-viewer-source');
    const directPhoto=/\.(jpe?g|png|webp)(?:\?|$)/i.test(link.dataset.photoSource||'')&&!link.dataset.photoSource.includes('/wiki/');
    source.hidden=!link.dataset.photoSource||directPhoto;
    if(link.dataset.photoSource)source.href=link.dataset.photoSource;else source.removeAttribute('href');
    get('.photo-viewer-download').href=link.dataset.photoPreview;
    image.hidden=true;message.hidden=false;message.textContent='正在读取原图…';paint();
    document.documentElement.classList.add('photo-preview-open');document.documentElement.dataset.photoPreview='open';
    dialog.showModal();dialog.animate([{opacity:0},{opacity:1}],{duration:bus.reduce.matches?140:300,easing:'cubic-bezier(.22,1,.36,1)'});signal();get('.photo-viewer-close').focus({preventScroll:true});
    image.src=link.dataset.photoPreview;image.alt='完整来源照片。'+(link.dataset.photoCaption||'英歌舞现场记录');
    try{
      await image.decode();
      if(current!==token||!dialog.open)return;
      loaded=true;image.hidden=false;message.hidden=true;
      image.animate(bus.reduce.matches?[{opacity:0},{opacity:1}]:[{opacity:0,scale:.985},{opacity:1,scale:1}],{duration:bus.reduce.matches?140:300,easing:'cubic-bezier(.22,1,.36,1)'});
      get('.photo-viewer-size').textContent=image.naturalWidth+' × '+image.naturalHeight+' px';refit();
    }catch{
      if(current!==token||!dialog.open)return;
      message.textContent='原图暂时无法读取，请关闭后重试。';paint();
    }
  }
  for(const link of links)link.addEventListener('click',event=>{if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();open(link);});
  async function close(){
    if(!dialog.open||closing)return;closing=true;dialog.dataset.phase='closing';
    const animation=dialog.animate([{opacity:1},{opacity:0}],{duration:bus.reduce.matches?120:220,easing:'cubic-bezier(.22,1,.36,1)'});
    try{await animation.finished;}catch{}dialog.close();closing=false;
  }
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  get('.photo-viewer-close').addEventListener('click',close);
  dialog.addEventListener('close',()=>{
    token++;loaded=false;pointers.clear();pinch=null;stage.dataset.dragging='false';
    document.documentElement.classList.remove('photo-preview-open');delete document.documentElement.dataset.photoPreview;
    scrollTo({top:savedY,behavior:'instant'});signal();origin?.focus({preventScroll:true});
  });
  // Only blank-space clicks close; gestures on the photograph never do.
  dialog.addEventListener('click',event=>{if(dragged||event.target===stage&&startedOnImage){dragged=false;startedOnImage=false;return;}if(event.target===dialog||event.target===stage)close();});
  minus.addEventListener('click',()=>changeZoom(zoom/1.25));plus.addEventListener('click',()=>changeZoom(zoom*1.25));
  get('.photo-viewer-fit').addEventListener('click',refit);
  image.addEventListener('dblclick',event=>{event.preventDefault();zoom>1.001?refit():changeZoom(Math.max(1.6,1/fit));});
  dialog.addEventListener('keydown',event=>{
    if(event.key==='Tab'){
      const controls=[...dialog.querySelectorAll('a[href],button:not(:disabled)')].filter(e=>e.getClientRects().length);
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
    if(event.key==='+'||event.key==='='){event.preventDefault();changeZoom(zoom*1.25);}
    if(event.key==='-'){event.preventDefault();changeZoom(zoom/1.25);}
    if(event.key==='0'){event.preventDefault();refit();}
    if(loaded&&zoom>1&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      event.preventDefault();pan.x+=event.key==='ArrowLeft'?40:event.key==='ArrowRight'?-40:0;pan.y+=event.key==='ArrowUp'?40:event.key==='ArrowDown'?-40:0;paint();
    }
  });
  stage.addEventListener('wheel',event=>{if(!loaded)return;event.preventDefault();changeZoom(zoom*Math.exp(-clamp(event.deltaY,-120,120)*.002));},{passive:false});
  stage.addEventListener('pointerdown',event=>{
    startedOnImage=event.target===image;
    if(event.target!==image||!loaded||event.button>0)return;
    dragged=false;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});stage.setPointerCapture(event.pointerId);
    if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom};}
    stage.dataset.dragging=String(zoom>1);
  });
  stage.addEventListener('pointermove',event=>{
    const before=pointers.get(event.pointerId);if(!before)return;
    const next={x:event.clientX,y:event.clientY};pointers.set(event.pointerId,next);
    if(pointers.size===2&&pinch){const [a,b]=[...pointers.values()];changeZoom(pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.distance));dragged=true;}
    else if(zoom>1){pan.x+=next.x-before.x;pan.y+=next.y-before.y;dragged ||=Math.hypot(next.x-before.x,next.y-before.y)>1;paint();}
  });
  const release=event=>{pointers.delete(event.pointerId);if(pointers.size<2)pinch=null;if(!pointers.size)stage.dataset.dragging='false';};
  stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
  new ResizeObserver(()=>{if(dialog.open)refit();}).observe(stage);
})();
