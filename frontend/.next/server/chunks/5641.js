"use strict";exports.id=5641,exports.ids=[5641],exports.modules={72:(e,t,a)=>{a.d(t,{AF:()=>i,Nw:()=>n,OQ:()=>o}),a(15424);var r=a(46242);(0,r.$)("53524e36c1c6c846a7fb7e268058d7a5a595a3c5");var n=(0,r.$)("105506efc04711a09a8d775f1f7c75e217392e84");(0,r.$)("84df0232e5b50af1bb06a18e8fb616226536c687");var o=(0,r.$)("287979d1be82f7da7298905c4509657892d46429");(0,r.$)("9376b4fd9811a22abbdbaa298f1b656e498f77ca"),(0,r.$)("dc97039b8a373109d83ea5dcfa1908d543554c89"),(0,r.$)("51572347bf4bd828d27647ff1a403f36cd469673");var i=(0,r.$)("0d44e6c21dc0e73c3378cc39c975e426e4724a67");(0,r.$)("160a5871480f6a11d28f36b5cce35368b8d73471")},44809:(e,t,a)=>{a.d(t,{L:()=>l});var r=a(12458),n=a(85876),o=a(34413),i=a(99180);let s=[(0,o.Z)({name:"Email",credentials:{email:{label:"Email",type:"email",placeholder:"name@example.com"}},async authorize(e){if(!e?.email)return null;let t=await i._.user.findUnique({where:{email:e.email}});return t||(t=await i._.user.create({data:{email:e.email,name:e.email.split("@")[0]}})),{id:t.id,email:t.email,name:t.name,image:t.image}}})];process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&s.unshift((0,n.Z)({clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET}));let l={adapter:(0,r.N)(i._),providers:s,session:{strategy:"jwt"},callbacks:{signIn:async({user:e,account:t})=>(t?.provider,!0),session:async({session:e,token:t})=>(e.user&&(e.user.id=t.sub),e),jwt:async({token:e,user:t})=>(t&&(e.sub=t.id),e),redirect:async({url:e,baseUrl:t})=>e.startsWith("/")?`${t}${e}`:new URL(e).origin===t?e:`${t}/dashboard`},pages:{signIn:"/auth"}}},99180:(e,t,a)=>{a.d(t,{_:()=>n});var r=a(53524);let n=globalThis.prisma??function(){let e=new r.PrismaClient({log:["error"]});return e.$connect(),e}()},31932:(e,t,a)=>{a.r(t),a.d(t,{analyzeFormResponses:()=>N,analyzeUploadedContext:()=>q,generateForm:()=>O,generateQuestionsFromTrainedModel:()=>$,getQuestionSuggestions:()=>v,getTrainedModelInfo:()=>T,runSentimentAnalysis:()=>A,scoreIntegrity:()=>E,suggestQuestionsFromNlp:()=>L});var r=a(27745);a(26461);var n=a(99180),o=a(43153),i=a(44809),s=a(84770);let l=process.env.ENCRYPTION_KEY||"default-key-change-in-production!";function u(e){let[t,a,r]=e.split(":"),n=Buffer.from(t,"hex"),o=Buffer.from(a,"hex"),i=(0,s.createDecipheriv)("aes-256-gcm",(0,s.createHash)("sha256").update(l).digest(),n);return i.setAuthTag(o),i.update(r,"hex","utf8")+i.final("utf8")}var c=a(20958);let d=(process.env.NLP_API_URL||"http://localhost:8000").replace(/\/$/,"");async function p(e,t=3,a){let r={feedback_text:e.trim(),rating:Math.max(1,Math.min(5,Math.round(t)))};a&&(r.category=a);let n=await fetch(`${d}/analyze-feedback`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r),signal:AbortSignal.timeout(3e4)});if(!n.ok){let e=n.statusText;try{let t=await n.json();e=t?.detail?.message??t?.message??e}catch{}throw Error(`NLP API ${n.status}: ${e}`)}return n.json()}async function m(e,t=5){let a=Array(e.length);for(let r=0;r<e.length;r+=t){let n=e.slice(r,r+t);(await Promise.all(n.map(e=>p(e.text,e.rating??3,e.category)))).forEach((e,t)=>{a[r+t]=e})}return a}async function f(e,t,a=.7){let r=(t||process.env.GROQ_API_KEY||"").trim();if(!r)throw Error("No Groq API key configured. Add GROQ_API_KEY to .env.local or set one in your profile.");let n=new c.ZP({apiKey:r}),o=await n.chat.completions.create({messages:[{role:"user",content:e}],model:"llama-3.3-70b-versatile",temperature:a});return o.choices[0]?.message?.content||""}function h(e){let t=e.match(/\{[\s\S]*\}|\[[\s\S]*\]/);return t?t[0]:e.trim()}async function y(e,t){return JSON.parse(h(await f(`You are a form builder AI. Based on the following description, generate a feedback form.
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

Return ONLY valid JSON, no markdown, no explanation.`,t,.7)))}async function g(e,t,a){return JSON.parse(h(await f(`You are a form builder AI. Given these existing questions for a form about "${t}":
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

Return ONLY valid JSON.`,a,.7)))}async function w(e,t,a){let r=t.flatMap(e=>(e.answers??[]).filter(e=>"string"==typeof e.answer&&e.answer.trim())),n="neutral",o=[];if(r.length>0){let e=r.map(e=>({text:e.answer}));try{let t=await m(e),a={positive:0,neutral:0,negative:0};for(let e of t)a[e.sentiment]++;n=Object.entries(a).sort((e,t)=>t[1]-e[1])[0][0],o=t.map(e=>e.suggestion).filter(Boolean),Array.from(new Set(t.flatMap(e=>e.keywords)))}catch(e){}}let i=o.length>0?`

The AI model already produced these per-answer improvement suggestions:
${o.map((e,t)=>`${t+1}. ${e}`).join("\n")}`:"";return JSON.parse(h(await f(`Analyze these responses for the form "${e}":
${JSON.stringify(t,null,2)}${i}

The overall sentiment determined by the trained model is: ${n}

Return a JSON object:
{
  "keyThemes": ["theme1", "theme2"],
  "commonComplaints": ["complaint1", "complaint2"],
  "actionableSuggestions": ["suggestion1", "suggestion2"],
  "sentimentSummary": "Overall sentiment description",
  "overallSentiment": "positive" | "neutral" | "negative"
}

Return ONLY valid JSON, no markdown.`,a,.3)))}async function b(e,t,a){let r=e.map((e,a)=>({question:e,answer:t[a]||""}));return JSON.parse(h(await f(`You are an expert data analyst and AI detector. Analyze the following survey response to determine the Integrity Score.

The Integrity Score (0-100) reflects two things:
1. Respondent Engagement: Did they read and answer thoughtfully?
2. Authenticity: Is the text human-written or AI-generated?

Scoring Rules:
- High Score (80-100): Detailed, authentic, consistent, human-sounding answers.
- Medium Score (50-79): Acceptable but short answers, or slight AI-sounding phrasing.
- Low Score (0-49): One-word answers, gibberish, contradictions, OR highly probable AI-generated content.

Response JSON: ${JSON.stringify(r)}

Respond with a JSON object ONLY:
{
  "riskScore": 0-100,
  "qualityScore": 0-100,
  "isVerified": boolean,
  "flags": ["issue1", "issue2"],
  "isAiGenerated": boolean
}
Do not include markdown formatting or explanations. Just the JSON string.`,a,.1))).qualityScore??50}async function _(e,t){if(0===e.length)return"neutral";try{let t=e.map(e=>({text:e})),a=await m(t),r={positive:0,neutral:0,negative:0};for(let e of a)r[e.sentiment]+=e.confidence;return Object.entries(r).sort((e,t)=>t[1]-e[1])[0][0]}catch{return JSON.parse(h(await f(`Analyze the overall sentiment of these text responses:
${e.map((e,t)=>`${t+1}. ${e}`).join("\n")}

Return ONLY a JSON object: { "sentiment": "positive" | "neutral" | "negative", "score": <number -1 to 1> }`,t,.1))).sentiment??"neutral"}}async function S(){let e=await (0,o.getServerSession)(i.L);if(!e?.user?.email)return null;let t=await n._.user.findUnique({where:{email:e.user.email}});if(!t?.customApiKey)return null;try{return u(t.customApiKey)}catch{return null}}async function O(e){return y(e,await S())}async function v(e,t){return g(e,t,await S())}async function N(e){let t=await (0,o.getServerSession)(i.L);if(!t?.user?.email)throw Error("Unauthorized");let a=await n._.user.findUnique({where:{email:t.user.email}});if(!a)throw Error("User not found");let r=await n._.form.findFirst({where:{id:e,userId:a.id},include:{questions:!0,responses:{include:{answers:{include:{question:!0}}}}}});if(!r)throw Error("Form not found");let s=r.responses.map(e=>({submittedAt:e.submittedAt,answers:e.answers.map(e=>({question:e.question.label,answer:e.value}))})),l=a.customApiKey?u(a.customApiKey):null;return w(r.title,s,l)}async function E(e){let t=await n._.response.findUnique({where:{id:e},include:{answers:{include:{question:!0}},form:{include:{user:!0}}}});if(!t)throw Error("Response not found");let a=t.answers.map(e=>e.question.label),r=t.answers.map(e=>e.value),o=t.form.user.customApiKey?u(t.form.user.customApiKey):null,i=await b(a,r,o);return await n._.response.update({where:{id:e},data:{integrityScore:i}}),i}async function A(e){let t=await n._.response.findUnique({where:{id:e},include:{answers:{include:{question:!0}},form:{include:{user:!0}}}});if(!t)throw Error("Response not found");let a=t.answers.filter(e=>["SHORT_TEXT","LONG_TEXT"].includes(e.question.type)).map(e=>e.value).filter(e=>e.length>0);if(0===a.length)return null;let r=t.form.user.customApiKey?u(t.form.user.customApiKey):null,o=await _(a,r);return await n._.response.update({where:{id:e},data:{sentimentScore:"positive"===o?1:"negative"===o?-1:0}}),o}async function L(e,t=6,a){let r;let n=(process.env.NLP_API_URL||"http://localhost:8000").replace(/\/$/,"");try{r=await fetch(`${n}/api/v1/suggest-questions`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:e,count:t,category:a??null}),cache:"no-store",signal:AbortSignal.timeout(15e3)})}catch(e){throw Error(`Cannot reach the NLP server at ${n}. Make sure the Python NLP server is running (cd nlp_model && python run_api.py). Details: ${e?.message??e}`)}if(!r.ok){let e=await r.text().catch(()=>"");throw Error(`NLP suggestion service error (${r.status})${e?": "+e:""}. Make sure the Python NLP server is running.`)}return r.json()}async function $(e,t=5,a=!0){let r=(process.env.NLP_API_URL||"http://localhost:8000").replace(/\/$/,"");try{let n=await fetch(`${r}/api/v1/questions/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:e,num_questions:t,use_uploaded_data:a}),cache:"no-store",signal:AbortSignal.timeout(3e4)});if(!n.ok){let e=await n.json().catch(()=>({detail:"Unknown error"}));throw Error(e.detail||`NLP API error: ${n.status}`)}let o=await n.json();return{questions:o.questions.map(e=>({...e,label:e.text})),generated_from_context:o.generated_from_context,num_documents_used:o.num_documents_used,message:o.message}}catch(a){return console.error("Trained model error, using fallback:",a),{questions:(function(e,t){let a=e.toLowerCase();return{questions:(a.includes("customer")||a.includes("service")?[{type:"radio",label:"How would you rate your overall experience?",required:!0,options:["1 - Poor","2 - Fair","3 - Good","4 - Very Good","5 - Excellent"]},{type:"radio",label:"How likely are you to recommend us?",required:!0,options:["Not at all likely","Unlikely","Neutral","Likely","Very likely"]},{type:"textarea",label:"What did you like most?",placeholder:"Share your thoughts...",required:!1},{type:"textarea",label:"What can we improve?",placeholder:"Your suggestions...",required:!1},{type:"email",label:"Email (optional for follow-up)",placeholder:"your@email.com",required:!1}]:[{type:"text",label:`What brings you to this ${e}?`,placeholder:"Your answer...",required:!0},{type:"radio",label:"How would you rate your experience?",required:!0,options:["1 - Poor","2 - Fair","3 - Good","4 - Very Good","5 - Excellent"]},{type:"textarea",label:"Please share any additional feedback",placeholder:"Your thoughts...",required:!1},{type:"email",label:"Email address (optional)",placeholder:"your@email.com",required:!1}]).slice(0,t),model_used:"fallback_templates",prompt:e}})(e,t).questions.map((e,t)=>({id:`fallback-${t}`,text:e.label,type:e.type,placeholder:e.placeholder,required:e.required,options:e.options})),generated_from_context:!1,num_documents_used:0,message:"Using fallback templates (NLP API unavailable)"}}}async function T(){let e=(process.env.NLP_API_URL||"http://localhost:8000").replace(/\/$/,"");try{let t=await fetch(`${e}/api/v1/questions/model-info`,{cache:"no-store",signal:AbortSignal.timeout(5e3)});if(!t.ok)throw Error(`Failed to get model info: ${t.status}`);return await t.json()}catch(e){return console.error("Error getting model info:",e),{model_loaded:!1,model_type:"unknown",context_analyzer:"unknown",question_generator:"unknown",features:[],status:"unavailable"}}}async function q(e){let t=(process.env.NLP_API_URL||"http://localhost:8000").replace(/\/$/,"");try{let a=await fetch(`${t}/api/v1/questions/analyze-context`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:e}),cache:"no-store",signal:AbortSignal.timeout(15e3)});if(!a.ok)throw Error(`Failed to analyze context: ${a.status}`);return await a.json()}catch(e){return console.error("Error analyzing context:",e),{message:"Error analyzing context",num_documents:0,total_contexts:0,relevant_contexts:[]}}}(0,a(85723).h)([O,v,N,E,A,L,$,T,q]),(0,r.j)("105506efc04711a09a8d775f1f7c75e217392e84",O),(0,r.j)("84df0232e5b50af1bb06a18e8fb616226536c687",v),(0,r.j)("287979d1be82f7da7298905c4509657892d46429",N),(0,r.j)("9376b4fd9811a22abbdbaa298f1b656e498f77ca",E),(0,r.j)("dc97039b8a373109d83ea5dcfa1908d543554c89",A),(0,r.j)("51572347bf4bd828d27647ff1a403f36cd469673",L),(0,r.j)("0d44e6c21dc0e73c3378cc39c975e426e4724a67",$),(0,r.j)("160a5871480f6a11d28f36b5cce35368b8d73471",T),(0,r.j)("53524e36c1c6c846a7fb7e268058d7a5a595a3c5",q)}};