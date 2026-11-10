// Phoenix Rehab parallel-running demo. Public facts only; no patient records or bookings.
export const SOURCES = Object.freeze({
  faq:"https://phoenixrehabgroup.com/about/patient-info-faq/",
  team:"https://phoenixrehabgroup.com/team/",
  clinics:"https://phoenixrehabgroup.com/clinics/",
  globalBooking:"https://hbp.sgimed.com/l/_5wgE2UA",
  medicalCertificate:"https://phoenixrehabgroup.com/ankle-dislocation-first-aid-treatment-and-rehabilitation/"
});
export const CLINICS = Object.freeze([
  {id:"orchard",name:"Orchard",address:"400 Orchard Road #12-12, Orchard Towers, Singapore 238875",phone:"6588001830",calendar:"https://phoenixrehabgroup.com/calendar/orchard/wa"},
  {id:"tampines",name:"Tampines",address:"9 Tampines Grande #01-20, Asia Green, Singapore 528735",phone:"6587809608",calendar:"https://phoenixrehabgroup.com/calendar/tampines/wa"},
  {id:"serangoon",name:"Serangoon",address:"265 Serangoon Central Drive #04-269 (Lift C), Singapore 550265",phone:"6588924121",calendar:"https://phoenixrehabgroup.com/calendar/serangoon/wa"},
  {id:"tanjong-pagar",name:"Tanjong Pagar",address:"10 Anson Road #02-77A, International Plaza, Singapore 079903",phone:"6582277074",calendar:"https://phoenixrehabgroup.com/calendar/tanjongpagar/wa"},
  {id:"jurong-east",name:"Jurong East",address:"2 Venture Drive #02-02, Vision Exchange, Singapore 608526",phone:"6582427340",calendar:"https://phoenixrehabgroup.com/calendar/jurong/wa"}
]);
const standard=()=>[{label:"Book an appointment",prompt:"I'd like to book"},{label:"Pricing",prompt:"How much does it cost?"},{label:"Talk to the clinic",prompt:"Speak to a person"}];
const branchOptions=()=>[...CLINICS.map(c=>({label:c.name,prompt:c.name})),{label:"Any clinic",prompt:"Any clinic"}];
const wa=(clinic,message)=>"https://wa.me/"+clinic.phone+"?text="+encodeURIComponent(message||"Hi Phoenix Rehab, could someone help with my enquiry?");
const selected=(state)=>CLINICS.find(x=>x.id===state?.branch)||null;
const clean=(x)=>String(x??"").trim().toLowerCase().replace(/\s+/g," ");
const byName=(x)=>{
 if(/\b(jurong|westgate|vision exchange|clementi|bukit batok)\b/.test(x))return CLINICS[4];
 if(/\b(tanjong\s*pagar|international plaza|anson)\b/.test(x))return CLINICS[3];
 if(/\b(serangoon|nex)\b/.test(x))return CLINICS[2];
 if(/\b(tampines|asia green)\b/.test(x))return CLINICS[1];
 if(/\b(orchard|orchard towers)\b/.test(x))return CLINICS[0];
 return null;
};
const linked=(label,url)=>({label,url});
function result(text,state={},buttons=standard(),links=[],category="general",source=null){
 return {text,buttons,links,category,state,source};
}
function human(state,why=""){
 const c=selected(state)||CLINICS[0];
 const msg="Hi Phoenix Rehab. "+(why||"I'd like a human to help with my enquiry.")+(state.therapist?" Preferred therapist: "+state.therapist+".":"");
 return result("Of course. I can help with general information, but staff can confirm your individual request. This opens a message for the clinic; it does not send automatically.",state,branchOptions(),[linked("Message "+c.name+" clinic",wa(c,msg)),linked("All clinic contacts",SOURCES.clinics)],"handoff",SOURCES.clinics);
}
export function respond(raw,previous={}){
 const q=clean(raw);const state={branch:previous.branch||null,therapist:previous.therapist||null,intent:previous.intent||null};
 if(!q)return result("Tell me what you need help with, or choose one of the options below.",state);
 if(q.length>600)return result("That is a lot of detail. For privacy, please avoid sharing medical records here. Ask a short general question, or contact a clinician directly.",state,[{label:"Speak to a person",prompt:"Speak to a person"}],[linked("Clinic contacts",SOURCES.clinics)],"privacy");
 if(/\b(chest pain|difficulty breathing|can't breathe|cannot breathe|stroke|sudden weakness|severe bleeding|suicid|emergency|unconscious|loss of bladder|loss of bowel)\b/.test(q)){
  return result("This may need urgent medical assessment. Please do not rely on this demo for emergencies. In Singapore, call 995 for an ambulance if there is immediate danger, or seek urgent medical care.",state,[],[linked("Singapore emergency guidance","https://www.scdf.gov.sg/home/about-scdf/emergency-medical-services")],"safety");
 }
 if(/\b(reset|start over|new conversation)\b/.test(q))return result("Conversation reset. What would you like to do?",{branch:null,therapist:null,intent:null});
 const c=byName(q);
 if(c)state.branch=c.id;
 if(/\b(shiv|louise|nigel|fairuuz|zita|nurul|shamaine|mavis|ching yee|yuna)\b/.test(q)){
  const m=q.match(/\b(shiv|louise|nigel|fairuuz|zita|nurul|shamaine|mavis|ching yee|yuna)\b/);state.therapist=m[0].replace(/\b\w/g,x=>x.toUpperCase());
  state.intent="booking";
  const duration=/\b(60.min|60 min|one.hour|1.hour|longer session|hour.long)\b/.test(q)?" You also asked for a one-hour session: the published standard is 45 minutes, and only the clinic can confirm a longer appointment.":"";
  return result("You prefer "+state.therapist+". I'll keep that preference in this conversation. I cannot check an individual therapist's real-time diary yet."+duration+" Use Phoenix's booking calendar to find a slot, or ask the clinic to match you.",state,[{label:"Any clinic",prompt:"Any clinic"},{label:"Ask about this therapist",prompt:"Speak to a person"}],[linked("Live clinic booking",SOURCES.globalBooking),linked("See the team",SOURCES.team)],"booking",SOURCES.team);
 }
 if(/\b(mc\b|medical certificate|sick leave|medical leave|work excuse)\b/.test(q)){
  return result("A medical certificate (MC) must come from a doctor; Phoenix's physiotherapists and hand therapists do not issue MCs. The clinic can discuss a functional report for your doctor or employer. Please ask staff what document would suit your case.",state,[{label:"Speak to a person",prompt:"Speak to a person"},{label:"Book a visit",prompt:"I'd like to book"}],[linked("Phoenix's MC guidance",SOURCES.medicalCertificate)],"faq",SOURCES.medicalCertificate);
 }
 if(/\b(60.min|60 min|one.hour|1.hour|longer session|hour.long)\b/.test(q)){
  return result("Phoenix publicly lists standard 45-minute physiotherapy and hand therapy appointments. I cannot confirm whether an extended 60-minute appointment can be arranged, so please ask clinic staff rather than assuming it is available.",state,[{label:"Ask the clinic",prompt:"Speak to a person"},{label:"Standard booking",prompt:"I'd like to book"}],[linked("Appointment information",SOURCES.faq)],"faq",SOURCES.faq);
 }
 if(/\b(price|pricing|cost|fee|rate|charge|expensive|how much|package)\b/.test(q)){
  return result("Phoenix's published price is S$230 nett for each 45-minute physiotherapy or hand therapy appointment, including the first assessment and treatment. No GST, no mandatory prepaid package. Splints and some add-ons are separately priced.",state,[{label:"Book a session",prompt:"I'd like to book"},{label:"Insurance claims",prompt:"Can I claim insurance?"}],[linked("Verified pricing and FAQs",SOURCES.faq)],"faq",SOURCES.faq);
 }
 if(/\b(insurance|claim|invoice|receipt|paynow|medisave|payment)\b/.test(q)){
  return result("Insurance depends on your own policy. Phoenix provides an itemised invoice and can discuss a report if your insurer requests one. Ask your insurer about referral requirements, benefit limits, and direct billing before booking. Published payment methods include cards, PayNow and NETS.",state,[{label:"Ask clinic staff",prompt:"Speak to a person"},{label:"Book a visit",prompt:"I'd like to book"}],[linked("Payment and insurance FAQ",SOURCES.faq)],"faq",SOURCES.faq);
 }
 if(/\b(cancel|reschedul|postpone|change my booking|change appointment|refund|late)\b/.test(q)){
  return result("Phoenix asks for at least 24 hours' notice when cancelling or rescheduling. Its published policy says later cancellations may incur the full appointment fee, with exceptions for genuinely unforeseen situations. Please contact the clinic directly to make changes; this demo cannot change bookings.",state,[{label:"Talk to staff",prompt:"Speak to a person"}],[linked("Cancellation policy",SOURCES.faq)],"faq",SOURCES.faq);
 }
 if(/\b(remind(?:er|ers|ing|s)?|no.show|follow.up|automated messages?|notifications?)\b/.test(q)){
  return result("This is a parallel web pilot. It does not send WhatsApp reminders, send follow-ups, or access patient bookings. Phoenix's existing booking and messaging system remains the operational source of truth until an authorised integration is tested.",state,[{label:"Book a visit",prompt:"I'd like to book"},{label:"Talk to staff",prompt:"Speak to a person"}],[],"pilot");
 }
 if(/\b(privacy|store|record|data|confidential|personal information)\b/.test(q)){
  return result("This pilot does not transmit your messages to a chatbot server or store them remotely. Chat stays in this browser tab only and disappears when you close or refresh it. Do not share personal identifiers, medical reports, photos or sensitive clinical information.",state,[{label:"What can this demo do?",prompt:"What can this demo do?"}],[],"privacy");
 }
 if(/\b(first visit|first appointment|what to bring|wear|referral|arrive|prepar|do i need a doctor)\b/.test(q)){
  return result("For your first appointment, arrive 10–15 minutes early and wear comfortable clothes that expose the area being treated. Bring any referral, scan or operation notes you have. A doctor's referral is not required to book, although your insurer may require one for claims.",state,[{label:"Book my visit",prompt:"I'd like to book"}],[linked("First-visit guidance",SOURCES.faq)],"faq",SOURCES.faq);
 }
 if(/\b(physio|hand therap|sports injur|wrist|knee|shoulder|back pain|injur|pain|rehab|surgery|splint|who should i see)\b/.test(q)){
  return result("Phoenix provides physiotherapy and hand therapy for musculoskeletal problems and recovery after injury or surgery. I can't diagnose or match a therapist safely from symptoms in a demo. Their team can recommend the right clinician after asking some questions.",state,[{label:"Meet the therapists",prompt:"Who's on the team?"},{label:"Book an assessment",prompt:"I'd like to book"},{label:"Talk to staff",prompt:"Speak to a person"}],[linked("Phoenix services",SOURCES.clinics)],"care",SOURCES.clinics);
 }
 if(/\b(therapist|team|who works|staff|doctor)\b/.test(q)){
  return result("Phoenix has physiotherapists and hand therapists. See the published team profiles for qualifications and interests. If you have someone in mind, enter their name (for example, Shiv) and I can help you ask for them.",state,[{label:"Book an appointment",prompt:"I'd like to book"}],[linked("Meet the team",SOURCES.team)],"faq",SOURCES.team);
 }
 if(/\b(location|address|nearest|directions|where|mrt|branch|hours|open|weekend|saturday|sunday)\b/.test(q)){
  if(c)return result(c.name+" clinic: "+c.address+". For current opening hours, check the clinic page or ask staff; appointments depend on live availability.",state,[{label:"Check appointments",prompt:"I'd like to book"},{label:"Ask the clinic",prompt:"Speak to a person"}],[linked("Book "+c.name,c.calendar),linked("Clinic directory",SOURCES.clinics)],"location",SOURCES.clinics);
  return result("Phoenix lists five clinics: Orchard, Tampines, Serangoon, Tanjong Pagar and Jurong East. Choose one and I can show its address and booking link.",state,branchOptions(),[linked("Clinic locations",SOURCES.clinics)],"location",SOURCES.clinics);
 }
 if(/\b(any clinic|any location|wherever|first available|soonest|earliest)\b/.test(q)){
  state.branch=null;state.intent="booking";
  return result("The all-clinics booking calendar lets you compare real slots across branches. I cannot see or reserve availability inside this demo, so please confirm there.",state,[{label:"Choose a branch",prompt:"Find an appointment"},{label:"Talk to staff",prompt:"Speak to a person"}],[linked("Open live all-clinics calendar",SOURCES.globalBooking)],"booking");
 }
 if(/\b(book|appointment|availability|available|slot|calendar|visit|date|today|tomorrow|next week|friday|monday|tuesday|wednesday|thursday)\b/.test(q)){
  state.intent="booking";
  if(selected(state)){
   const s=selected(state);
   return result("You selected "+s.name+". You can check current openings in its official booking calendar. The booking is only confirmed when Phoenix's system confirms it; this pilot does not hold slots.",state,[{label:"Change branch",prompt:"Which clinics do you have?"},{label:"Speak to a person",prompt:"Speak to a person"}],[linked("Open "+s.name+" booking",s.calendar),linked("Compare all clinics",SOURCES.globalBooking)],"booking");
  }
  return result("Happy to help you get to a booking. Which clinic works best? Or choose 'Any clinic' to compare all five live calendars.",state,branchOptions(),[linked("Compare all clinics",SOURCES.globalBooking)],"booking");
 }
 if(c){
  return result(c.name+" is at "+c.address+". Check its official calendar for real availability, or message staff with your question.",state,[{label:"Book "+c.name,prompt:"I'd like to book"},{label:"Talk to staff",prompt:"Speak to a person"}],[linked("Official booking",c.calendar),linked("Message the clinic",wa(c))],"location",SOURCES.clinics);
 }
 if(/\b(human|person|agent|staff|reception|front desk|call|whatsapp|speak)\b/.test(q))return human(state,"Could a team member help?");
 if(/\b(hi|hello|hey|good morning|good evening)\b/.test(q))return result("Hello! I'm the Phoenix Rehab web-pilot assistant. I can help with general FAQs, find the right booking calendar, and guide you to a person. What would you like to do?",state);
 if(/\b(demo|pilot|test|can you do|what can you do)\b/.test(q))return result("I can answer verified clinic FAQs, help you choose from five branches, point you to live bookings, and offer human handoff. I cannot diagnose, view appointment slots, book for you, send reminders or access patient records. That is intentional for this risk-free pilot.",state);
 return result("I don't have a verified answer to that yet, and I don't want to guess. You can ask a shorter clinic logistics question, check Phoenix's FAQs, or speak directly to the team.",state,[{label:"Speak to a person",prompt:"Speak to a person"},{label:"Book an appointment",prompt:"I'd like to book"},{label:"Pricing",prompt:"How much does it cost?"}],[linked("Official FAQ",SOURCES.faq)],"unknown");
}
export const TEST_CASES=[
 {input:"Can you issue an MC for tomorrow?",category:"faq",include:"doctor"},
 {input:"Do you have a one-hour appointment?",category:"faq",include:"45-minute"},
 {input:"What does it cost?",category:"faq",include:"S$230"},
 {input:"I want to book",category:"booking",include:"Which clinic"},
 {input:"Any clinic",category:"booking",include:"all-clinics"},
 {input:"My chest hurts, can't breathe",category:"safety",include:"995"},
 {input:"Can I claim insurance?",category:"faq",include:"policy"},
 {input:"Do you send reminders?",category:"pilot",include:"does not send"},
 {input:"Do you store medical reports?",category:"privacy",include:"does not transmit"}
];
