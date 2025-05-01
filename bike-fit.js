// bike-fit.js

const ids = [
  'stack','reach','seatTube','saddleHeight','ca','ha',
  'barHeight','barLength','stemLength',
  'RC','HT_LEN','WHEEL_R','SPACER_MM',
  'CRANK_LEN',
  'THIGH_L','SHIN_L','TORSO_L','upperArm','lowerArm','elbowAngle','HEAD_R',
  'footLength','cleatOffset','s'
];
const state = {};

const crankSlider = document.getElementById('crankSlider');
state.crankAngle  = crankSlider.value;
crankSlider.value = state.crankAngle;

// Detener automática al empezar a arrastrar
crankSlider.addEventListener('mousedown', () => { spinning = false; });
crankSlider.addEventListener('touchstart', () => { spinning = false; });


ids.forEach(id => {
  const el = document.getElementById(id);
  state[id] = +el.value;
  el.addEventListener('input', e => {
    state[id] = +e.target.value || 0;
    draw();
  });
});

// hover-key para resaltar
state.hoverKey = null;
document.querySelectorAll('.controls ul li').forEach(li => {
  const key = li.dataset.key;
  li.addEventListener('mouseenter', () => { state.hoverKey = key; draw(); });
  li.addEventListener('mouseleave', () => { state.hoverKey = null; draw(); });
});
function isHighlighted(...keys) {
  return keys.includes(state.hoverKey);
}

const canvas = document.getElementById('preview');
const ctx    = canvas.getContext('2d');
const out    = document.getElementById('calc');

let spinning = false;
document.getElementById('togglePedals').addEventListener('click', () => {
  spinning = !spinning;
  if (spinning) requestAnimationFrame(animate);
});

function animate() {
  if (spinning) {
    state.crankAngle = (state.crankAngle + 0.05) % (2 * Math.PI);
    crankSlider.value = state.crankAngle;
    draw();
    requestAnimationFrame(animate);
  }
}


crankSlider.addEventListener('input', e => {
  spinning = false;
  state.crankAngle = +e.target.value;
  draw();
});


