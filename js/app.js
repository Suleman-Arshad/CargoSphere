const $=s=>document.querySelector(s);
let S=Store.load(),F={q:"",st:"All",sort:"new"};
const save=()=>Store.save(S);
const find=id=>S.ships.find(x=>x.id===id);
const count=k=>S.ships.filter(s=>s.status===k).length;

function notify(type,msg){S.notes.unshift({id:Date.now()+""+Math.random(),type,msg,t:Date.now(),read:false});save();badges();
  const t=document.createElement("div");t.className="toast";t.textContent=msg;$("#toasts").append(t);setTimeout(()=>t.remove(),4500)}
function badges(){const n=S.notes.filter(x=>!x.read).length;["#badge","#badge2"].forEach(id=>{$(id).hidden=!n;$(id).textContent=n})}

function setStatus(s,st){s.status=st;buildHistory(s);if(st==="Delivered")s.eta=Math.min(s.eta,Date.now());save()}
function filtered(){
  const q=F.q.toLowerCase();
  let l=S.ships.filter(s=>(F.st==="All"||s.status===F.st)&&(!q||[s.id,s.customer,s.origin,s.dest,s.carrier].join(" ").toLowerCase().includes(q)));
  return l.sort((a,b)=>F.sort==="eta"?a.eta-b.eta:b.created-a.created);
}
const head=(t,extra="")=>`<div class="top"><h1>${t}</h1>${extra}</div>`;

/* ---------- Views ---------- */
function dashboard(){
  const k=(l,v,c)=>`<div class="card kpi" style="--c:${c}"><small>${l}</small><div>${v}</div></div>`;
  $("#view").innerHTML=head("Dashboard",`<a class="btn" href="#/orders">New order</a>`)+
  `<div class="grid g4">${k("Total shipments",S.ships.length,"#f2c230")}${k("In transit",count("In Transit")+count("Out for Delivery"),COLORS["In Transit"])}${k("Delivered",count("Delivered"),COLORS.Delivered)}${k("Delayed",count("Delayed"),COLORS.Delayed)}</div>
  <div class="grid g2" style="margin-top:16px"><div class="card"><h2>Active routes</h2><br>${mapSVG(S.ships.filter(s=>s.status!=="Delivered"))}</div>
  <div class="card"><h2>Status split</h2><br>${donut(STATUS.map(s=>({label:s,value:count(s),color:COLORS[s]})))}</div></div>
  <div class="card" style="margin-top:16px"><h2>Recent shipments</h2>${table([...S.ships].sort((a,b)=>b.created-a.created).slice(0,6))}</div>`;
}

function shipments(){
  $("#view").innerHTML=head("Shipments",`<div class="row"><select id="fs" aria-label="Filter status"><option>All</option>${STATUS.map(s=>`<option ${F.st===s?"selected":""}>${s}</option>`).join("")}</select>
  <select id="so" aria-label="Sort"><option value="new">Newest first</option><option value="eta" ${F.sort==="eta"?"selected":""}>Earliest ETA</option></select></div>`)+
  `<div class="card" id="list"></div>`;
  const draw=()=>{const l=filtered();$("#list").innerHTML=`<p class="mut">${l.length} shipment${l.length===1?"":"s"}${F.q?` matching “${esc(F.q)}”`:""}</p>`+table(l)};
  $("#fs").onchange=e=>{F.st=e.target.value;draw()};$("#so").onchange=e=>{F.sort=e.target.value;draw()};draw();
}

