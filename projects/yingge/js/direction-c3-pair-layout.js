(() => {
  const specs=[
    ['#look .look-grid','.look-instructions'],
    ['#actions .actions-grid','.action-notes'],
    ['#actions .ensemble-row','.ensemble-copy'],
    ['#people .people-grid','.people-story'],
    ['#people .practice-grid',':scope > div']
  ];
  const pairs=specs.map(([selector,copySelector])=>{
    const row=document.querySelector(selector);
    const figure=row?.querySelector(':scope > figure');
    const frame=figure?.querySelector(':scope > .pointer-frame');
    const copy=row?.querySelector(copySelector);
    if(!row||!figure||!frame||!copy)return null;
    row.classList.add('aligned-pair');copy.classList.add('paired-copy');
    return{row,figure,frame,copy};
  }).filter(Boolean);
  function measure(pair){
    // Layout dimensions exclude pointer/scroll transforms. Caption margins are included.
    const extra=Math.max(0,pair.figure.offsetHeight-pair.frame.offsetHeight);
    const value=extra+'px';
    if(pair.row.style.getPropertyValue('--pair-caption-space')!==value)
      pair.row.style.setProperty('--pair-caption-space',value);
  }
  const observer=new ResizeObserver(entries=>{
    const changed=new Set(entries.map(e=>e.target));
    pairs.forEach(pair=>{if(changed.has(pair.figure)||changed.has(pair.frame))measure(pair);});
  });
  pairs.forEach(pair=>{measure(pair);observer.observe(pair.figure);observer.observe(pair.frame);});
  document.fonts?.ready.then(()=>pairs.forEach(measure));
})();
