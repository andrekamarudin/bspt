import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {Readable} from 'node:stream';
import handler,{verifySignature,makeReply,handleEvent} from '../api/whatsapp.mjs';

const signature=(b,key='test-secret')=>'sha256='+createHmac('sha256',key).update(b).digest('hex');
function req(method,body='',url='/api/whatsapp',sig=''){
  const stream=Readable.from(body?[Buffer.from(body)]:[]);
  stream.method=method;stream.url=url;stream.headers={'content-type':'application/json','x-hub-signature-256':sig};
  return stream;
}
function response(){return{code:200,text:null,setHeader(){},status(n){this.code=n;return this},send(s){this.text=s;return this}}}
function sample(number='6598887777'){
  return{object:'whatsapp_business_account',entry:[{changes:[{field:'messages',value:{
    metadata:{phone_number_id:'1234567890123456'},
    messages:[{from:number,type:'text',text:{body:'What is the price?'}}]
  }}]}]};
}

test('handshake echoes challenge only with correct configured token',async()=>{
  const old=process.env.PHOENIX_WA_VERIFY_TOKEN;
  process.env.PHOENIX_WA_VERIFY_TOKEN='verify-test';
  try{
    const ok=response();await handler(req('GET','','/api/whatsapp?hub.mode=subscribe&hub.verify_token=verify-test&hub.challenge=12345'),ok);
    assert.equal(ok.code,200);assert.equal(ok.text,'12345');
    const bad=response();await handler(req('GET','','/api/whatsapp?hub.mode=subscribe&hub.verify_token=bad&hub.challenge=12345'),bad);
    assert.equal(bad.code,403);
  }finally{if(old===undefined)delete process.env.PHOENIX_WA_VERIFY_TOKEN;else process.env.PHOENIX_WA_VERIFY_TOKEN=old}
});
test('signature uses raw bytes and rejects tampering',()=>{
  const b=Buffer.from(JSON.stringify(sample()));
  assert.equal(verifySignature(b,signature(b),'test-secret'),true);
  assert.equal(verifySignature(Buffer.from('{}'),signature(b),'test-secret'),false);
  assert.equal(verifySignature(b,'sha256=0','test-secret'),false);
});
test('POST signed event is acknowledged and bad signature rejected',async()=>{
  const old=process.env.PHOENIX_WA_META_APP_SECRET;
  process.env.PHOENIX_WA_META_APP_SECRET='test-secret';
  try{
    const body=JSON.stringify(sample());
    const good=response();await handler(req('POST',body,'/api/whatsapp',signature(body)),good);
    assert.equal(good.code,200);assert.equal(good.text,'EVENT_RECEIVED');
    const bad=response();await handler(req('POST',body,'/api/whatsapp',signature('wrong')),bad);
    assert.equal(bad.code,403);
  }finally{if(old===undefined)delete process.env.PHOENIX_WA_META_APP_SECRET;else process.env.PHOENIX_WA_META_APP_SECRET=old}
});
test('strict opt-in allowlist and no-send mode',async()=>{
  const calls=[];
  const options={allowed:'6598887777',phoneId:'1234567890123456',token:'not-real',enabled:true,fetchImpl:async(url,opts)=>{
    calls.push({url,payload:JSON.parse(opts.body)});return {ok:true};
  }};
  assert.equal(await handleEvent(sample(),options),1);
  assert.equal(calls.length,1);
  assert.match(calls[0].payload.text.body,/S\$230/);
  assert.equal(await handleEvent(sample('6591231234'),options),0);
  assert.equal(await handleEvent(sample(),{...options,enabled:false}),0);
  assert.equal(await handleEvent(sample(),{...options,phoneId:'1234'}),0);
  assert.equal(calls.length,1);
});
test('WhatsApp privacy answer does not claim browser-only processing',()=>{
  assert.match(makeReply('Do you store medical reports?'),/do not send patient identifiers/i);
  assert.doesNotMatch(makeReply('Do you store medical reports?'),/browser tab/i);
});
