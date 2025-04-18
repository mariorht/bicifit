/* ===== CONSTANTES ===== */
const RC        = 410;
const HT_LEN    = 90;
const WHEEL_R   = 335;
const SPACER_MM = 5;
const CRANK_LEN = 170;
const THIGH_L   = 480;
const SHIN_L    = 480;
const TORSO_L   = 600;
const ARM_L     = 650;
const HEAD_R    = 80;
const s         = 0.3;   // px por mm

/* ===== BINDINGS ===== */
const ids=[
  "stack","reach","seatTube","saddleHeight",
  "ca","ha","barHeight","barLength","stemLength"
];
const state={};
ids.forEach(id=>{
  const el=document.getElementById(id);
  state[id]=+el.value;
  el.addEventListener("input",e=>{state[id]=+e.target.value||0;draw();});
});
const canvas=document.getElementById("preview");
const ctx=canvas.getContext("2d");
const out=document.getElementById("calc");

/* ===== PEDALES animación ===== */
let crankAngle=0, spinning=false;
document.getElementById("togglePedals").addEventListener("click",()=>{
  spinning=!spinning;
  if(spinning) requestAnimationFrame(animate);
});
function animate(){
  if(spinning){
    crankAngle+=0.05;
    draw();
    requestAnimationFrame(animate);
  }
}

