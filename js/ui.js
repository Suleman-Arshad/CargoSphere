const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtD=t=>new Date(t).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});
const fmtT=t=>new Date(t).toLocaleString(undefined,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
const money=n=>"$"+Math.round(n).toLocaleString();
const badge=s=>`<span class="badge s-${cls(s)}">${s}</span>`;
const COLORS={"Processing":"#7b8794","In Transit":"#2b7de9","Out for Delivery":"#8a5cf0","Delivered":"#14966a","Delayed":"#dc3b3b"};

function table(list){
  if(!list.length)return `<p class="mut">No shipments match. Clear the search or filter to see all shipments.</p>`;
  return `<div class="wrap"><table><thead><tr><th>ID</th><th>Customer</th><th>Route</th><th>Carrier</th><th>ETA</th><th>Status</th></tr></thead><tbody>`+
  list.map(s=>`<tr data-go="${s.id}"><td><b>${s.id}</b></td><td>${esc(s.customer)}</td><td>${s.origin} → ${s.dest}</td><td>${s.carrier}</td><td>${fmtD(s.eta)}</td><td>${badge(s.status)}</td></tr>`).join("")+`</tbody></table></div>`;
}

function donut(data){
  const tot=data.reduce((a,d)=>a+d.value,0)||1;let a0=-Math.PI/2,out="";
  data.forEach(d=>{if(!d.value)return;const a1=a0+d.value/tot*2*Math.PI-.001,l=a1-a0>Math.PI?1:0,R=70,r=44,c=100;
    const p=(R_,a)=>[c+R_*Math.cos(a),c+R_*Math.sin(a)].join(",");
    out+=`<path d="M${p(R,a0)}A${R},${R} 0 ${l} 1 ${p(R,a1)}L${p(r,a1)}A${r},${r} 0 ${l} 0 ${p(r,a0)}Z" fill="${d.color}"/>`;a0=a1+.001});
  return `<div class="row"><svg viewBox="0 0 200 200" width="170" role="img" aria-label="Status split">${out}<text x="100" y="106" text-anchor="middle" font-size="26" font-weight="800" fill="currentColor">${tot}</text></svg>
  <div class="legend">${data.map(d=>`<div><i style="background:${d.color}"></i>${d.label}: <b>${d.value}</b></div>`).join("")}</div></div>`;
}

function columns(data){
  const m=Math.max(...data.map(d=>d.value),1),w=400/data.length;
  return `<svg viewBox="0 0 400 190" width="100%" role="img" aria-label="Shipments per month">`+data.map((d,i)=>{const h=d.value/m*140;
    return `<rect x="${i*w+8}" y="${150-h}" width="${w-16}" height="${h}" rx="4" fill="#f2c230"/><text x="${i*w+w/2}" y="${144-h}" text-anchor="middle" font-size="12" fill="currentColor">${d.value}</text><text x="${i*w+w/2}" y="172" text-anchor="middle" font-size="12" fill="currentColor" opacity=".6">${d.label}</text>`}).join("")+`</svg>`;
}

function hbars(data,fmt=v=>v){const m=Math.max(...data.map(d=>d.value),1);
  return data.map(d=>`<div class="bar"><span>${d.label}</span><i style="width:${d.value/m*55}%"></i><b>${fmt(d.value)}</b></div>`).join("")}

// SVG route map (equirectangular, lat 80..-20)
const mp=([la,lo])=>[(lo+180)/360*800,(80-la)/100*400];
function curve(a,b){const [x1,y1]=mp(CITIES[a]),[x2,y2]=mp(CITIES[b]);return{x1,y1,x2,y2,cx:(x1+x2)/2,cy:Math.min(y1,y2)-Math.abs(x2-x1)*.22-10}}
function at(c,t){const u=1-t;return[u*u*c.x1+2*u*t*c.cx+t*t*c.x2,u*u*c.y1+2*u*t*c.cy+t*t*c.y2]}
function mapSVG(ships,sel){
  let g="";for(let x=0;x<=800;x+=100)g+=`<path class="g" d="M${x},0V400"/>`;for(let y=0;y<=400;y+=80)g+=`<path class="g" d="M0,${y}H800"/>`;
  const cities=Object.keys(CITIES).map(n=>{const [x,y]=mp(CITIES[n]);return `<circle cx="${x}" cy="${y}" r="3" fill="#fff"/><text x="${x+6}" y="${y+3}">${n}</text>`}).join("");
  let rt="",vs="";
  ships.forEach(s=>{const c=curve(s.origin,s.dest),on=s.id===sel;
    rt+=`<path class="r${on?" sel":""}" d="M${c.x1},${c.y1}Q${c.cx},${c.cy} ${c.x2},${c.y2}"/>`;
    const t=s.status==="Delayed"?.5:(PROG[s.status]-1)/4,[x,y]=at(c,t);
    vs+=`<circle class="v" data-go="${s.id}" cx="${x}" cy="${y}" r="${on?8:5}" fill="${COLORS[s.status]}" stroke="#fff" stroke-width="1.5"><title>${s.id} – ${s.status}</title></circle>`});
  return `<svg class="map" viewBox="0 0 800 400" role="img" aria-label="Shipment route map">${g}${rt}${cities}${vs}</svg>`;
}
