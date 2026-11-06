const CITIES={"Karachi":[24.86,67.01],"Lahore":[31.52,74.35],"Dubai":[25.2,55.27],"London":[51.5,-0.12],"Rotterdam":[51.92,4.48],
"Istanbul":[41.0,28.97],"Mumbai":[19.07,72.88],"Singapore":[1.35,103.82],"Shanghai":[31.23,121.47],"New York":[40.71,-74.0],"Nairobi":[-1.29,36.82]};
const STATUS=["Processing","In Transit","Out for Delivery","Delivered","Delayed"];
const STEPS=["Order placed","Picked up","In transit","Out for delivery","Delivered"];
const PROG={"Processing":1,"In Transit":3,"Out for Delivery":4,"Delivered":5,"Delayed":3};
const CARRIERS=["AeroFreight","BlueOcean","RoadRunner","SkyLine"];
const DAY=864e5,HR=36e5;
const cls=s=>s.replace(/ /g,"-");

function rng(seed){return()=>(seed=seed*16807%2147483647)/2147483647}
function buildHistory(s){s.history=STEPS.slice(0,PROG[s.status]).map((n,i)=>({step:n,time:s.created+i*HR*14}))}

function seedData(){
  const r=rng(42),cs=Object.keys(CITIES),pick=a=>a[Math.floor(r()*a.length)];
  const names=["Orbit Textiles","Nova Pharma","Delta Foods","Apex Motors","Kite Electronics","Lumen Retail","Harbor & Co","Zenith Steel","Mango Mart","Bright Toys"];
  const ships=[];
  for(let i=0;i<28;i++){
    const o=pick(cs);let d=pick(cs);while(d===o)d=pick(cs);
    const w=r(),status=w<.15?"Processing":w<.4?"In Transit":w<.5?"Out for Delivery":w<.55?"Delayed":"Delivered";
    let created=Date.now()-Math.floor(r()*150)*DAY-Math.floor(r()*20)*HR;
    if(status!=="Delivered"&&created<Date.now()-12*DAY)created=Date.now()-Math.floor(1+r()*8)*DAY;
    const s={id:"CS-"+(10001+i),customer:pick(names),origin:o,dest:d,carrier:pick(CARRIERS),status,
      weight:Math.round(20+r()*980),value:Math.round(500+r()*9500),priority:pick(["Standard","Express"]),
      created,eta:created+(4+Math.floor(r()*9))*DAY};
    buildHistory(s);ships.push(s);
  }
  return ships;
}

const Store={
  key:"cargosphere.v1",
  load(){try{const d=JSON.parse(localStorage.getItem(this.key));if(d&&d.ships)return d}catch(e){}
    const ships=seedData();
    const notes=ships.filter(s=>s.status==="Delayed").slice(0,3).map(s=>({id:s.id+"d",type:"Delayed",msg:`${s.id} is delayed on ${s.origin} → ${s.dest}`,t:Date.now()-HR,read:false}));
    return {ships,notes}},
  save(S){try{localStorage.setItem(this.key,JSON.stringify(S))}catch(e){}}
};

// Next status in the delivery flow
function nextStatus(st){return {"Processing":"In Transit","In Transit":"Out for Delivery","Out for Delivery":"Delivered","Delayed":"In Transit"}[st]||st}
