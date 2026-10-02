(() => {
  const bus=window.C3Interaction;
  const reduce = bus.reduce;
  const compact = bus.compact;
  const phone = bus.phone;
  const fine = bus.fine;
  const easing = 'cubic-bezier(.22,1,.36,1)';
  const animations = new Set();
  const revealed = new WeakSet();
  const targets = [...document.querySelectorAll('[data-motion]')];
  const layers = [...document.querySelectorAll('[data-depth]')];
  const activeLayers = new Set();
  const ambient = document.querySelector('.ambient');
  let frame = 0;
  let geometryDirty = true, heroTop = 0;
  const depthTops = new Map();

  // Progressive enhancement: nothing is hidden in CSS or requires JS to be read.
  function play(element, keyframes, duration, delay = 0) {
    if (!element || reduce.matches || !element.animate) return;
    const animation = element.animate(keyframes, {duration, delay, easing, fill:'backwards'});
    animations.add(animation);
    if(bus.viewerOpen||!bus.visible)animation.pause();
    const clear = () => animations.delete(animation);
    animation.addEventListener('finish', clear, {once:true});
    animation.addEventListener('cancel', clear, {once:true});
  }
  function reveal(el) {
    if (revealed.has(el) || el.getClientRects().length === 0) return;
    revealed.add(el);
    const kind = el.dataset.motion, small = compact.matches;
    const n = Number(el.dataset.sequence || 0);
    let duration = small ? 420 : 640, delay = 0;
    let from = {opacity:.4}, to = {opacity:1};
    if (kind.endsWith('line')) {
      delay = n * (small ? 80 : 140);
      const serif=getComputedStyle(el).fontFamily.includes('YGSerif');
      from = serif ? {opacity:.25,transform:`translateY(${small ? 12 : 16}px)`} : {opacity:.25,transform:`translateY(${small ? 16 : 22}px)`,clipPath:'inset(0 0 75% 0)'};
      to = serif ? {opacity:1,transform:'translateY(0)'} : {opacity:1,transform:'translateY(0)',clipPath:'inset(0 0 0 0)'};
    } else if (kind === 'look-image') {
      duration = small ? 600 : 900; delay = small ? 80 : 130;
      from = {opacity:.45, transform:`translateY(${small ? 12 : 24}px) scale(${small ? 1.008 : 1.02})`};
      to = {opacity:1, transform:'translateY(0) scale(1)'};
    } else if (kind === 'look-copy') {
      delay = small ? 40 : 220;
      from = small ? {opacity:.65} : {opacity:.4,transform:'translateX(8px)'};
      to = small ? {opacity:1} : {opacity:1,transform:'translateX(0)'};
    } else if (kind === 'face-image') {
      duration = small ? 600 : 1050;
      from = small ? {opacity:.5} : {opacity:.5, clipPath:'inset(0 3% 0 3%)'};
      to = small ? {opacity:1} : {opacity:1, clipPath:'inset(0 0 0 0)'};
    } else if (kind === 'face-secondary') {
      duration = small ? 560 : 850; delay = small ? 0 : 150;
      from = {opacity:.4,transform:`translateY(${small ? 12 : 32}px)`};
      to = {opacity:1,transform:'translateY(0)'};
    } else if (kind === 'object-main' || kind === 'person-image' || kind === 'practice-image') {
      duration = small ? 600 : 950;
      from = {opacity:.55,transform:`scale(${small ? 1.004 : 1.015})`};
      to = {opacity:1,transform:'scale(1)'};
    } else if (kind === 'detail-image') {
      duration = small ? 560 : 850; delay = n * (small ? 100 : 140);
      from = {opacity:.5,transform:`translateY(${small ? 12 : 20}px)`};
      to = {opacity:1,transform:'translateY(0)'};
    } else if (kind === 'person-field') {
      delay = n * (small ? 80 : 120);
      from = {opacity:.55};
    } else if (kind === 'archive-row') {
      duration = small ? 250 : 380; from = {opacity:.7};
    } else if (kind === 'action-image') {
      duration = small ? 550 : 780; from = {opacity:.65};
    } else if (kind === 'service' || kind === 'record' || kind === 'quiet-label') {
      duration = small ? 300 : 480; from = {opacity:.65};
    }
    // A fast hash jump should not wait on a sequence of timers.
    if (document.visibilityState !== 'visible') delay = 0;
    play(el, [from,to], duration, delay);
  }

  const clamp = n => Math.max(0,Math.min(1,n));
  function resetDepth() {
    layers.forEach(el => {el.style.removeProperty('--depth-y');el.style.removeProperty('--depth-scale');el.parentElement.style.removeProperty('--pair-depth-y');});
    ambient?.style.removeProperty('--drift');
  }
  function paintDepth() {
    frame = 0;
    if (reduce.matches) {resetDepth();return;}
    if(bus.viewerOpen||!bus.visible)return;
    const small = compact.matches;
    // Document positions change on layout events, not on every scroll frame.
    if(geometryDirty){
      for(const el of layers)depthTops.set(el,el.parentElement.getBoundingClientRect().top+scrollY);
      heroTop=document.querySelector('#hero').getBoundingClientRect().top+scrollY;
      geometryDirty=false;
    }
    for (const el of activeLayers) {
      const top=depthTops.get(el)-scrollY;
      const p = clamp((innerHeight*.82-top)/(small ? 420 : 760));
      const solo = el.dataset.depth === 'solo';
      const amount = small ? 12 : 36;
      const y = solo ? -amount*p : amount*(1-p);
      const scale = solo ? 1+(small ? .003 : .012)*p : 1+(small ? .004 : .016)*(1-p);
      el.style.setProperty('--depth-y',`${y.toFixed(2)}px`);
      if(el.parentElement.classList.contains('aligned-pair'))el.parentElement.style.setProperty('--pair-depth-y',`${y.toFixed(2)}px`);
      el.style.setProperty('--depth-scale',scale.toFixed(4));
    }
    if (ambient) {
      const y = !small && fine.matches ? 18*clamp((scrollY-heroTop)/500) : 0;
      ambient.style.setProperty('--drift',`${y.toFixed(2)}px`);
    }
  }
  function schedule() {if (!frame && !reduce.matches&&!bus.viewerOpen&&bus.visible) frame = requestAnimationFrame(paintDepth);}
  function invalidate(){geometryDirty=true;schedule();}

  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!reduce.matches) reveal(entry.target);
        if (revealed.has(entry.target)) observer.unobserve(entry.target);
      });
    }, {threshold:.08,rootMargin:'0px 0px -4% 0px'});
    targets.forEach(el => observer.observe(el));
    const depthObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const el = layers.find(layer => layer.parentElement === entry.target);
        if (!el) return;
        if (entry.isIntersecting) activeLayers.add(el);
        else activeLayers.delete(el);
      });
      schedule();
    }, {rootMargin:'100px 0px 100px 0px'});
    layers.forEach(el => depthObserver.observe(el.parentElement));
  }

  function responsiveDetails() {
    document.querySelectorAll('.source-detail').forEach(el => el.open=false);
    document.querySelectorAll('.second-sample').forEach(el => el.open=!phone.matches);
    schedule();
  }
  function preferenceChanged() {
    if (reduce.matches) {
      animations.forEach(a => a.cancel());animations.clear();
      if (frame) cancelAnimationFrame(frame);frame = 0;
      resetDepth();
    } else {
      targets.forEach(el => {if (!revealed.has(el)) observer?.observe(el);});
      schedule();
    }
  }
  reduce.addEventListener('change',preferenceChanged);
  compact.addEventListener('change',schedule);fine.addEventListener('change',schedule);
  phone.addEventListener('change',responsiveDetails);
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',invalidate,{passive:true});
  document.querySelectorAll('details').forEach(d => d.addEventListener('toggle',invalidate));
  document.addEventListener('load',invalidate,true);
  new ResizeObserver(invalidate).observe(document.querySelector('main'));

  function openDestination(target) {
    for (let el = target; el; el = el.parentElement) {
      if (el.tagName === 'DETAILS') el.open = true;
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click',() => {
    const target = document.getElementById(link.hash.slice(1));
    openDestination(target);
    const menu = link.closest('.mobile-menu');if (menu) menu.open = false;
  }));
  const type = document.querySelector('#archive-type');
  function filter() {
    let count = 0;
    document.querySelectorAll('.archive-list>li').forEach(row => {
      row.hidden = type.value !== 'all' && row.dataset.type !== type.value;
      if (!row.hidden) count++;
    });
    document.querySelector('#archive-count').value = `${count} 条资料`;
    document.querySelector('#archive-empty').hidden = count !== 0;
    invalidate();
  }
  type.addEventListener('change',filter);
  document.querySelectorAll('[data-filter-reset]').forEach(a => a.addEventListener('click',() => {type.value='all';filter();}));
  document.addEventListener('c3-state-change',()=>{
    for(const animation of animations){if(bus.viewerOpen||!bus.visible)animation.pause();else if(animation.playState==='paused')animation.play();}
    if(bus.viewerOpen||!bus.visible){if(frame)cancelAnimationFrame(frame);frame=0;}else schedule();
  });
  // Navigation is a section observer, not a per-scroll layout scan.
  const navLinks=[...document.querySelectorAll('.navigation a,.mobile-menu nav a')];
  const navGroup=id=>['hero','look'].includes(id)?'hero':['roles','actions','objects'].includes(id)?'roles':['people','archive','about'].includes(id)?'archive':'events';
  const visibleSections=new Map();
  const spy=new IntersectionObserver(entries=>{
    for(const entry of entries){if(entry.isIntersecting)visibleSections.set(entry.target.id,entry.boundingClientRect.top);else visibleSections.delete(entry.target.id);}
    const id=[...visibleSections].sort((a,b)=>Math.abs(a[1])-Math.abs(b[1]))[0]?.[0];
    if(!id)return;const group=navGroup(id);
    for(const a of navLinks){const active=a.hash==='#'+group;a.classList.toggle('current',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}
  },{rootMargin:'-12% 0px -55% 0px',threshold:0});
  document.querySelectorAll('[data-chapter]').forEach(section=>spy.observe(section));
  document.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open&&!reduce.matches)play(d.querySelector(':scope > div,:scope > article'),[{opacity:.5},{opacity:1}],180);}));
  responsiveDetails();filter();
  // Deep links open their actual destination; images and font loading never gate reading.
  const destination = document.getElementById(location.hash.slice(1));
  openDestination(destination);
  addEventListener('hashchange',() => {
    const target = document.getElementById(location.hash.slice(1));
    const closed = target?.closest('details:not([open])');
    openDestination(target);
    if (closed) requestAnimationFrame(() => target.scrollIntoView({behavior:'instant',block:'start'}));
  });
  if (!location.hash && !reduce.matches) {
    const small = compact.matches;
    ['origin','title','english'].forEach((name,i) => {
      play(document.querySelector(`[data-enter="${name}"]`),
        [{opacity:.2,transform:`translateY(${small ? 12 : 24}px)`},{opacity:1,transform:'translateY(0)'}],
        small ? 550 : 800,i*(small ? 80 : 120));
    });
    play(document.querySelector('.scene-window'),[{opacity:.45,transform:`scale(${small ? 1.015 : 1.035})`},{opacity:1,transform:'scale(1)'}],small ? 700 : 1100,80);
    play(document.querySelector('.hero-introduction'),[{opacity:.6},{opacity:1}],small ? 420 : 650,small ? 120 : 300);
  }
  document.fonts?.ready.then(invalidate).catch(()=>{});
  schedule();
})();
