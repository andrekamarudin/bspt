/**
 * CHC survey static origin bridge. GitHub main remains the sole source of truth.
 * Deployed as a Cloudflare Worker because Vercel's Hobby API deployment quota
 * blocked the existing static project on 2026-11-13. Vercel routes ONLY
 * /chc-genai and /chc-genai/* to this origin; every other path keeps the
 * original ai-learning-discovery project. No DNS cutover.
 *
 * Review public code before changing this allowlist. Do not proxy admin pages,
 * register secrets, or serve arbitrary GitHub paths.
 */
const PREFIX="https://raw.githubusercontent.com/andrekamarudin/bspt/main/apps/ai-learning-discovery/public/";
const allowed=new Set([
 "chc-genai/index.html",
 "chc-genai/logic/index.html",
 "chc-genai/topics.js",
 "chc-genai/app.js",
 "chc-genai/logic.js",
 "chc-genai/logic.css",
 "chc-genai/levels.css",
 "chc-genai/build-revision.json"
]);
function select(path){
 if(path==="/chc-genai"||path==="/chc-genai/")return "chc-genai/index.html";
 if(path==="/chc-genai/logic"||path==="/chc-genai/logic/")return "chc-genai/logic/index.html";
 const relative=path.slice(1);
 return allowed.has(relative)?relative:null;
}
export default {
 async fetch(request){
  const url=new URL(request.url);
  if(request.method!=="GET"&&request.method!=="HEAD")return new Response("Method not allowed",{status:405,headers:{"Allow":"GET, HEAD"}});
  const name=select(url.pathname);
  if(!name)return new Response("Not found",{status:404,headers:{"Content-Type":"text/plain; charset=utf-8"}});
  try{
   const upstream=await fetch(PREFIX+name,{cf:{cacheEverything:true,cacheTtl:120},headers:{"Accept":"*/*"}});
   if(!upstream.ok)return new Response("CHC source temporarily unavailable",{status:503,headers:{"Cache-Control":"no-store"}});
   const headers=new Headers();
   headers.set("Content-Type",name.endsWith(".html")?"text/html; charset=utf-8":name.endsWith(".js")?"text/javascript; charset=utf-8":name.endsWith(".css")?"text/css; charset=utf-8":"application/json; charset=utf-8");
   headers.set("Cache-Control","public, max-age=120, must-revalidate");
   headers.set("X-Content-Type-Options","nosniff");
   headers.set("Referrer-Policy","no-referrer");
   headers.set("X-BSPT-Source","github-main");
   headers.set("Content-Security-Policy","default-src 'self'; connect-src 'self' https://jgkmjeorlkdpsptatuhc.supabase.co; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
   return new Response(request.method==="HEAD"?null:upstream.body,{status:200,headers});
  }catch{return new Response("Source temporarily unavailable",{status:503,headers:{"Cache-Control":"no-store"}})}
 }
};