function tracking(id){
  const raw=id?decodeURIComponent(id):"",s=raw&&find(raw.toUpperCase());
  let body=`<div class="card"><p class="mut">${raw?`No shipment found for “${esc(raw)}”. Check the ID and try again.`:"Enter a tracking ID to see its live status and delivery timeline."} Try: ${S.ships.slice(0,3).map(x=>`<a href="#/tracking/${x.id}">${x.id}</a>`).join(", ")}</p></div>`;
  if(s){
    const p=PROG[s.status];
    body=`<div class="grid g2"><div class="card"><div class="row" style="justify-content:space-between"><h2>${s.id}</h2>${badge(s.status)}</div>
    <p>${s.origin} → ${s.dest}<br><span class="mut">${esc(s.customer)} · ${s.carrier} · ${s.weight} kg · ${s.priority}</span></p>
    <p><b>${s.status==="Delivered"?"Delivered":"Estimated arrival"}:</b> ${fmtD(s.eta)}</p>
    <h2 style="margin:18px 0 12px">Delivery timeline</h2><ul class="tl">${STEPS.map((n,i)=>{
      const done=i<p,now=i===p-1,h=s.history[i];
      return `<li class="${done?"done":""} ${now&&s.status!=="Delivered"?"now":""} ${now&&s.status==="Delayed"?"warn":""}">${n}${h?`<small>${fmtT(h.time)}</small>`:`<small>Pending</small>`}${now&&s.status==="Delayed"?`<small>Delayed – carrier is rescheduling</small>`:""}</li>`}).join("")}</ul></div>
    <div class="card"><h2>Location</h2><br>${mapSVG([s],s.id)}</div></div>`;
  }
  $("#view").innerHTML=head("Tracking")+`<form class="row" id="tf" style="margin-bottom:16px"><input id="tid" placeholder="e.g. CS-10001" value="${esc(raw)}" aria-label="Tracking ID"><button class="btn">Track shipment</button></form>`+body;
  $("#tf").onsubmit=e=>{e.preventDefault();location.hash="#/tracking/"+encodeURIComponent($("#tid").value.trim())};
}

function orders(){
  const opts=sel=>Object.keys(CITIES).map((c,i)=>`<option ${i===sel?"selected":""}>${c}</option>`).join("");
  const list=[...S.ships].sort((a,b)=>b.created-a.created).slice(0,8);
  $("#view").innerHTML=head("Orders")+`<form class="card f" id="of"><label>Customer<input name="c" required maxlength="40"></label>
  <label>Origin<select name="o">${opts(0)}</select></label><label>Destination<select name="d">${opts(3)}</select></label>
  <label>Weight (kg)<input name="w" type="number" min="1" value="100" required></label>
  <label>Priority<select name="p"><option>Standard</option><option>Express</option></select></label><button class="btn">Create order</button></form>
  <div class="card" style="margin-top:16px"><h2>Latest orders</h2><div class="wrap"><table><thead><tr><th>ID</th><th>Customer</th><th>Route</th><th>Status</th><th>Actions</th></tr></thead><tbody>`+
  list.map(s=>`<tr><td><a href="#/tracking/${s.id}"><b>${s.id}</b></a></td><td>${esc(s.customer)}</td><td>${s.origin} → ${s.dest}</td><td>${badge(s.status)}</td><td><div class="row">
  ${s.status!=="Delivered"?`<button class="btn sm" data-adv="${s.id}">Advance</button>`:""}${["Delivered","Delayed"].includes(s.status)?"":`<button class="btn sm ghost" data-delay="${s.id}">Mark delayed</button>`}<button class="btn sm ghost" data-del="${s.id}">Cancel</button></div></td></tr>`).join("")+`</tbody></table></div></div>`;
  $("#of").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),o=f.get("o"),d=f.get("d");
    if(o===d)return notify("Error","Origin and destination must be different.");
    const n=Math.max(...S.ships.map(x=>+x.id.slice(3)))+1,now=Date.now();
    const s={id:"CS-"+n,customer:f.get("c").trim(),origin:o,dest:d,carrier:CARRIERS[n%4],status:"Processing",weight:+f.get("w"),value:Math.round(+f.get("w")*12),priority:f.get("p"),created:now,eta:now+(f.get("p")==="Express"?3:7)*DAY};
    buildHistory(s);S.ships.unshift(s);save();notify("Order",`Order ${s.id} created for ${s.customer}`);orders()};
}

function mapView(){
  $("#view").innerHTML=head("Live map")+`<div class="card">${mapSVG(S.ships.filter(s=>s.status!=="Delivered"))}<p class="mut">Select a marker to open its tracking page. Marker colour shows status.</p>
  <div class="row">${STATUS.map(s=>badge(s)).join("")}</div></div>`;
}

