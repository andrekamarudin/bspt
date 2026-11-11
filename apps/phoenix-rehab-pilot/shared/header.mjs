const root='/';
const navigation=[['About','/about'],['Chat','/chat'],['Book','/book'],['Admin','/admin'],['Dev','/dev']];
const route=location.pathname;
const head=document.getElementById('site-header');
if(head){
 const logo=document.createElement('a');logo.href='/about';logo.className='mark';
 const picture=document.createElement('picture');
 const source=document.createElement('source');source.media='(prefers-reduced-motion: reduce)';source.srcset='/brush-slash.svg';
 const image=document.createElement('img');image.src='/brand-mark-animated.svg';image.alt='BSPT original double brush-stroke logo';
 picture.append(source,image);
 const name=document.createElement('span');name.innerHTML='<strong>PHOENIX REHAB</strong><small>Pilot by BSPT</small>';
 logo.append(picture,name);const nav=document.createElement('nav');nav.setAttribute('aria-label','Main navigation');
 navigation.forEach(([label,url])=>{const a=document.createElement('a');a.textContent=label;a.href=url;if(route===url||route.startsWith(url+'/'))a.setAttribute('aria-current','page');nav.append(a)});
 head.append(logo,nav);
}
