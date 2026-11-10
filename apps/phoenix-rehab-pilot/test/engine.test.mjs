import test from "node:test";
import assert from "node:assert/strict";
import {respond,CLINICS,SOURCES,TEST_CASES} from "../engine.mjs";
for (const example of TEST_CASES) {
 test("fixture: "+example.input,()=>{
  const r=respond(example.input);
  assert.equal(r.category,example.category);
  assert.ok(r.text.toLowerCase().includes(example.include.toLowerCase()),"Expected "+example.include+" in "+r.text);
 });
}
test("all five clinics have unique official calendar paths and contact routes",()=>{
 assert.equal(CLINICS.length,5);
 assert.equal(new Set(CLINICS.map(c=>c.calendar)).size,5);
 for(const c of CLINICS){assert.ok(c.address.includes("Singapore"));assert.match(c.calendar,/^https:\/\/phoenixrehabgroup\.com\/calendar\//);assert.match(c.phone,/^65\d{8}$/);}
});
test("a selected clinic remains selected for followup bookings",()=>{
 const initial=respond("Orchard");
 const followup=respond("Can I get an appointment tomorrow?",initial.state);
 assert.equal(followup.category,"booking");
 assert.equal(followup.state.branch,"orchard");
 assert.ok(followup.links.some(l=>l.url.endsWith("/calendar/orchard/wa")));
});
test("no slot time or appointment confirmation is invented",()=>{
 for(const input of ["Can I book Shiv at 2pm tomorrow?","Any clinic","Book Serangoon on Monday"]){
  const x=respond(input);
  assert.ok(!/confirmed for you|I have booked|available at 2pm/i.test(x.text));
 }
});
test("multiple constraints are respected in one question",()=>{
 const r=respond("Can I book Shiv for 1 hour?");
 assert.equal(r.state.therapist,"Shiv");
 assert.match(r.text,/one-hour/i);
 assert.match(r.text,/45 minutes/i);
});
test("conversation state does not retain messages or sensitive text",()=>{
 const r=respond("book Orchard",{previousMessage:"my private medical record",untrusted:"secret"});
 assert.deepEqual(Object.keys(r.state).sort(),["branch","intent","therapist"]);
 assert.ok(!JSON.stringify(r.state).includes("secret"));
});
test("handoff uses branch direct line and never automatically sends",()=>{
 const r=respond("Speak to a person",{branch:"tampines"});
 assert.equal(r.category,"handoff");
 assert.ok(r.links.some(x=>x.url.startsWith("https://wa.me/6587809608?text=")));
});
test("unknown answers are safe fallbacks",()=>{
 const r=respond("Can you show me xray files and diagnose?");
 assert.ok(["unknown","care"].includes(r.category));
 assert.ok(!/you have a|diagnosed with/i.test(r.text));
});
test("source links use https only",()=>{
 for(const s of Object.values(SOURCES))assert.ok(s.startsWith("https://"));
});
test("message length is capped without reflecting private text",()=>{
 const msg="secret".repeat(200);
 const r=respond(msg);
 assert.equal(r.category,"privacy");
 assert.ok(!r.text.includes(msg));
});
