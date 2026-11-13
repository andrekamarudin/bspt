/* BSPT Ink v1.0
 * Responsive, semantic handwriting, marker and optional targeted pointer renderer.
 * No fixed artboard coordinates. Annotations anchor to real DOM bounding boxes.
 * Copyright 2026 ByteSize ProTip. No external runtime dependencies.
 */
(function (window, document) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const instances = new Set();
  const defaults = Object.freeze({
    minWidth: 0, color: 'cream', placement: 'left-top', size: 30,
    gap: 20, rotation: -6, animated: false, offsetX: 0, offsetY: 0,
    avoid: [], allowOverlap: false, arrow: false, mobile: false
  });
  function resolve(root, selector) {
    if (!selector) return null;
    if (typeof selector === 'string') return root.querySelector(selector) || document.querySelector(selector);
    return selector && selector.getBoundingClientRect ? selector : null;
  }
  function path(svg, d, className, attrs) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', className);
    Object.keys(attrs || {}).forEach(k => p.setAttribute(k, String(attrs[k])));
    svg.appendChild(p);
    return p;
  }
  function svgOverlay(root) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'bspt-ink-svg');
    svg.setAttribute('aria-hidden', 'true');
    root.appendChild(svg);
    return svg;
  }
  function relRect(node, stageRect) {
    const r = node.getBoundingClientRect();
    return { x: r.left - stageRect.left, y: r.top - stageRect.top, w: r.width, h: r.height,
      get left(){return this.x},get right(){return this.x+this.w},get top(){return this.y},get bottom(){return this.y+this.h}};
  }
  function tightObstacleRects(node, stageRect) {
    // A block's CSS box can be 1,180px wide even if its visible text is 225px.
    // Use the painted content bounds, not all the empty whitespace around it.
    const controls=Array.from(node.querySelectorAll('a,button,input,textarea,select'));
    if(controls.length)return controls.map(n=>relRect(n,stageRect));
    const text=(node.textContent||'').trim();
    if(text && node.childNodes.length){
      try{
        const range=document.createRange();
        range.selectNodeContents(node);
        const rects=Array.from(range.getClientRects()).filter(r=>r.width>0&&r.height>0);
        range.detach?.();
        if(rects.length){
          const left=Math.min(...rects.map(r=>r.left)),right=Math.max(...rects.map(r=>r.right));
          const top=Math.min(...rects.map(r=>r.top)),bottom=Math.max(...rects.map(r=>r.bottom));
          const pad=6;
          const x=left-stageRect.left-pad,y=top-stageRect.top-pad,w=right-left+2*pad,h=bottom-top+2*pad;
          return [{x,y,w,h,left:x,right:x+w,top:y,bottom:y+h}];
        }
      }catch(_e){/* Fall back to element bounds for non-text content. */}
    }
    return [relRect(node,stageRect)];
  }
  function intersect(a, b) {
    const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return w * h;
  }
  function coords(rect, w, h, mode, gap) {
    switch (mode) {
      case 'left-top': return [rect.left-w-gap, rect.top+Math.min(30,rect.h*.22)];
      case 'right-top': return [rect.right+gap, rect.top+Math.min(12,rect.h*.15)];
      case 'above-left': return [rect.left, rect.top-h-gap];
      case 'above-right': return [rect.right-w, rect.top-h-gap];
      case 'below-left': return [rect.left, rect.bottom+gap];
      case 'below-right': return [rect.right-w, rect.bottom+gap];
      case 'top-right': return [rect.right-w, rect.top-h-gap];
      default: return [rect.left, rect.bottom+gap];
    }
  }
  function hasCollision(note, obstacles) {
    const area = Math.max(1, note.w*note.h);
    return obstacles.some(b => intersect(note,b) > Math.min(230, area*.065));
  }
  function drawArrow(svg, startRect, endRect, stageW, stageH) {
    // An arrow is never allowed without both rendered endpoints.
    const ax=startRect.x+startRect.w/2, ay=startRect.y+startRect.h/2;
    const bx=endRect.x+endRect.w/2, by=endRect.y+endRect.h/2;
    const dx=bx-ax,dy=by-ay, len=Math.hypot(dx,dy);
    if(len < 50 || len > 530 || !Number.isFinite(len)) return false;
    const ux=dx/len,uy=dy/len;
    const sx=ax+ux*Math.min(55,startRect.w*.42),sy=ay+uy*Math.min(25,startRect.h*.35);
    const ex=bx-ux*Math.min(25,endRect.w*.25),ey=by-uy*Math.min(20,endRect.h*.25);
    if (ex < 0 || ex > stageW || ey < 0 || ey > stageH) return false;
    const nx=-uy,ny=ux,bend=Math.min(27,len*.08);
    const c1x=sx+(ex-sx)*.34+nx*bend,c1y=sy+(ey-sy)*.34+ny*bend;
    const c2x=sx+(ex-sx)*.7+nx*bend,c2y=sy+(ey-sy)*.7+ny*bend;
    const d=`M${sx.toFixed(1)},${sy.toFixed(1)} C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
    path(svg,d,'bspt-ink-pointer');
    const theta=Math.atan2(ey-c2y,ex-c2x),al=15;
    const x1=ex-al*Math.cos(theta-.57),y1=ey-al*Math.sin(theta-.57);
    const x2=ex-al*Math.cos(theta+.57),y2=ey-al*Math.sin(theta+.57);
    path(svg,`M${x1.toFixed(1)},${y1.toFixed(1)} Q${ex.toFixed(1)},${ey.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`,'bspt-ink-pointer');
    return true;
  }
  function underline(svg, r, options) {
    const pad=options.pad===undefined?2:Number(options.pad),
      start=r.left+pad, end=r.right-pad, y=r.bottom+(options.distance??4);
    if(end-start<12) return;
    const sign=options.color||'yellow';
    const d1=`M${start.toFixed(1)},${y.toFixed(1)} Q${(start+(end-start)*.38).toFixed(1)},${(y+2.7).toFixed(1)} ${((start+end)/2).toFixed(1)},${(y+1).toFixed(1)} T${end.toFixed(1)},${(y-1.5).toFixed(1)}`;
    path(svg,d1,'bspt-ink-underline is-'+sign,{ 'stroke-width': options.width||6 });
    if (options.double) path(svg,`M${(start+7).toFixed(1)},${(y+6).toFixed(1)} Q${(start+end)/2},${y+9} ${end-4},${y+4}`,'bspt-ink-underline is-'+sign,{'stroke-width':1.7,opacity:.5});
  }
  function circle(svg, r, options) {
    const p=options.pad??9;
    let x=r.left-p,y=r.top-p,w=r.w+2*p,h=r.h+2*p;
    const d=`M${(x+w*.08).toFixed(1)},${(y+h*.42).toFixed(1)} C${(x-w*.1).toFixed(1)},${(y-h*.25).toFixed(1)} ${(x+w*.8).toFixed(1)},${(y-h*.12).toFixed(1)} ${(x+w*.96).toFixed(1)},${(y+h*.35).toFixed(1)} S${(x+w*.7).toFixed(1)},${(y+h*1.15).toFixed(1)} ${(x+w*.22).toFixed(1)},${(y+h*.98).toFixed(1)} S${(x-w*.09).toFixed(1)},${(y+h*.6).toFixed(1)} ${(x+w*.08).toFixed(1)},${(y+h*.42).toFixed(1)}`;
    path(svg,d,'bspt-ink-circle is-'+(options.color||'orange'));
  }
  class Sheet {
    constructor({stage,annotations=[]}={}) {
      this.stage=resolve(document,stage);
      if(!this.stage) throw Error('BSPTInk: stage not found');
      this.annotations=annotations.slice();
      this.root=document.createElement('div'); this.root.className='bspt-ink-layer';
      this.root.setAttribute('aria-hidden','true');
      this.stage.classList.add('bspt-ink-stage'); this.stage.appendChild(this.root);
      this.svg=svgOverlay(this.root);
      this.labels=new Map();
      this.timer=0; this.disposed=false;
      this._refresh=()=>this.schedule();
      this.observer = typeof ResizeObserver!=='undefined' ? new ResizeObserver(this._refresh) : null;
      this.observer?.observe(this.stage);
      // Surveys and applications can replace their content without resizing.
      // Ignore our own overlay mutations to avoid observer feedback loops.
      this.mutations=typeof MutationObserver!=='undefined' ? new MutationObserver(changes=>{
        if(changes.some(change=>!change.target.closest?.('.bspt-ink-layer')))this.schedule();
      }) : null;
      this.mutations?.observe(this.stage,{subtree:true,childList:true,characterData:true});
      this.revealed=new Set();
      window.addEventListener('resize',this._refresh,{passive:true});
      if(document.fonts?.ready) document.fonts.ready.then(()=>this.schedule());
      this.schedule(); instances.add(this);
    }
    add(spec) {this.annotations.push(spec);this.schedule();return this;}
    replace(annotations) {this.annotations=annotations.slice();this.schedule();return this;}
    schedule(){if(this.disposed||this.timer)return;this.timer=requestAnimationFrame(()=>{this.timer=0;this.draw()});}
    draw(){
      if(this.disposed) return;
      const sr=this.stage.getBoundingClientRect();
      if(sr.width===0||sr.height===0)return;
      this.svg.setAttribute('viewBox',`0 0 ${sr.width} ${sr.height}`);
      this.svg.replaceChildren();
      const occupied=[];
      const active=new Set();
      for(let i=0;i<this.annotations.length;i++) {
        const raw=this.annotations[i], a={...defaults,...raw};
        const id=a.id||String(i),target=resolve(this.stage,a.target);
        if (!target || sr.width<a.minWidth || (sr.width<=700 && a.mobile===false)) {
          const label=this.labels.get(id);if(label)label.style.display='none';
          continue;
        }
        active.add(id);
        const r=relRect(target,sr);
        if(a.kind==='underline' || a.kind==='circle'){
          if(a.kind==='underline') {
            if(a.lastLineFraction){const fraction=Math.max(.1,Math.min(1,a.lastLineFraction));r.w*=fraction; r.x+=a.align==='right'?(1-fraction)*(target.getBoundingClientRect().width):0;}
            underline(this.svg,r,a);
          } else circle(this.svg,r,a);
          continue;
        }
        if(a.kind!=='note' || !a.text) continue;
        let label=this.labels.get(id);
        if(!label){label=document.createElement('span');label.className='bspt-ink-note';label.setAttribute('data-bspt-ink-id',id);this.root.appendChild(label);this.labels.set(id,label)}
        label.textContent=a.text;label.style.display='block';label.className='bspt-ink-note is-'+a.color;
        if(a.motion==='reveal' && !this.revealed.has(id)){label.classList.add('bspt-ink-once');this.revealed.add(id);}
        label.style.fontSize=a.size+'px';label.style.maxWidth=(a.maxWidth||260)+'px';
        label.style.transform=`rotate(${a.rotation}deg)`;
        label.style.left='0';label.style.top='0';
        // The rendered font metrics decide the box, not a guessed preset size.
        const w=label.offsetWidth, h=label.offsetHeight;
        const placements=[a.placement,...(a.fallback||['above-left','above-right','left-top','right-top','below-left','below-right'])];
        const extra=a.avoid.map(s=>resolve(this.stage,s)).filter(Boolean).flatMap(n=>tightObstacleRects(n,sr));
        if(!a.allowOverlap)extra.push(r);
        const obstacles=[...extra,...occupied];let chosen=null;
        for(const mode of [...new Set(placements)]){
          const [cx,cy]=coords(r,w,h,mode,a.gap);
          const nx=cx+a.offsetX,ny=cy+a.offsetY;
          const rect={x:nx,y:ny,w,h,left:nx,right:nx+w,top:ny,bottom:ny+h};
          if(nx<12||ny<12||nx+w>sr.width-12||ny+h>sr.height-12)continue;
          if(hasCollision(rect,obstacles))continue;
          chosen=rect;break;
        }
        if(!chosen){label.style.display='none';continue;}
        label.style.left=chosen.x+'px';label.style.top=chosen.y+'px';
        occupied.push(chosen);
        // Pointer MUST have an explicit semantic target. Never point arbitrarily at a human or empty space.
        if(a.arrow && a.arrow.target){
          const end=resolve(this.stage,a.arrow.target);
          if(end){
            const er=relRect(end,sr);
            // Only create a pointer when its flight does not cross unrelated content.
            const straight={x:Math.min(chosen.x+chosen.w/2,er.x+er.w/2),y:Math.min(chosen.y+chosen.h/2,er.y+er.h/2),
              w:Math.abs(chosen.x+chosen.w/2-(er.x+er.w/2)),h:Math.abs(chosen.y+chosen.h/2-(er.y+er.h/2))};
            straight.left=straight.x;straight.top=straight.y;straight.right=straight.x+straight.w;straight.bottom=straight.y+straight.h;
            if(!extra.some(x=>x!==er && intersect(x,straight)>700))drawArrow(this.svg,chosen,er,sr.width,sr.height);
          }
        }
      }
      for(const [id,label] of this.labels){if(!active.has(id))label.style.display='none'}
    }
    destroy(){this.disposed=true;cancelAnimationFrame(this.timer);window.removeEventListener('resize',this._refresh);this.observer?.disconnect();this.mutations?.disconnect();this.root.remove();this.stage.classList.remove('bspt-ink-stage');instances.delete(this)}
  }
  window.BSPTInk={mount(options){return new Sheet(options)},refresh(){instances.forEach(x=>x.schedule())},destroyAll(){Array.from(instances).forEach(x=>x.destroy())},version:'1.0.0'};
})(window,document);