/* helpers */
const rad=d=>d*Math.PI/180;
function line(a,b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function dot(p){ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();}
/* devuelve siempre ambas posibles intersecciones (o null) */
function circleIntersections(A,rA,B,rB){
    const dx=B.x-A.x, dy=B.y-A.y, d=Math.hypot(dx,dy);
    if(d>rA+rB||d<Math.abs(rA-rB)||d===0) return null;
    const a=(rA*rA - rB*rB + d*d)/(2*d);
    const h=Math.sqrt(Math.max(0,rA*rA-a*a));
    const xm=A.x + a*dx/d, ym=A.y + a*dy/d;
    const rx=-dy*(h/d),     ry= dx*(h/d);
    return [
      {x:xm+rx, y:ym+ry},
      {x:xm-rx, y:ym-ry}
    ];
  }
  

/* ===== DRAW ===== */
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.lineWidth=2;ctx.strokeStyle="#1976d2";ctx.fillStyle="#1976d2";

  /* --- geometría de la bici (idéntica a la última versión) ---------------- */
  const bb={x:canvas.width/2,y:canvas.height-120};
  const ca=rad(state.ca), ha=rad(state.ha);
  const rearAxle={x:bb.x-RC*s,y:bb.y};
  const seatTop={x:bb.x-state.seatTube*Math.cos(ca)*s,
                 y:bb.y-state.seatTube*Math.sin(ca)*s};
  const saddle={x:bb.x-state.saddleHeight*Math.cos(ca)*s,
                y:bb.y-state.saddleHeight*Math.sin(ca)*s};
  const headTop={x:bb.x+state.reach*s,y:bb.y-state.stack*s};
  const headBot={x:headTop.x+HT_LEN*Math.cos(ha)*s,
                 y:headTop.y+HT_LEN*Math.sin(ha)*s};
  const forkPx=(bb.y-headBot.y)/Math.sin(ha);
  const frontAxle={x:headBot.x+forkPx*Math.cos(ha),y:bb.y};

  /* manillar */
  const uHT={x:Math.cos(ha),y:Math.sin(ha)};
  const spacerShift=state.barHeight;
  const clamp={x:headTop.x+state.stemLength*s - spacerShift*uHT.x*s,
               y:headTop.y                 - spacerShift*uHT.y*s};
  const hood=40*s, reach=state.barLength*s, drop=110*s;
  const hoodEnd={x:clamp.x+hood,y:clamp.y};
  const curveEnd={x:hoodEnd.x+reach,y:hoodEnd.y+drop};
  const tailEnd={x:curveEnd.x-20*s,y:curveEnd.y};
  const spacerTop={x:headTop.x-spacerShift*uHT.x*s,
                   y:headTop.y-spacerShift*uHT.y*s};
  line(headTop,spacerTop); line(spacerTop,clamp);
  line(clamp,hoodEnd);
  ctx.beginPath();ctx.moveTo(hoodEnd.x,hoodEnd.y);
  ctx.quadraticCurveTo(hoodEnd.x+reach*0.5,hoodEnd.y+drop*0.5,
                       curveEnd.x,curveEnd.y);ctx.stroke();
  line(curveEnd,tailEnd);
  dot(clamp);

  /* cuadro */
  line(rearAxle,bb); line(bb,headBot); line(headBot,frontAxle);
  line(headBot,headTop); line(headTop,seatTop);
  line(seatTop,rearAxle); line(bb,seatTop);
  line(seatTop,saddle); line({x:saddle.x-15,y:saddle.y},{x:saddle.x+15,y:saddle.y});
  [bb,rearAxle,frontAxle,seatTop,headTop,headBot,saddle].forEach(dot);

  /* ruedas guía */
  ctx.setLineDash([4,6]);
  ctx.beginPath();ctx.arc(rearAxle.x,rearAxle.y,WHEEL_R*s,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(frontAxle.x,frontAxle.y,WHEEL_R*s,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);

  /* ---------- CRANKS & PEDALS ---------- */
  const crankPx=CRANK_LEN*s;
  const pedalR={x:bb.x+crankPx*Math.cos(crankAngle),
                y:bb.y+crankPx*Math.sin(crankAngle)};
  const pedalL={x:bb.x+crankPx*Math.cos(crankAngle+Math.PI),
                y:bb.y+crankPx*Math.sin(crankAngle+Math.PI)};
  line(bb,pedalR); line(bb,pedalL); dot(pedalR); dot(pedalL);

  /* ========== CICLISTA ========== */
  ctx.strokeStyle="#d32f2f"; ctx.fillStyle="#d32f2f";

  /* pierna (hip = saddle, foot = pedalR) */
/* elegir la solución que queda “por delante” de la cadera */
let knee = {x:(saddle.x+pedalR.x)/2, y:(saddle.y+pedalR.y)/2}; // fallback
const ints = circleIntersections(saddle, THIGH_L*s, pedalR, SHIN_L*s);
if (ints){
  // bici mira a la derecha → la rodilla natural es la que tiene x > hip.x
  knee = ints[0].x > saddle.x ? ints[0] : ints[1];
}
  line(saddle,knee); line(knee,pedalR); dot(knee);

/* ----------  HOMBRO  ---------- */
let shoulder = {                       // valor de reserva por si no hay solución
    x: (saddle.x + hoodEnd.x) / 2,
    y: (saddle.y + hoodEnd.y) / 2
  };
  
  const shInts = circleIntersections(    // devuelve las dos posibles intersecciones
    saddle,  TORSO_L * s,                // círculo 1 (cadera → hombro)
    hoodEnd, ARM_L   * s                 // círculo 2 (mano → hombro)
  );
  
  if (shInts) {
    // elegimos la que queda más alta (y menor) para que el brazo se flexione “hacia arriba”
    shoulder = shInts[0].y < shInts[1].y ? shInts[0] : shInts[1];
  }
  
  line(saddle, shoulder);   // torso
  line(shoulder, hoodEnd);  // brazo
  dot(shoulder);
  

  /* cabeza */
  ctx.beginPath();ctx.arc(shoulder.x,shoulder.y-HEAD_R*s,HEAD_R*s,0,Math.PI*2);ctx.stroke();

  /* ----- texto cálculo potencia / espaciadores ----- */
  const dx_mm=(clamp.x-headTop.x)/s;
  const dy_mm=(headTop.y-clamp.y)/s;
  const stemReal=Math.round(Math.hypot(dx_mm,dy_mm));
  const stemAng =Math.round(Math.atan2(dy_mm,dx_mm)*180/Math.PI);
  const spacers =Math.ceil(Math.max(0,dy_mm)/SPACER_MM);

  out.textContent=
    `Stem (user): ${state.stemLength} mm  —  Stem (real): ${stemReal} mm  |  Angle: ${stemAng}°  |  Spacers: ${spacers}`;
}

draw();
