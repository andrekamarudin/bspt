"use strict";
(()=>{
const ORIGIN="https://jgkmjeorlkdpsptatuhc.supabase.co/functions/v1/";
const url=ORIGIN+"genai-course-admin/signups", bootstrap=ORIGIN+"genai-course-bootstrap";
const login=document.getElementById("login"),setup=document.getElementById("setup"),dashboard=document.getElementById("dashboard"),status=document.getElementById("status");
const fragment=new URLSearchParams(location.hash.substring(1)),setupToken=fragment.get("setup");
let password=fragment.get("key")||sessionStorage.getItem("ai-discovery-admin")||"", records=[],partialRecords=[];
history.replaceState(null,"",location.pathname+location.search);
function say(t,failed=false){status.textContent=t;status.classList.toggle("error",failed);}
const labels={beginner:"Beginner",intermediate:"Intermediate",advanced:"Advanced"};
const obstacles={possibilities:"Unaware of possibilities",trust:"Unreliable answers",setup:"Complex setup",privacy:"Privacy",time:"Time",approval:"Workplace restrictions",results:"Hard to get working results",roi:"Unclear savings"};
function stat(name,num){let el=document.createElement("div");el.className="stat";const b=document.createElement("strong");b.textContent=num;const s=document.createElement("span");s.textContent=name;el.append(b,s);return el;}
function tally(array){let c={};for(const a of array)if(a)c[a]=(c[a]||0)+1;return c;}
function summary(id,values){const root=document.getElementById(id);root.replaceChildren();const list=Object.entries(values).sort((a,b)=>b[1]-a[1]).slice(0,18);const max=list.length?list[0][1]:1;for(const [name,count] of list){const el=document.createElement("div");el.className="list-stat";const b=document.createElement("strong");b.textContent=name;const s=document.createElement("small");s.textContent=String(count);const line=document.createElement("div");line.className="strip";const fill=document.createElement("i");fill.style.width=String(100*count/max)+"%";line.append(fill);el.append(b,s,line);root.append(el);}if(!list.length)root.append(stat("No data yet","0"));}
function render(data,partials=[]){records=data;partialRecords=partials;login.hidden=true;setup.hidden=true;dashboard.hidden=false;document.getElementById("stats").replaceChildren(stat("Signups",data.length),stat("Marketing opt-ins",data.filter(x=>x.marketing_consent).length),stat("Heart votes",data.reduce((sum,x)=>sum+Object.values(x.topic_preferences||{}).filter(v=>v==="love").length,0)));
summary("track-stats",tally(data.map(x=>labels[x.track]||x.track)));
const topics={};for(const r of data)for(const [k,v] of Object.entries(r.topic_preferences||{}))if(v==="like"||v==="love")topics[k.toUpperCase()]=(topics[k.toUpperCase()]||0)+(v==="love"?2:1);
summary("topic-stats",topics);
const responseHurdles=x=>Array.isArray(x.biggest_hurdles)&&x.biggest_hurdles.length?x.biggest_hurdles:(x.biggest_hurdle?[x.biggest_hurdle]:[]);
const labelHurdles=x=>[...responseHurdles(x).map(y=>obstacles[y]||y),...(x.hurdle_other?.trim()?["Other: "+x.hurdle_other.trim()]:[])].join(", ");
summary("hurdle-stats",tally(data.flatMap(x=>[...responseHurdles(x).map(h=>obstacles[h]||h),...(x.hurdle_other?.trim()?["Other"]:[])])));
const body=document.getElementById("rows");body.replaceChildren();for(const r of data){const vals=[new Date(r.created_at).toLocaleString("en-SG"),r.first_name,r.email,labels[r.track]||r.track,Object.entries(r.topic_preferences||{}).filter(x=>x[1]!=="nope").map(x=>x[0]+": "+x[1]).join(", "),labelHurdles(r),r.valuable_problem||"",r.feedback||"",r.marketing_consent?"Yes":"No"];const row=document.createElement("tr");for(const v of vals){const td=document.createElement("td");td.textContent=String(v);row.append(td);}body.append(row);}
const stats=document.getElementById("partial-stats");
stats.replaceChildren(stat("Incomplete responses",partials.length),stat("Reached topic cards",partials.filter(x=>x.step>=4).length),stat("Topic ratings",partials.reduce((n,x)=>n+Object.keys(x.topic_preferences||{}).length,0)));
const partBody=document.getElementById("partial-rows");partBody.replaceChildren();
for(const r of partials){const vals=[new Date(r.updated_at).toLocaleString("en-SG"),"Step "+r.step,r.experience||"",Array.isArray(r.capabilities)?r.capabilities.join(", "):"",labels[r.track]||r.track||"",Object.entries(r.topic_preferences||{}).map(x=>x[0]+": "+x[1]).join(", "),labelHurdles(r),r.valuable_problem||"",r.feedback||""];const row=document.createElement("tr");for(const v of vals){const td=document.createElement("td");td.textContent=String(v);row.append(td);}partBody.append(row);}
}
async function load(){if(!password){login.hidden=false;dashboard.hidden=true;return;}say("Checking admin access...");try{const response=await fetch(url,{method:"POST",headers:{"x-admin-password":password,"content-type":"application/json"},body:"{}"});const value=await response.json();if(!response.ok)throw new Error(value.error||"Access denied");sessionStorage.setItem("ai-discovery-admin",password);render(value.data||[],value.partials||[]);say("Updated "+new Date().toLocaleString("en-SG"));}catch(e){say(String(e.message||e),true);password="";sessionStorage.removeItem("ai-discovery-admin");login.hidden=false;dashboard.hidden=true;}}
document.getElementById("login-form").addEventListener("submit",e=>{e.preventDefault();password=document.getElementById("password").value;load();});
document.getElementById("refresh").addEventListener("click",load);
document.getElementById("lock").addEventListener("click",()=>{password="";sessionStorage.removeItem("ai-discovery-admin");login.hidden=false;dashboard.hidden=true;say("Locked.");});
document.getElementById("csv").addEventListener("click",()=>{if(!records.length)return;const cols=["created_at","first_name","email","track","experience","capability","capabilities","topic_preferences","biggest_hurdle","biggest_hurdles","hurdle_other","valuable_problem","feedback","marketing_consent"];const esc=x=>'"'+String(typeof x==="object"?JSON.stringify(x):x??"").replaceAll('"','""')+'"';const csv=cols.join(",")+"\r\n"+records.map(x=>cols.map(k=>esc(x[k])).join(",")).join("\r\n");const link=document.createElement("a");const u=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));link.href=u;link.download="ai-discovery-interest.csv";link.click();setTimeout(()=>URL.revokeObjectURL(u),500);});
document.getElementById("partial-csv").addEventListener("click",()=>{
 if(!partialRecords.length)return;
 const cols=["updated_at","session_id","step","experience","capabilities","track","topic_preferences","biggest_hurdle","biggest_hurdles","hurdle_other","valuable_problem","feedback"];
 const esc=x=>'"'+String(typeof x==="object"?JSON.stringify(x):x??"").replaceAll('"','""')+'"';
 const csv=cols.join(",")+"\r\n"+partialRecords.map(x=>cols.map(k=>esc(x[k])).join(",")).join("\r\n");
 const link=document.createElement("a");const u=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));link.href=u;link.download="ai-discovery-incomplete.csv";link.click();setTimeout(()=>URL.revokeObjectURL(u),500);
});
document.getElementById("setup-form").addEventListener("submit",async e=>{e.preventDefault();const secret=document.getElementById("setup_password").value;if(!/^[a-zA-Z0-9]{24}$/.test(secret)){say("Password must be 24 letters/numbers.",true);return;}say("Activating...");try{const response=await fetch(bootstrap,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({setup_code:setupToken,password:secret})});if(!response.ok)throw Error("Setup failed: "+response.status);password=secret;say("Activated.");load();}catch(err){say(String(err),true);}});
if(setupToken){login.hidden=true;setup.hidden=false;}else if(password)load();
})();