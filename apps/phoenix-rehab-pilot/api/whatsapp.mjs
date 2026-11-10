/**
 * Phoenix Rehab Meta Cloud API TEST webhook, intentionally isolated from clinical backend.
 * No patient data storage; explicit recipient allowlist; outbound disabled by default.
 */
import {createHmac,timingSafeEqual} from 'node:crypto';
import {respond,SOURCES,CLINICS} from '../engine.mjs';

const MAX_BYTES=256*1024;
const NUMBER=/^\d{8,15}$/;
const PRIVACY='This is a Phoenix Rehab WhatsApp integration test. Please do not send patient identifiers, medical records, photographs or other sensitive health information. Contact the clinic directly for clinical advice.';
export function verifySignature(raw,sig,secret){
  if(!secret||typeof sig!=='string'||!/^sha256=[0-9a-f]{64}$/i.test(sig))return false;
  const a=Buffer.from(sig.toLowerCase());
  const b=Buffer.from('sha256='+createHmac('sha256',secret).update(raw).digest('hex'));
  return a.length===b.length&&timingSafeEqual(a,b);
}
function equal(a,b){if(!a||!b)return false;const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y)}
function query(req,k){if(typeof req.query?.[k]==='string')return req.query[k];try{return new URL(req.url||'/','https://example.invalid').searchParams.get(k)||''}catch{return ''}}
async function rawBody(req){
  const chunks=[];let bytes=0;
  for await(const c of req){const b=Buffer.isBuffer(c)?c:Buffer.from(c);bytes+=b.length;if(bytes>MAX_BYTES)throw Error('too_large');chunks.push(b)}
  return Buffer.concat(chunks);
}
export function makeReply(input){
  const text=String(input||'').trim().slice(0,500);
  if(!text)return null;
  if(/\b(privacy|data|patient record|medical report|confidential|photo|diagnos|my symptoms?)\b/i.test(text))return PRIVACY;
  if(/^(hi|hello|hey|start|test)[!?.\s]*$/i.test(text))
    return 'Phoenix Rehab WhatsApp test connection is working. Ask about fees, clinic locations or official booking links.';
  const result=respond(text);
  // The web-only privacy/pilot answers make incorrect claims about WhatsApp and are never reused.
  if(['privacy','pilot'].includes(result.category))return PRIVACY;
  if(result.category==='booking'){
    const official=result.links?.find(l=>l.url===SOURCES.globalBooking||l.url?.startsWith('https://phoenixrehabgroup.com/calendar/'))?.url||SOURCES.globalBooking;
    return (result.text+'\n\nOfficial booking calendar: '+official).slice(0,1600);
  }
  if(result.category==='location'){
    const c=CLINICS.find(c=>text.toLowerCase().includes(c.name.toLowerCase()));
    return (result.text+(c?'\n\nOfficial booking calendar: '+c.calendar:'')).slice(0,1600);
  }
  return result.text.slice(0,1600);
}
export async function sendText({to,text,phoneId,token,fetchImpl=fetch}){
  if(!NUMBER.test(to)||!NUMBER.test(String(phoneId))||!token)throw Error('invalid_config');
  const version=process.env.PHOENIX_WA_GRAPH_VERSION||'v26.0';
  if(!/^v\d{1,2}\.0$/.test(version))throw Error('invalid_version');
  const r=await fetchImpl('https://graph.facebook.com/'+version+'/'+phoneId+'/messages',{
    method:'POST',
    headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({messaging_product:'whatsapp',recipient_type:'individual',to,type:'text',text:{preview_url:false,body:text}}),
    signal:AbortSignal.timeout(12000)
  });
  // Never put third-party error bodies or message content into logs.
  if(!r.ok)throw Error('meta_send_failed');
}
export async function handleEvent(data,{allowed,phoneId,token,enabled,fetchImpl}){
  if(data?.object!=='whatsapp_business_account'||!enabled||!phoneId||!token)return 0;
  const allowlist=new Set(String(allowed||'').split(',').map(x=>x.trim().replace(/^\+/,'')).filter(x=>NUMBER.test(x)));
  if(!allowlist.size)return 0;
  let sent=0;
  for(const entry of(data.entry||[]).slice(0,2))for(const change of(entry.changes||[]).slice(0,2)){
    if(change.field!=='messages'||String(change.value?.metadata?.phone_number_id||'')!==String(phoneId))continue;
    for(const msg of(change.value.messages||[]).slice(0,3)){
      const to=String(msg.from||'').replace(/^\+/,'');
      if(!allowlist.has(to)||msg.type!=='text'||typeof msg.text?.body!=='string')continue;
      const answer=makeReply(msg.text.body);
      if(!answer)continue;
      try{await sendText({to,text:answer,phoneId,token,fetchImpl});sent++}
      catch{/* Acknowledge signed webhook to prevent retry storms. No private logs. */}
    }
  }
  return sent;
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method==='GET'){
    const verify=process.env.PHOENIX_WA_VERIFY_TOKEN;
    if(!verify)return res.status(503).send('Not configured');
    if(query(req,'hub.mode')!=='subscribe'||!equal(query(req,'hub.verify_token'),verify)||!query(req,'hub.challenge')||query(req,'hub.challenge').length>256)
      return res.status(403).send('Forbidden');
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    return res.status(200).send(query(req,'hub.challenge'));
  }
  if(req.method!=='POST')return res.status(405).send('Method not allowed');
  const secret=process.env.PHOENIX_WA_META_APP_SECRET;
  if(!secret)return res.status(503).send('Not configured');
  if(!String(req.headers?.['content-type']||'').startsWith('application/json'))return res.status(415).send('Unsupported media type');
  let raw;try{raw=await rawBody(req)}catch{return res.status(413).send('Payload too large')}
  if(!verifySignature(raw,req.headers?.['x-hub-signature-256'],secret))return res.status(403).send('Forbidden');
  let data;try{data=JSON.parse(raw.toString('utf8'))}catch{return res.status(400).send('Invalid JSON')}
  try{await handleEvent(data,{
    allowed:process.env.PHOENIX_WA_ALLOWED_TEST_NUMBERS,
    phoneId:process.env.PHOENIX_WA_PHONE_NUMBER_ID,
    token:process.env.PHOENIX_WA_ACCESS_TOKEN,
    enabled:process.env.PHOENIX_WA_SEND_ENABLED==='true'
  })}catch{/* no event contents logged */}
  return res.status(200).send('EVENT_RECEIVED');
}
