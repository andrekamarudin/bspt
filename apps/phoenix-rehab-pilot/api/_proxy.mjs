import {getVercelOidcToken} from '@vercel/oidc';
const UPSTREAM='https://phoenix-api.bytesizeprotip.com';
export async function json(req,res,path,overrideBody){
 res.setHeader('Cache-Control','no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST'){res.status(405).json({ok:false,error:'Method not allowed.'});return null}
 const host=String(req.headers.host||'').toLowerCase();
 const origin=String(req.headers.origin||'');
 if(origin && origin!==('https://'+host)){res.status(403).json({ok:false,error:'Invalid request origin.'});return null}
 if(req.headers['content-type']?.split(';')[0]!=='application/json'){
   res.status(415).json({ok:false,error:'JSON requests only.'});return null;
 }
 const serialized=JSON.stringify(overrideBody??req.body??{});
 if(serialized.length>1_700_000){res.status(413).json({ok:false,error:'Request too large.'});return null}
 let oidc;
 try{oidc=await getVercelOidcToken()}catch{res.status(503).json({ok:false,error:'Secure backend authentication is not available.'});return null}
 if(!oidc){res.status(503).json({ok:false,error:'Secure backend authentication is not configured.'});return null}
 try{
   const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'unknown').split(',')[0].trim().slice(0,128);
   const response=await fetch(UPSTREAM+'/v1/'+path,{
     method:'POST',
     headers:{
       'Authorization':'Bearer '+oidc,'Content-Type':'application/json',
       'X-Requested-With':'BSPT-Phoenix-Proxy',
       'X-Client-IP':ip,
       ...(req.headers.cookie?{'Cookie':req.headers.cookie}:{})
     },
     body:serialized,
     signal:AbortSignal.timeout(12000),
     cache:'no-store'
   });
   const raw=await response.text();
   let data;try{data=JSON.parse(raw)}catch{data={ok:false,error:'Unexpected backend response.'}}
   if(data?.detail&&!data?.error)data.error=typeof data.detail==='string'?data.detail:'Request failed.';
   const cookie=response.headers.get('set-cookie');
   if(cookie)res.setHeader('Set-Cookie',cookie);
   if(!response.ok){res.status(response.status>=500?503:response.status).json({ok:false,error:data.error||'Request rejected.'});return null}
   return data;
 }catch{
   res.status(503).json({ok:false,error:'The secure backend is temporarily unavailable. Please try again later.'});
   return null;
 }
}
