(() => {
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  const compact = matchMedia('(max-width:850px)');
  const root = document.documentElement;
  const pointer = {x:0,y:0,vx:0,vy:0,speed:0,normalizedSpeed:0,lastEvent:0};
  const bus=window.C3Interaction={pointer,fine,reduce,compact,phone:matchMedia('(max-width:600px)'),viewerOpen:false,visible:!document.hidden,enabled:false,particles:null};
  const clamp = (n,lo=0,hi=1) => Math.max(lo,Math.min(hi,n));
  let enabled=false, present=false, frame=0, dirty=true, scrollDirty=true, lastTime=0, eventTime=0;
  let fieldCurrent=null;
  const surfaces=[...document.querySelectorAll('.pointer-surface')].map(el=>({el,tone:el.querySelector(':scope > .pointer-environment > .pointer-tone'),box:null,state:{x:0,y:0,o:0}}));
  const media=[...document.querySelectorAll('.pointer-frame')].map(el=>{
    const plane=el.firstElementChild,source=plane.firstElementChild;
    const figure=el.closest('figure'),scene=el.closest('.scene'),section=el.closest('.pointer-surface');
    const id=section.id,key=source.querySelector('img')?.dataset.asset||id;
    let config={x:3,y:3,scale:.01};
    if(id==='hero')config={x:6,y:6,scale:.015};
    if(id==='look')config={x:4,y:4,scale:.01};
    if(id==='roles')config=source.classList.contains('crop')?{x:5,y:5,scale:.014}:{x:3,y:3,scale:.010};
    if(id==='actions')config=el.closest('[data-depth="ensemble"]')?{x:6,y:0,scale:.012}:{x:8,y:8,scale:.018};
    if(id==='objects'&&source.classList.contains('object-crop'))config={x:3,y:3,scale:.02};
    if(id==='people')config={x:2,y:2,scale:.008};
    const captions=figure&&!figure.classList.contains('detail-study')?[...figure.querySelectorAll(':scope > figcaption')]:figure?[]:[scene?.querySelector('.scene-caption')].filter(Boolean);
    const records=figure?[...figure.querySelectorAll(':scope > .metadata')]:[];
    if(figure?.classList.contains('detail-study'))records.push(...figure.querySelectorAll(':scope > figcaption'));
    if(id==='roles')records.push(...(el.closest('article')?.querySelectorAll(':scope > .metadata')||[]));
    captions.forEach(n=>n.classList.add('pointer-caption'));
    records.forEach(n=>n.classList.add('pointer-record'));
    plane.dataset.pointerMedia=key;
    return {el,plane,source,section,config,captions,records,box:null,state:{x:0,y:0,s:1,e:0,o:1,cy:0,a:0}};
  });
  bus.media=media;
  const titles=[...document.querySelectorAll('#hero h1,.chapter h2,.footer h2')].map(el=>{
    el.classList.add('pointer-title');if(el.closest('.footer'))return{el,box:null,state:{x:0,y:0},max:1};return{el,box:null,state:{x:0,y:0},max:el.closest('#look,#people,#events')?1.75:el.closest('#actions')?3.5:el.closest('#hero')?2.5:3};
  });
  const magnets=[...document.querySelectorAll('a[href],summary,button')].filter(el=>!el.closest('.pointer-frame')).map(el=>{
    const max=el.classList.contains('brand')?1:el.closest('.header')?3.5:el.closest('.footer')?5:el.classList.contains('entry')||el.classList.contains('archive-entry')?5.5:4.5;el.classList.add('pointer-magnet');return{el,box:null,state:{x:0,y:0},max};
  });
  const rows=[...document.querySelectorAll('.featured-list > li,.archive-list > li')].map(el=>{
    el.classList.add('pointer-row');return{el,group:el.parentElement,box:null,state:{o:1,a:0,e:0}};
  });
  const ambient=document.querySelector('.ambient');
  let ambientState={x:0,y:0};

  function bounds(el,state) {
    const r=el.getBoundingClientRect();
    return r.width&&r.height?{x:r.left+scrollX-(state?.x||0),y:r.top+scrollY-(state?.y||0),w:r.width,h:r.height}:null;
  }
  function refresh() {
    surfaces.forEach(r=>r.box=bounds(r.el));
    media.forEach(r=>r.box=bounds(r.el));
    [...titles,...magnets].forEach(r=>r.box=bounds(r.el,r.state));
    rows.forEach(r=>r.box=bounds(r.el));
    dirty=false;scrollDirty=false;
  }
  function viewportBox(box){return box&&{x:box.x-scrollX,y:box.y-scrollY,w:box.w,h:box.h};}
  function visible(b){return b&&b.y+b.h>0&&b.y<innerHeight&&b.x+b.w>0&&b.x<innerWidth;}
  function distance(b){return Math.hypot(Math.max(b.x-pointer.x,0,pointer.x-b.x-b.w),Math.max(b.y-pointer.y,0,pointer.y-b.y-b.h));}
  function inside(b){return b&&pointer.x>=b.x&&pointer.x<=b.x+b.w&&pointer.y>=b.y&&pointer.y<=b.y+b.h;}
  function normal(b){return{x:clamp((pointer.x-b.x)/b.w*2-1,-1,1),y:clamp((pointer.y-b.y)/b.h*2-1,-1,1)};}
  function set(el,name,value){if(el.style.getPropertyValue(name)!==value)el.style.setProperty(name,value);}
  function easeState(state,target,alpha){
    let moving=false,changed=false;
    for(const k of Object.keys(target)){
      const epsilon=(k==='s'||k==='o'||k==='e') ? .0002 : .015;
      const next=Math.abs(target[k]-state[k])<epsilon?target[k]:state[k]+(target[k]-state[k])*alpha;
      if(Math.abs(next-target[k])>=epsilon)moving=true;
      if(next!==state[k])changed=true;
      state[k]=next;
    }
    return{moving,changed};
  }
  function paintMedia(r){
    const s=r.state;
    set(r.plane,'--media-x',s.x.toFixed(3)+'px');set(r.plane,'--media-y',s.y.toFixed(3)+'px');
    set(r.plane,'--media-scale',s.s.toFixed(5));set(r.plane,'--media-edge',s.e.toFixed(4));
    [...r.captions,...r.records].forEach(n=>set(n,'--caption-opacity',s.o.toFixed(4)));
    r.captions.forEach(n=>{set(n,'--caption-y',s.cy.toFixed(3)+'px');set(n,'--caption-arrow',s.a.toFixed(3)+'px');});
  }
  function tick(time){
    frame=0;
    if(!enabled)return;
    if(dirty)refresh();
    else if(scrollDirty){
      // Only visible scroll-linked media need fresh transformed bounds.
      media.forEach(r=>{if(visible(viewportBox(r.box)))r.box=bounds(r.el);});
      scrollDirty=false;
    }
    const dt=lastTime?Math.min(40,time-lastTime):16.7;lastTime=time;
    const alpha=1-Math.exp(-dt/48);
    const magneticAlpha=1-Math.exp(-dt/36);
    let moving=false,busy=false;
    if(present){
      set(root,'--pointer-x',pointer.x.toFixed(2)+'px');set(root,'--pointer-y',pointer.y.toFixed(2)+'px');
      set(root,'--pointer-nx',(pointer.x/innerWidth*2-1).toFixed(4));set(root,'--pointer-ny',(pointer.y/innerHeight*2-1).toFixed(4));
    }
    const current=present?surfaces.find(r=>inside(viewportBox(r.box))):null;
    for(const r of surfaces){
      const b=viewportBox(r.box),here=r===current;
      const size=r.el.id==='hero'?560:r.el.classList.contains('header')?460:r.el.classList.contains('dark')?460:500;
      const power=r.el.id==='archive'?.020:r.el.classList.contains('header')?.012:r.el.classList.contains('dark')?.030:r.el.id==='hero'?.055:.040;
      const target={x:here?pointer.x-b.x-size/2:r.state.x,y:here?pointer.y-b.y-size/2:r.state.y,o:here?power:0};
      const result=easeState(r.state,target,alpha);moving ||=result.moving;
      if(result.changed){set(r.tone,'--field-x',r.state.x.toFixed(2)+'px');set(r.tone,'--field-y',r.state.y.toFixed(2)+'px');set(r.tone,'--field-opacity',r.state.o.toFixed(4));}
    }
    fieldCurrent=current;
    const particlesMoving=bus.particles?.update({time,dt,pointer,present,current:current?.el,box:current?.box,scrollX,scrollY})||false;
    moving ||=particlesMoving;
    for(const r of media){
      const b=viewportBox(r.box),on=present&&visible(b);
      const d=on?distance(b):Infinity,near=clamp(1-d/260),n=on?normal(b):{x:0,y:0};
      const entered=on&&inside(b);
      const penetration=entered?clamp(Math.min(pointer.x-b.x,b.x+b.w-pointer.x,pointer.y-b.y,b.y+b.h-pointer.y)/64):0;
      const revealed=on&&near>0&&r.source.getAnimations().some(a=>a.playState==='running');
      busy ||=on&&near>0&&revealed;
      // Two approach bands join continuously at 120px and at the image edge.
      const approach=d>120?.004*clamp((260-d)/140):.004+.004*clamp((120-d)/120);
      const travel=d>120?1.5*clamp((260-d)/140):1.5+1.5*clamp((120-d)/120);
      let scale=1+(entered?.008+(r.config.scale-.008)*penetration:approach);
      let x=n.x*(entered?Math.min(3,r.config.x)+(r.config.x-Math.min(3,r.config.x))*penetration:Math.min(travel,r.config.x));
      let y=n.y*(entered?Math.min(3,r.config.y)+(r.config.y-Math.min(3,r.config.y))*penetration:Math.min(travel,r.config.y));
      if(!on||revealed){scale=1;x=0;y=0;}
      const depth=Number(r.el.closest('[data-depth]')?.style.getPropertyValue('--depth-scale')||1);
      scale=Math.min(scale,1.028/depth);
      const target={x,y,s:Math.max(1,scale),e:near*(r.section.id==='actions'?.34:.28),o:on?.90+near*.10:1,cy:on?2*(1-near):0,a:near*4};
      const result=easeState(r.state,target,alpha);moving ||=result.moving;
      if(result.changed)paintMedia(r);
      if(r.section.id==='roles'&&r.source.classList.contains('crop')){const img=r.source.querySelector('img');set(img,'--crop-focus-x',(n.x*3*penetration).toFixed(2)+'px');set(img,'--crop-focus-y',(n.y*3*penetration).toFixed(2)+'px');}
      const detailTitle=r.el.closest('.detail-study')?.querySelector('h3');if(detailTitle)set(detailTitle,'--detail-title-x',(near*n.x*1.5).toFixed(2)+'px');
    }
    for(const r of titles){
      const b=viewportBox(r.box),near=present&&visible(b)?clamp(1-distance(b)/210):0,n=near?normal(b):{x:0,y:0};
      const result=easeState(r.state,{x:n.x*r.max*near,y:n.y*r.max*near},alpha);moving ||=result.moving;
      if(result.changed){set(r.el,'--title-x',r.state.x.toFixed(3)+'px');set(r.el,'--title-y',r.state.y.toFixed(3)+'px');}
    }
    for(const r of magnets){
      const b=viewportBox(r.box),near=present&&visible(b)?clamp(1-distance(b)/48):0,n=near?normal(b):{x:0,y:0};
      const result=easeState(r.state,{x:n.x*r.max*near,y:n.y*r.max*near},magneticAlpha);moving ||=result.moving;
      if(result.changed){set(r.el,'--magnet-x',r.state.x.toFixed(3)+'px');set(r.el,'--magnet-y',r.state.y.toFixed(3)+'px');}
    }
    const activeRow=present?rows.find(r=>inside(viewportBox(r.box))):null;
    for(const r of rows){
      const selected=r===activeRow,peer=activeRow&&r.group===activeRow.group;
      const result=easeState(r.state,{o:peer&&!selected?.88:1,a:selected?5.5:0,e:selected?1:0},alpha);moving ||=result.moving;
      if(result.changed){set(r.el,'--row-focus',r.state.e.toFixed(4));set(r.el,'--row-opacity',r.state.o.toFixed(4));set(r.el,'--row-arrow',r.state.a.toFixed(3)+'px');set(r.el,'--row-edge',r.state.e>.5?'#a5afa4':'var(--edge)');}
    }
    const heroBox=viewportBox(surfaces.find(r=>r.el.id==='hero')?.box);
    const h=present&&heroBox&&inside(heroBox)?normal(heroBox):{x:0,y:0};
    const ambientResult=easeState(ambientState,{x:-h.x*3,y:-h.y*3},alpha);moving ||=ambientResult.moving;
    if(ambient&&ambientResult.changed){set(ambient,'--ambient-pointer-x',ambientState.x.toFixed(3)+'px');set(ambient,'--ambient-pointer-y',ambientState.y.toFixed(3)+'px');}
    const heroNear=present&&heroBox&&inside(heroBox)?1:0;
    const origin=document.querySelector('.origin'),english=document.querySelector('.english');
    if(origin){set(origin,'--origin-opacity',heroNear?'1':'.88');set(origin,'--origin-x',heroNear?(h.x*.8).toFixed(2)+'px':'0px');}
    if(english)set(english,'--english-opacity',heroNear?'1':'.88');
    if(moving||busy)schedule();
    else {lastTime=0;pointer.vx=0;pointer.vy=0;pointer.speed=0;}
  }
  function schedule(){if(enabled&&!frame)frame=requestAnimationFrame(tick);}
  function stopInstant(){
    present=false;fieldCurrent=null;lastTime=0;pointer.speed=0;pointer.normalizedSpeed=0;bus.particles?.reset();
    if(frame)cancelAnimationFrame(frame);frame=0;
    ['--pointer-x','--pointer-y','--pointer-nx','--pointer-ny'].forEach(k=>root.style.removeProperty(k));
    for(const r of surfaces){r.state.o=0;set(r.tone,'--field-opacity','0');}
    for(const r of media){r.source.querySelector('img')?.style.setProperty('--crop-focus-x','0px');r.source.querySelector('img')?.style.setProperty('--crop-focus-y','0px');r.el.closest('.detail-study')?.querySelector('h3')?.style.setProperty('--detail-title-x','0px');Object.assign(r.state,{x:0,y:0,s:1,e:0,o:1,cy:0,a:0});paintMedia(r);}
    for(const r of titles){Object.assign(r.state,{x:0,y:0});set(r.el,'--title-x','0px');set(r.el,'--title-y','0px');}
    for(const r of magnets){Object.assign(r.state,{x:0,y:0});set(r.el,'--magnet-x','0px');set(r.el,'--magnet-y','0px');}
    for(const r of rows){Object.assign(r.state,{o:1,a:0,e:0});set(r.el,'--row-focus',r.state.e.toFixed(4));set(r.el,'--row-opacity','1');set(r.el,'--row-arrow','0px');set(r.el,'--row-edge','var(--edge)');}
    ambientState={x:0,y:0};ambient?.style.removeProperty('--ambient-pointer-x');ambient?.style.removeProperty('--ambient-pointer-y');
  }
  function preferences(){
    bus.viewerOpen=root.dataset.photoPreview==='open';bus.visible=!document.hidden;
    const next=bus.visible&&fine.matches&&!reduce.matches&&!compact.matches&&root.dataset.photoPreview!=='open';
    if(!next)stopInstant();
    enabled=next;bus.enabled=next;document.dispatchEvent(new CustomEvent('c3-state-change'));root.dataset.pointer=enabled?'fine':'off';dirty=true;
    if(enabled)schedule();
  }
  addEventListener('pointermove',e=>{
    if(!enabled||e.pointerType!=='mouse'||e.buttons){if(present){present=false;schedule();}return;}
    const dt=Math.max(1,e.timeStamp-eventTime);
    // Clamp normalized speed; the first event after a section jump is not a gust.
    const vx=present?(e.clientX-pointer.x)/dt:0,vy=present?(e.clientY-pointer.y)/dt:0;
    const speed=Math.hypot(vx,vy),limit=speed>3?3/speed:1;
    pointer.vx=vx*limit;pointer.vy=vy*limit;pointer.speed=Math.min(3,speed);pointer.normalizedSpeed=Math.min(1,pointer.speed/1.8);pointer.lastEvent=performance.now();
    pointer.x=e.clientX;pointer.y=e.clientY;eventTime=e.timeStamp;present=true;schedule();
  },{passive:true});
  document.addEventListener('pointerleave',()=>{present=false;schedule();});
  addEventListener('blur',stopInstant);
  document.addEventListener('visibilitychange',preferences);
  addEventListener('keydown',e=>{if(e.key==='Tab'||e.key==='Escape')stopInstant();});
  addEventListener('resize',()=>{dirty=true;preferences();},{passive:true});
  addEventListener('scroll',()=>{scrollDirty=true;schedule();},{passive:true});
  document.addEventListener('toggle',()=>{dirty=true;schedule();},true);
  document.addEventListener('change',()=>{dirty=true;schedule();},true);
  document.addEventListener('photo-preview-change',preferences);
  document.addEventListener('load',()=>{dirty=true;schedule();},true);
  document.fonts?.ready.then(()=>{dirty=true;schedule();});
  [fine,reduce,compact].forEach(q=>q.addEventListener('change',preferences));
  preferences();
})();
