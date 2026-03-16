"use strict";(()=>{var e={};e.id=6810,e.ids=[6810],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},55315:e=>{e.exports=require("path")},68621:e=>{e.exports=require("punycode")},86624:e=>{e.exports=require("querystring")},76162:e=>{e.exports=require("stream")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},6162:e=>{e.exports=require("worker_threads")},71568:e=>{e.exports=require("zlib")},87561:e=>{e.exports=require("node:fs")},84492:e=>{e.exports=require("node:stream")},72477:e=>{e.exports=require("node:stream/web")},30188:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>x,patchFetch:()=>O,requestAsyncStorage:()=>g,routeModule:()=>h,serverHooks:()=>y,staticGenerationAsyncStorage:()=>f});var n={};r.r(n),r.d(n,{POST:()=>m});var a=r(49303),s=r(88716),i=r(60670),o=r(87070),u=r(75571),l=r(90455),c=r(47689),p=r(72331),d=r(50650);async function m(e){try{let t=await (0,u.getServerSession)(l.L);if(!t?.user?.email)return o.NextResponse.json({error:"Unauthorized"},{status:401});let{existingQuestions:r,context:n}=await e.json(),a=await p._.user.findUnique({where:{email:t.user.email}}),s=a?.customApiKey?(0,d.pe)(a.customApiKey):null,i=await (0,c.ob)(r,n,s);return o.NextResponse.json(i)}catch(e){return o.NextResponse.json({error:e.message||"Internal error"},{status:500})}}let h=new a.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/ai/suggest-questions/route",pathname:"/api/ai/suggest-questions",filename:"route",bundlePath:"app/api/ai/suggest-questions/route"},resolvedPagePath:"D:\\Feed-mind-2\\frontend\\app\\api\\ai\\suggest-questions\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:g,staticGenerationAsyncStorage:f,serverHooks:y}=h,x="/api/ai/suggest-questions/route";function O(){return(0,i.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:f})}},47689:(e,t,r)=>{r.d(t,{Vx:()=>p,iF:()=>m,fh:()=>l,uL:()=>d,ob:()=>c});var n=r(34534);let a=(process.env.NLP_API_URL||"http://localhost:8000").replace(/\/$/,"");async function s(e,t=3,r){let n={feedback_text:e.trim(),rating:Math.max(1,Math.min(5,Math.round(t)))};r&&(n.category=r);let s=await fetch(`${a}/analyze-feedback`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n),signal:AbortSignal.timeout(3e4)});if(!s.ok){let e=s.statusText;try{let t=await s.json();e=t?.detail?.message??t?.message??e}catch{}throw Error(`NLP API ${s.status}: ${e}`)}return s.json()}async function i(e,t=5){let r=Array(e.length);for(let n=0;n<e.length;n+=t){let a=e.slice(n,n+t);(await Promise.all(a.map(e=>s(e.text,e.rating??3,e.category)))).forEach((e,t)=>{r[n+t]=e})}return r}async function o(e,t,r=.7){let a=(t||process.env.GROQ_API_KEY||"").trim();if(!a)throw Error("No Groq API key configured. Add GROQ_API_KEY to .env.local or set one in your profile.");let s=new n.ZP({apiKey:a}),i=await s.chat.completions.create({messages:[{role:"user",content:e}],model:"llama-3.3-70b-versatile",temperature:r});return i.choices[0]?.message?.content||""}function u(e){let t=e.match(/\{[\s\S]*\}|\[[\s\S]*\]/);return t?t[0]:e.trim()}async function l(e,t){return JSON.parse(u(await o(`You are a form builder AI. Based on the following description, generate a feedback form.
Return a JSON object with this exact structure:
{
  "title": "Form Title",
  "description": "Form description",
  "questions": [
    {
      "type": "SHORT_TEXT" | "LONG_TEXT" | "MULTIPLE_CHOICE" | "CHECKBOX" | "DROPDOWN" | "RATING" | "NPS" | "DATE" | "FILE_UPLOAD" | "LINEAR_SCALE" | "YES_NO",
      "label": "Question text",
      "placeholder": "Optional placeholder",
      "required": true/false,
      "options": ["option1", "option2"]
    }
  ]
}

User's description: ${e}

Return ONLY valid JSON, no markdown, no explanation.`,t,.7)))}async function c(e,t,r){return JSON.parse(u(await o(`You are a form builder AI. Given these existing questions for a form about "${t}":
${e.map((e,t)=>`${t+1}. ${e}`).join("\n")}

Suggest 3 additional questions that would improve this form. Return a JSON array:
[
  {
    "type": "SHORT_TEXT" | "LONG_TEXT" | "MULTIPLE_CHOICE" | "CHECKBOX" | "DROPDOWN" | "RATING" | "NPS" | "DATE" | "LINEAR_SCALE" | "YES_NO",
    "label": "Question text",
    "placeholder": "Optional placeholder",
    "required": true/false,
    "options": ["option1", "option2"]
  }
]

Return ONLY valid JSON.`,r,.7)))}async function p(e,t,r){let n=t.flatMap(e=>(e.answers??[]).filter(e=>"string"==typeof e.answer&&e.answer.trim())),a="neutral",s=[];if(n.length>0){let e=n.map(e=>({text:e.answer}));try{let t=await i(e),r={positive:0,neutral:0,negative:0};for(let e of t)r[e.sentiment]++;a=Object.entries(r).sort((e,t)=>t[1]-e[1])[0][0],s=t.map(e=>e.suggestion).filter(Boolean),Array.from(new Set(t.flatMap(e=>e.keywords)))}catch(e){}}let l=s.length>0?`

The AI model already produced these per-answer improvement suggestions:
${s.map((e,t)=>`${t+1}. ${e}`).join("\n")}`:"";return JSON.parse(u(await o(`Analyze these responses for the form "${e}":
${JSON.stringify(t,null,2)}${l}

The overall sentiment determined by the trained model is: ${a}

Return a JSON object:
{
  "keyThemes": ["theme1", "theme2"],
  "commonComplaints": ["complaint1", "complaint2"],
  "actionableSuggestions": ["suggestion1", "suggestion2"],
  "sentimentSummary": "Overall sentiment description",
  "overallSentiment": "positive" | "neutral" | "negative"
}

Return ONLY valid JSON, no markdown.`,r,.3)))}async function d(e,t,r){let n=e.map((e,r)=>({question:e,answer:t[r]||""}));return JSON.parse(u(await o(`You are an expert data analyst and AI detector. Analyze the following survey response to determine the Integrity Score.

The Integrity Score (0-100) reflects two things:
1. Respondent Engagement: Did they read and answer thoughtfully?
2. Authenticity: Is the text human-written or AI-generated?

Scoring Rules:
- High Score (80-100): Detailed, authentic, consistent, human-sounding answers.
- Medium Score (50-79): Acceptable but short answers, or slight AI-sounding phrasing.
- Low Score (0-49): One-word answers, gibberish, contradictions, OR highly probable AI-generated content.

Response JSON: ${JSON.stringify(n)}

Respond with a JSON object ONLY:
{
  "riskScore": 0-100,
  "qualityScore": 0-100,
  "isVerified": boolean,
  "flags": ["issue1", "issue2"],
  "isAiGenerated": boolean
}
Do not include markdown formatting or explanations. Just the JSON string.`,r,.1))).qualityScore??50}async function m(e,t){if(0===e.length)return"neutral";try{let t=e.map(e=>({text:e})),r=await i(t),n={positive:0,neutral:0,negative:0};for(let e of r)n[e.sentiment]+=e.confidence;return Object.entries(n).sort((e,t)=>t[1]-e[1])[0][0]}catch{return JSON.parse(u(await o(`Analyze the overall sentiment of these text responses:
${e.map((e,t)=>`${t+1}. ${e}`).join("\n")}

Return ONLY a JSON object: { "sentiment": "positive" | "neutral" | "negative", "score": <number -1 to 1> }`,t,.1))).sentiment??"neutral"}}},90455:(e,t,r)=>{r.d(t,{L:()=>u});var n=r(13539),a=r(77234),s=r(53797),i=r(72331);let o=[(0,s.Z)({name:"Email",credentials:{email:{label:"Email",type:"email",placeholder:"name@example.com"}},async authorize(e){if(!e?.email)return null;let t=await i._.user.findUnique({where:{email:e.email}});return t||(t=await i._.user.create({data:{email:e.email,name:e.email.split("@")[0]}})),{id:t.id,email:t.email,name:t.name,image:t.image}}})];process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&o.unshift((0,a.Z)({clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET}));let u={adapter:(0,n.N)(i._),providers:o,session:{strategy:"jwt"},callbacks:{signIn:async({user:e,account:t})=>(t?.provider,!0),session:async({session:e,token:t})=>(e.user&&(e.user.id=t.sub),e),jwt:async({token:e,user:t})=>(t&&(e.sub=t.id),e),redirect:async({url:e,baseUrl:t})=>e.startsWith("/")?`${t}${e}`:new URL(e).origin===t?e:`${t}/dashboard`},pages:{signIn:"/auth"}}},72331:(e,t,r)=>{r.d(t,{_:()=>a});var n=r(53524);let a=globalThis.prisma??function(){let e=new n.PrismaClient({log:["error"]});return e.$connect(),e}()},50650:(e,t,r)=>{r.d(t,{D4:()=>o,HI:()=>p,cn:()=>i,pe:()=>d});var n=r(55761),a=r(62386),s=r(84770);function i(...e){return(0,a.m6)((0,n.W)(e))}function o(e){return(0,s.createHash)("sha256").update(e).digest("hex")}let u="aes-256-gcm",l=process.env.ENCRYPTION_KEY||"default-key-change-in-production!";function c(){return(0,s.createHash)("sha256").update(l).digest()}function p(e){let t=(0,s.randomBytes)(16),r=(0,s.createCipheriv)(u,c(),t),n=r.update(e,"utf8","hex");n+=r.final("hex");let a=r.getAuthTag().toString("hex");return`${t.toString("hex")}:${a}:${n}`}function d(e){let[t,r,n]=e.split(":"),a=Buffer.from(t,"hex"),i=Buffer.from(r,"hex"),o=(0,s.createDecipheriv)(u,c(),a);return o.setAuthTag(i),o.update(n,"hex","utf8")+o.final("utf8")}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),n=t.X(0,[8948,1615,5571,8820,5972,5335],()=>r(30188));module.exports=n})();