function rad(d) { return d * Math.PI / 180; }
function line(a,b){ ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
function dot(p){ ctx.beginPath(); ctx.arc(p.x,p.y,4,0,2*Math.PI); ctx.fill(); }
function circleIntersections(A,rA,B,rB){
  const dx=B.x-A.x, dy=B.y-A.y, d=Math.hypot(dx,dy);
  if(d>rA+rB||d<Math.abs(rA-rB)||d===0) return null;
  const a=(rA*rA - rB*rB + d*d)/(2*d),
        h=Math.sqrt(Math.max(0, rA*rA - a*a)),
        xm=A.x + a*dx/d, ym=A.y + a*dy/d,
        rx=-dy*(h/d), ry= dx*(h/d);
  return [{x:xm+rx,y:ym+ry},{x:xm-rx,y:ym-ry}];
}

function draw() {
  // extraer valores
  const {
    RC, HT_LEN, WHEEL_R, SPACER_MM, CRANK_LEN,
    THIGH_L, SHIN_L, TORSO_L,
    upperArm, lowerArm, HEAD_R,
    footLength, cleatOffset,
    s
  } = state;
  const ca = rad(state.ca), ha = rad(state.ha);
  const manualAngleRad = rad(state.elbowAngle);

  // limpiar
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = '#1976d2';
  ctx.fillStyle   = '#1976d2';
  ctx.lineWidth   = 2;

  // puntos base de la bici...
  const bb        = { x: canvas.width/2, y: canvas.height - 120 };
  const rearAxle  = { x: bb.x - RC*s, y: bb.y };
  const seatTop   = {
    x: bb.x - state.seatTube*Math.cos(ca)*s,
    y: bb.y - state.seatTube*Math.sin(ca)*s
  };
  const saddle    = {
    x: bb.x - state.saddleHeight*Math.cos(ca)*s,
    y: bb.y - state.saddleHeight*Math.sin(ca)*s
  };
  const headTop   = { x: bb.x + state.reach*s,       y: bb.y - state.stack*s };
  const headBot   = {
    x: headTop.x + HT_LEN*Math.cos(ha)*s,
    y: headTop.y + HT_LEN*Math.sin(ha)*s
  };
  const forkPx    = (bb.y - headBot.y)/Math.sin(ha);
  const frontAxle = { x: headBot.x + forkPx*Math.cos(ha), y: bb.y };

  // manillar y stem...
  const uHT       = { x: Math.cos(ha), y: Math.sin(ha) };
  const spacerTop = {
    x: headTop.x - state.barHeight*uHT.x*s,
    y: headTop.y - state.barHeight*uHT.y*s
  };
  const clamp     = {
    x: headTop.x + state.stemLength*s - state.barHeight*uHT.x*s,
    y: headTop.y - state.barHeight*uHT.y*s
  };
  const hood      = 40*s;
  const reachBar  = state.barLength*s;
  const drop      = 110*s;
  const hoodEnd   = { x: clamp.x + hood,     y: clamp.y };
  const curveEnd  = { x: hoodEnd.x + reachBar, y: hoodEnd.y + drop };
  const tailEnd   = { x: curveEnd.x - 20*s,   y: curveEnd.y };

  // 1) barHeight
  ctx.lineWidth = isHighlighted('barHeight') ? 4 : 2;
  line(headTop, spacerTop);

  // 2) stemLength
  ctx.lineWidth = isHighlighted('stemLength') ? 4 : 2;
  line(spacerTop, clamp);
  dot(clamp);

  // 3) barLength (reach/drop)
  ctx.lineWidth = isHighlighted('barLength') ? 4 : 2;
  line(clamp, hoodEnd);
  ctx.beginPath();
    ctx.moveTo(hoodEnd.x, hoodEnd.y);
    ctx.quadraticCurveTo(
      hoodEnd.x + reachBar*0.5,
      hoodEnd.y + drop*0.5,
      curveEnd.x,
      curveEnd.y
    );
  ctx.stroke();
  ctx.lineWidth = isHighlighted('barLength') ? 4 : 2;
  line(curveEnd, tailEnd);

  // — Cuadro —
  // a) Chainstay (RC)
  ctx.lineWidth = isHighlighted('RC') ? 4 : 2;
  line(rearAxle, bb);

  // b) Down tube (reach & stack)
  ctx.lineWidth = isHighlighted('reach','stack') ? 4 : 2;
  line(bb, headBot);

  // c) Head tube (HT_LEN & ha)
  ctx.lineWidth = isHighlighted('HT_LEN','ha') ? 4 : 2;
  line(headBot, headTop);
  dot(headBot);

  // d) Fork
  ctx.lineWidth = isHighlighted('HT_LEN','ha') ? 4 : 2;
  line(headBot, frontAxle);
  dot(frontAxle);

  // e) Top tube (stack & reach)
  ctx.lineWidth = isHighlighted('stack','reach') ? 4 : 2;
  line(headTop, seatTop);

  // f) Seat tube (seatTube & ca)
  ctx.lineWidth = isHighlighted('seatTube','ca') ? 4 : 2;
  line(seatTop, bb);

  // g) Seat stay
  ctx.lineWidth = 2;
  line(seatTop, rearAxle);

  // h) Seatpost (saddleHeight)
  ctx.lineWidth = isHighlighted('saddleHeight') ? 4 : 2;
  line(seatTop, saddle);

  // i) Saddle
  ctx.lineWidth = 2;
  line({ x: saddle.x-15, y: saddle.y }, { x: saddle.x+15, y: saddle.y });

  // puntos del cuadro
  [bb, rearAxle, frontAxle, seatTop, headTop, headBot, saddle].forEach(dot);

  // — Ruedas guía (WHEEL_R) —
  ctx.setLineDash([4,6]);
  ctx.lineWidth = isHighlighted('WHEEL_R') ? 4 : 2;
  ctx.beginPath(); ctx.arc(rearAxle.x, rearAxle.y, WHEEL_R*s, 0,2*Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(frontAxle.x, frontAxle.y, WHEEL_R*s, 0,2*Math.PI); ctx.stroke();
  ctx.setLineDash([]);

  // — Cranks y pedales (CRANK_LEN) —
  const crankPx = CRANK_LEN*s;
  const pedalR  = {
    x: bb.x + crankPx*Math.cos(state.crankAngle),
    y: bb.y + crankPx*Math.sin(state.crankAngle)
  };
  ctx.lineWidth = isHighlighted('CRANK_LEN') ? 4 : 2;
  ctx.strokeStyle = '#1976d2';
  line(bb, pedalR);
  dot(pedalR);

  // — Ciclista — en rojo
  ctx.strokeStyle = '#d32f2f';
  ctx.fillStyle   = '#d32f2f';

    // Cala en el pedal
    const cleat = { x: pedalR.x, y: pedalR.y };
    dot(cleat);
    // Talón atrás de la cala
    const heel = { x: cleat.x - cleatOffset*s, y: cleat.y };
    dot(heel);
    // Rodilla: intersección muslo–espinilla
    let knee = { x:(saddle.x+heel.x)/2, y:(saddle.y+heel.y)/2 };
    const kints2 = circleIntersections(saddle, THIGH_L*s, heel, SHIN_L*s);
    if(kints2) knee = kints2.find(p=>p.x > saddle.x) || kints2[0];
    ctx.lineWidth = isHighlighted('THIGH_L')?4:2; line(saddle, knee);
    ctx.lineWidth = isHighlighted('SHIN_L')?4:2; line(knee, heel);

    // Ángulo de rodilla (arco corto)
    {
      const v1 = { x: saddle.x - knee.x, y: saddle.y - knee.y };
      const v2 = { x: heel.x  - knee.x, y: heel.y  - knee.y };
      const dp = v1.x * v2.x + v1.y * v2.y;
      const angle = Math.acos(Math.min(1, Math.max(-1,
        dp / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y)))
      ));
      const r = 50 * s;
      const a1 = Math.atan2(v1.y, v1.x), a2 = Math.atan2(v2.y, v2.x);
      // calcular delta y arco corto
      let delta = a2 - a1;
      if (delta < 0) delta += 2 * Math.PI;
      const anticlock = delta > Math.PI;
      // dibujar arco corto
      ctx.beginPath();
      ctx.arc(knee.x, knee.y, r, a1, a2, anticlock);
      ctx.stroke();
      // etiqueta
      ctx.fillStyle = '#000';
      ctx.font = '12px sans-serif';
      let mid;
      if (!anticlock) {
        mid = a1 + delta / 2;
      } else {
        mid = a1 - (2 * Math.PI - delta) / 2;
      }
      ctx.fillText(
        `${Math.round(angle * 180/Math.PI)}°`,
        knee.x + (r + 30) * Math.cos(mid),
        knee.y + (r + 15) * Math.sin(mid)
      );
    }

  
    // Pie: línea talón→punta
    ctx.lineWidth = isHighlighted('footLength')?4:2;
    const toe = { x: heel.x + footLength*s, y: heel.y };
    line(heel, toe);
  

  // resto del ciclista (torso, brazos, cabeza) idéntico al original...
  // 13) Torso y hombro (TORSO_L)
  const L_torso = TORSO_L*s, L1 = upperArm*s, L2 = lowerArm*s;
  const D       = Math.sqrt(L1*L1 + L2*L2 - 2*L1*L2*Math.cos(manualAngleRad));
  let shoulder  = { x:(saddle.x+hoodEnd.x)/2, y:(saddle.y+hoodEnd.y)/2 };
  const shInts2 = circleIntersections(saddle, L_torso, hoodEnd, D);
  if (shInts2) shoulder = shInts2[0].y < shInts2[1].y ? shInts2[0] : shInts2[1];
  ctx.lineWidth = isHighlighted('TORSO_L') ? 4 : 2;
  line(saddle, shoulder);

  // — ÁNGULO CADERA (en saddle) —
  {
    const v1 = { x: shoulder.x - saddle.x, y: shoulder.y - saddle.y };
    const v2 = { x: knee.x    - saddle.x, y: knee.y    - saddle.y };
    const dp = v1.x*v2.x + v1.y*v2.y;
    const a  = Math.acos(Math.min(1, Math.max(-1, dp/(Math.hypot(v1.x,v1.y)*Math.hypot(v2.x,v2.y)))));
    const deg= Math.round(a * 180/Math.PI);
    const r  = 75 * s;
    const ang1 = Math.atan2(v1.y, v1.x), ang2 = Math.atan2(v2.y, v2.x);
    ctx.beginPath(); ctx.arc(saddle.x, saddle.y, r, ang1, ang2); ctx.stroke();
    let delta = ang2 - ang1; if (delta<0) delta+=2*Math.PI;
    const mid = ang1 + delta/2;
    ctx.fillText(`${deg}°`,
      saddle.x + (r+6)*Math.cos(mid),
      saddle.y + (r+6)*Math.sin(mid)
    );
  }

  // 14) Upper arm (upperArm)
  ctx.lineWidth = isHighlighted('upperArm') ? 4 : 2;
  let elbow = { x:(shoulder.x+hoodEnd.x)/2, y:(shoulder.y+hoodEnd.y)/2 };
  const eInts = circleIntersections(shoulder, L1, hoodEnd, L2);
  if (eInts) elbow = eInts.find(e=>e.y>shoulder.y) || eInts[0];
  line(shoulder, elbow);

  // 15) Lower arm (lowerArm)
  ctx.lineWidth = isHighlighted('lowerArm') ? 4 : 2;
  line(elbow, hoodEnd);

  // — ÁNGULO CODO —
  {
    const v1 = { x: shoulder.x - elbow.x, y: shoulder.y - elbow.y };
    const v2 = { x: hoodEnd.x   - elbow.x, y: hoodEnd.y   - elbow.y };
    const dp = v1.x*v2.x + v1.y*v2.y;
    const a  = Math.acos(Math.min(1, Math.max(-1, dp/(Math.hypot(v1.x,v1.y)*Math.hypot(v2.x,v2.y)))));
    const deg= Math.round(a * 180/Math.PI);
    const r  = 50 * s;
    const ang1 = Math.atan2(v1.y, v1.x), ang2 = Math.atan2(v2.y, v2.x);
    ctx.beginPath(); ctx.arc(elbow.x, elbow.y, r, ang1, ang2); ctx.stroke();
    let delta = ang2 - ang1; if (delta<0) delta+=2*Math.PI;
    const mid = ang1 + delta/2;
    ctx.fillText(`${deg}°`,
      elbow.x + (r+6)*Math.cos(mid),
      elbow.y + (r+6)*Math.sin(mid)
    );
  }

  // 16) Head (HEAD_R)
  ctx.lineWidth = isHighlighted('HEAD_R') ? 4 : 2;
  ctx.beginPath();
    ctx.arc(shoulder.x, shoulder.y - HEAD_R*s, HEAD_R*s, 0,2*Math.PI);
  ctx.stroke();

}

draw();