function analytics(){
  const months=[];for(let i=5;i>=0;i--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);months.push({y:d.getFullYear(),m:d.getMonth(),label:d.toLocaleString(undefined,{month:"short"}),value:0})}
  S.ships.forEach(s=>{const d=new Date(s.created),m=months.find(x=>x.y===d.getFullYear()&&x.m===d.getMonth());if(m)m.value++});
  const carr=CARRIERS.map(c=>{const l=S.ships.filter(s=>s.carrier===c);return{label:c,value:l.length?Math.round(l.filter(s=>s.status!=="Delayed").length/l.length*100):0}});
  const rt={};S.ships.forEach(s=>{const k=s.origin+" → "+s.dest;rt[k]=(rt[k]||0)+1});
  const top=Object.entries(rt).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([label,value])=>({label,value}));
  const n=S.ships.length||1,val=S.ships.reduce((a,s)=>a+s.value,0),w=S.ships.reduce((a,s)=>a+s.weight,0);
  $("#view").innerHTML=head("Analytics")+`<div class="grid g4"><div class="card kpi"><small>Cargo value</small><div>${money(val)}</div></div><div class="card kpi"><small>Total weight</small><div>${(w/1000).toFixed(1)} t</div></div>
  <div class="card kpi" style="--c:${COLORS.Delivered}"><small>Delivery rate</small><div>${Math.round(count("Delivered")/n*100)}%</div></div><div class="card kpi" style="--c:${COLORS.Delayed}"><small>Delay rate</small><div>${Math.round(count("Delayed")/n*100)}%</div></div></div>
  <div class="grid g2" style="margin-top:16px"><div class="card"><h2>Shipments per month</h2><br>${columns(months)}</div><div class="card"><h2>Status split</h2><br>${donut(STATUS.map(s=>({label:s,value:count(s),color:COLORS[s]})))}</div>
  <div class="card"><h2>On-time rate by carrier</h2><br>${hbars(carr,v=>v+"%")}</div><div class="card"><h2>Busiest routes</h2><br>${hbars(top)}</div></div>`;
}

function notifications(){
  $("#view").innerHTML=head("Notifications",`<button class="btn ghost" id="mr">Mark all as read</button>`)+`<div class="card">`+
  (S.notes.length?S.notes.slice(0,40).map(n=>`<div class="note ${n.read?"":"unread"}"><span class="dot" style="--c:${COLORS[n.type]||"#f2c230"}"></span><div>${esc(n.msg)}<br><small class="mut">${fmtT(n.t)}</small></div></div>`).join(""):`<p class="mut">You’re all caught up. Status changes will appear here.</p>`)+`</div>`;
  $("#mr").onclick=()=>{S.notes.forEach(n=>n.read=true);save();badges();notifications()};
}

/* ---------- Router & events ---------- */
const routes={dashboard,shipments,tracking,orders,map:mapView,analytics,notifications};
function route(){
  const [,name="dashboard",arg]=location.hash.split("/");
  const fn=routes[name]||dashboard;fn(arg);
  document.querySelectorAll("#nav a").forEach(a=>a.classList.toggle("on",a.dataset.r===(routes[name]?name:"dashboard")));
  $("#side").classList.remove("open");
}
addEventListener("hashchange",()=>{route();scrollTo(0,0)});
document.addEventListener("click",e=>{
  const a=e.target.closest("[data-adv],[data-delay],[data-del]");
  if(a){const id=a.dataset.adv||a.dataset.delay||a.dataset.del,s=find(id);if(!s)return;
    if(a.dataset.adv){setStatus(s,nextStatus(s.status));notify(s.status,`${id} is now ${s.status}`)}
    else if(a.dataset.delay){setStatus(s,"Delayed");notify("Delayed",`${id} was marked delayed`)}
    else{S.ships=S.ships.filter(x=>x!==s);save();notify("Order",`Order ${id} cancelled`)}
    return route()}
  const g=e.target.closest("[data-go]");if(g)location.hash="#/tracking/"+g.dataset.go;
});
$("#q").addEventListener("input",e=>{F.q=e.target.value;if(!location.hash.startsWith("#/shipments"))location.hash="#/shipments";else shipments()});
$("#menu").onclick=()=>$("#side").classList.toggle("open");

// Simulated live activity: every 12s one active shipment moves forward
setInterval(()=>{
  const act=S.ships.filter(s=>s.status!=="Delivered");if(!act.length)return;
  const s=act[Math.floor(Math.random()*act.length)];setStatus(s,nextStatus(s.status));
  notify(s.status,`${s.id}: ${s.origin} → ${s.dest} is now ${s.status}`);
  if(!/^#\/(orders|tracking)/.test(location.hash))route();
},12000);

badges();route();
