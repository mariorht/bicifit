// bike-fit.js

const ids = [
  'stack','reach','seatTube','saddleHeight','ca','ha',
  'barHeight','barLength','stemLength',
  'RC','HT_LEN','WHEEL_R','SPACER_MM',
  'CRANK_LEN',
  'THIGH_L','SHIN_L','TORSO_L','upperArm','lowerArm','elbowAngle','HEAD_R',
  's'
];
const state = {};
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

let crankAngle = Math.PI/3, spinning = false;
document.getElementById('togglePedals').addEventListener('click', () => {
  spinning = !spinning;
  if (spinning) requestAnimationFrame(animate);
});
function animate() {
  if (spinning) {
    crankAngle += 0.05;
    draw();
    requestAnimationFrame(animate);
  }
}

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
    upperArm, lowerArm, HEAD_R, s
  } = state;
  const ca = rad(state.ca), ha = rad(state.ha);
  const manualAngleRad = rad(state.elbowAngle);

  // limpiar
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = '#1976d2';
  ctx.fillStyle   = '#1976d2';
  ctx.lineWidth   = 2;

  // puntos base
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

  // — Manillar y stem —
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
    x: bb.x + crankPx*Math.cos(crankAngle),
    y: bb.y + crankPx*Math.sin(crankAngle)
  };
  ctx.lineWidth = isHighlighted('CRANK_LEN') ? 4 : 2;
  line(bb, pedalR);
  dot(pedalR);

  // — Ciclista —
  ctx.strokeStyle = '#d32f2f';
  ctx.fillStyle   = '#d32f2f';

  // 11) Thigh (THIGH_L)
  ctx.lineWidth = isHighlighted('THIGH_L') ? 4 : 2;
  let knee = { x:(saddle.x+pedalR.x)/2, y:(saddle.y+pedalR.y)/2 };
  const kints = circleIntersections(saddle, THIGH_L*s, pedalR, SHIN_L*s);
  if (kints) knee = kints[0].x > saddle.x ? kints[0] : kints[1];
  line(saddle, knee);

  // 12) Shin (SHIN_L)
  ctx.lineWidth = isHighlighted('SHIN_L') ? 4 : 2;
  line(knee, pedalR);
  dot(knee);

// — ÁNGULO RODILLA — (arco por el lado corto)
{
  const v1 = { x: saddle.x - knee.x, y: saddle.y - knee.y };
  const v2 = { x: pedalR.x - knee.x, y: pedalR.y - knee.y };
  const dp = v1.x*v2.x + v1.y*v2.y;
  const a  = Math.acos(Math.min(1, Math.max(-1,
    dp/(Math.hypot(v1.x,v1.y)*Math.hypot(v2.x,v2.y)))
  ));
  const deg = Math.round(a * 180/Math.PI);
  const r   = 50 * s;
  const ang1 = Math.atan2(v1.y, v1.x);
  const ang2 = Math.atan2(v2.y, v2.x);

  // Calcular si debemos dibujar en sentido antihorario para el arco corto
  let delta = ang2 - ang1;
  if (delta < 0) delta += 2*Math.PI;
  const anticlock = delta > Math.PI;

  // Dibujar arco menor
  ctx.beginPath();
  ctx.arc(knee.x, knee.y, r, ang1, ang2, anticlock);
  ctx.stroke();

  // Calcular punto medio del arco para el texto
  let mid;
  if (!anticlock) {
    mid = ang1 + delta/2;
  } else {
    mid = ang1 - (2*Math.PI - delta)/2;
  }

  // Etiqueta del ángulo
  ctx.fillStyle = '#000';
  ctx.font      = '12px sans-serif';
  ctx.fillText(
    `${deg}°`,
    knee.x + (r + 30) * Math.cos(mid),
    knee.y + (r + 10) * Math.sin(mid)
  );
}

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
    const r  = 50 * s;
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

  // cálculo stem & espaciadores
  ctx.strokeStyle = '#1976d2';
  ctx.fillStyle   = '#000';
  ctx.font        = '14px sans-serif';
  const dx_mm    = (clamp.x - headTop.x)/s;
  const dy_mm    = (headTop.y - clamp.y)/s;
  const stemReal = Math.round(Math.hypot(dx_mm, dy_mm));
  const stemAng  = Math.round(Math.atan2(dy_mm, dx_mm)*180/Math.PI);
  const spacers  = Math.ceil(Math.max(0, dy_mm)/SPACER_MM);
  out.textContent =
    `Stem (user): ${state.stemLength} mm — Stem (real): ${stemReal} mm | `+
    `Angle: ${stemAng}° | Spacers: ${spacers}`;
}

draw();
