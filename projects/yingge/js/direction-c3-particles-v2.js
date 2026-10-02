(() => {
  const bus=window.C3Interaction;
  const configs={
    hero:{count:70,low:.50,high:.72,core:'#edb36b',middle:'#c7793c',edge:'#a3522b',speed:1.12},
    look:{count:34,low:.36,high:.51,core:'#d6b17e',middle:'#ae855c',edge:'#927253',speed:.85},
    roles:{count:46,low:.44,high:.67,core:'#d8b37c',middle:'#a46b4d',edge:'#7d4230',speed:.94},
    actions:{count:70,low:.54,high:.76,core:'#f3bb6d',middle:'#d57832',edge:'#af4b24',speed:1.25},
    objects:{count:40,low:.38,high:.54,core:'#d1b28b',middle:'#ae865e',edge:'#896a4e',speed:.86},
    people:{count:24,low:.30,high:.42,core:'#c8b79d',middle:'#a99577',edge:'#938471',speed:.70},
    archive:{count:16,low:.26,high:.35,core:'#c0b097',middle:'#a59175',edge:'#8f806b',speed:.60},
    events:{count:18,low:.31,high:.43,core:'#ccb18b',middle:'#a8895f',edge:'#8d7352',speed:.67},
    about:{count:22,low:.36,high:.52,core:'#cbb089',middle:'#9e744e',edge:'#7d4b35',speed:.57}
  };
  const total=Object.values(configs).reduce((sum,config)=>sum+config.count,0);
  const fields=[],active=new Set();let paused=false;
  const toggle=document.createElement('button');toggle.type='button';toggle.className='particle-toggle';toggle.textContent='暂停余烬';
  toggle.setAttribute('aria-label','暂停背景余烬');toggle.setAttribute('aria-pressed','false');
  document.querySelector('.footer-bottom')?.append(toggle);
  for(const [id,config] of Object.entries(configs)){
    const section=document.getElementById(id),parent=section.querySelector(':scope > .pointer-environment');
    const field=document.createElement('div');field.className='drift-field';field.setAttribute('aria-hidden','true');
    const item={section,field,config,dots:[],visible:false};
    for(let i=0;i<config.count;i++){
      const seed=i+fields.length*101,random=n=>{const v=Math.sin((seed+1)*127.1+n*311.7)*43758.5453;return v-Math.floor(v);};
      const roll=random(1),width=roll<.7?1.8+random(2)*.85:roll<.9?2.65+random(2)*.85:3.5+random(2)*.9;
      const length=roll<.7?3+random(3)*1.6:roll<.9?4.6+random(3)*1.9:6.5+random(3)*2.3;
      const wrapper=document.createElement('span');wrapper.className='particle-drift';
      const x=.02+random(0)*.96,sway=18+random(4)*60,direction=random(5)>.5?1:-1;
      wrapper.style.setProperty('--dot-x',x*100+'%');
      const dot=document.createElement('i');dot.className='drift-dot';
      const opacity=config.low+random(6)*(config.high-config.low);
      dot.style.cssText=`--ember-width:${width.toFixed(2)}px;--ember-length:${length.toFixed(2)}px;--dot-opacity:${opacity.toFixed(3)};--ember-sway-a:${sway*direction}px;--ember-sway-b:${-sway*direction*.55}px;--ember-sway-end:${sway*direction*.4}px;--ember-turn:${-35+random(7)*70}deg;--ember-core:${config.core};--ember-middle:${config.middle};--ember-edge:${config.edge}`;
      wrapper.append(dot);field.append(wrapper);
      item.dots.push({wrapper,dot,x,opacity,sway:sway*direction,speed:(40+random(8)*32)*config.speed,phase:random(9),animation:null,state:{x:0,y:0,o:0}});
    }
    parent.append(field);fields.push(item);
  }
  function geometry(item){
    const rise=item.section.clientHeight+80;item.rise=rise;item.field.style.setProperty('--ember-rise',rise+'px');
    // Keep the existing count; concentrate part of the Hero field in the title/photo air gap.
    const photo=item.section.id==='hero'&&!bus.compact.matches?item.section.querySelector('.scene-window'):null;
    const photoBox=photo?.getBoundingClientRect(),sectionBox=photo?item.section.getBoundingClientRect():null;
    const exposed=photoBox?Math.max(.08,(photoBox.left-sectionBox.left-20)/sectionBox.width):1;
    item.dots.forEach((record,i)=>{
      const duration=Math.max(10,rise/record.speed);record.duration=duration;
      record.dot.style.setProperty('--dot-time',duration.toFixed(2)+'s');record.dot.style.setProperty('--dot-delay',(-duration*record.phase).toFixed(2)+'s');
      record.wrapper.hidden=bus.compact.matches&&i>=Math.ceil(item.config.count*.55);
      const x=photo&&i<Math.ceil(item.config.count*.35)
        ? exposed*.48+record.x*exposed*.52
        : photo&&i<Math.ceil(item.config.count*.60)
          ? .02+record.x*Math.max(.02,exposed-.02):record.x;
      record.currentX=x;record.wrapper.style.setProperty('--dot-x',x*100+'%');
    });
    // Animation handles are cached at geometry changes, not in pointermove.
    item.dots.forEach(record=>record.animation=record.dot.getAnimations()[0]||null);
  }
  function reset(){
    for(const record of active){record.state={x:0,y:0,o:0};record.wrapper.style.removeProperty('--particle-drift-x');record.wrapper.style.removeProperty('--particle-drift-y');record.dot.style.removeProperty('--particle-opacity');}
    active.clear();
    bus.particleStats={active:0,total,radius:180,maximum:12};
  }
  function sync(){
    const disabled=bus.reduce.matches,blocked=paused||disabled||!bus.visible||bus.viewerOpen;
    for(const item of fields)item.field.dataset.active=String(item.visible&&!blocked);
    toggle.textContent=disabled?'余烬效果已关闭':paused?'开启余烬':'暂停余烬';toggle.disabled=disabled;toggle.setAttribute('aria-pressed',String(paused));
    toggle.setAttribute('aria-label',paused?'开启背景余烬':'暂停背景余烬');
    document.documentElement.dataset.particles=disabled?'off':blocked?'paused':bus.compact.matches?'light':'on';
    if(blocked||!bus.enabled)reset();
  }
  function position(record,item,box){
    const p=record.animation?.effect.getComputedTiming().progress;
    if(p==null)return null;
    const knots=[[0,0],[.28,record.sway],[.56,-record.sway*.55],[.78,record.sway],[1,record.sway*.4]];
    let dx=0;
    for(let i=1;i<knots.length;i++)if(p<=knots[i][0]){const a=knots[i-1],b=knots[i];dx=a[1]+(b[1]-a[1])*(p-a[0])/(b[0]-a[0]);break;}
    return{x:box.x+box.w*record.currentX+dx,y:box.y+box.h+20-item.rise*p};
  }
  function update(context){
    const {pointer,present,current,box,dt,time,scrollX,scrollY}=context;
    const item=fields.find(v=>v.section===current),eligible=item?.visible&&item.field.dataset.active==='true'&&box&&present;
    const age=time-pointer.lastEvent,fresh=age<32?1:Math.exp(-(age-32)/38),targets=new Map();
    if(eligible&&fresh>.015){
      const candidates=[];
      for(const record of item.dots){
        if(record.wrapper.hidden)continue;const point=position(record,item,box);if(!point)continue;
        point.x-=scrollX;point.y-=scrollY;
        if(point.y<0||point.y>innerHeight)continue;
        // Points hidden by photographs cannot receive visible disturbances.
        if(bus.media.some(media=>{const b=media.box;return b&&point.x>=b.x-scrollX&&point.x<=b.x+b.w-scrollX&&point.y>=b.y-scrollY&&point.y<=b.y+b.h-scrollY;}))continue;
        const distance=Math.hypot(pointer.x-point.x,pointer.y-point.y);
        if(distance<180)candidates.push({record,distance});
      }
      candidates.sort((a,b)=>a.distance-b.distance);
      for(const {record,distance} of candidates.slice(0,12)){
        if(!active.has(record)&&active.size>=12)continue;
        active.add(record);
        const force=(1-distance/180)*fresh,normalized=pointer.normalizedSpeed;
        const speed=Math.max(.001,pointer.speed),magnitude=(2+14*normalized)*force;
        const x=pointer.speed>.01?pointer.vx/speed*magnitude:magnitude*.35;
        const y=pointer.speed>.01?pointer.vy/speed*magnitude:-magnitude*.3;
        const maximum=item.section.id==='actions'?.82:item.config.high;
        targets.set(record,{x,y,o:Math.min(.07,Math.max(0,maximum-record.opacity))*force});
      }
    }
    const alpha=1-Math.exp(-dt/53);
    for(const record of active){
      const target=targets.get(record)||{x:0,y:0,o:0},s=record.state;
      for(const key of ['x','y','o']){s[key]+= (target[key]-s[key])*alpha;if(Math.abs(s[key]-target[key])<(key === 'o' ? .0005 : .035))s[key]=target[key];}
      record.wrapper.style.setProperty('--particle-drift-x',s.x.toFixed(3)+'px');record.wrapper.style.setProperty('--particle-drift-y',s.y.toFixed(3)+'px');record.dot.style.setProperty('--particle-opacity',s.o.toFixed(4));
      if(!targets.has(record)&&s.x===0&&s.y===0&&s.o===0)active.delete(record);
    }
    bus.particleStats={active:active.size,total,radius:180,maximum:12};
    return active.size>0;
  }
  bus.particles={update,reset};
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){const item=fields.find(v=>v.section===entry.target);if(item)item.visible=entry.isIntersecting;}sync();});
  const resize=new ResizeObserver(entries=>{for(const entry of entries){const item=fields.find(v=>v.section===entry.target);if(item)geometry(item);}});
  fields.forEach(item=>{geometry(item);observer.observe(item.section);resize.observe(item.section);});
  toggle.addEventListener('click',()=>{paused=!paused;sync();});
  document.addEventListener('c3-state-change',()=>{fields.forEach(geometry);sync();});
  sync();
})();
