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
    const a=(rA*rA - rB*rB + d*d)/(2*d), h=Math.sqrt(Math.max(0, rA*rA - a*a));
    const xm=A.x + a*dx/d, ym=A.y + a*dy/d;
    const rx=-dy*(h/d), ry= dx*(h/d);
    return [{x:xm+rx,y:ym+ry},{x:xm-rx,y:ym-ry}];
  }
  
  function draw() {
    const {
      RC, HT_LEN, WHEEL_R, SPACER_MM, CRANK_LEN,
      THIGH_L, SHIN_L, TORSO_L,
      upperArm, lowerArm, HEAD_R,
      footLength, cleatOffset,
      s
    } = state;
    const ca = rad(state.ca), ha = rad(state.ha);
    const manualAngleRad = rad(state.elbowAngle);
  
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = '#1976d2'; ctx.fillStyle = '#1976d2'; ctx.lineWidth = 2;
  
    // --- BICI --- (mismo que antes)
    // ... código de la bici omitido para brevedad
  
    // --- PEDAL Y CALA ---
    const crankPx = CRANK_LEN * s;
    const pedalR  = { x: canvas.width/2 + ( -state.RC + state.reach )*s + crankPx * Math.cos(crankAngle),
                      y: canvas.height-120 + crankPx * Math.sin(crankAngle) };
    ctx.strokeStyle = '#1976d2'; ctx.lineWidth = isHighlighted('CRANK_LEN')?4:2;
    line({ x: canvas.width/2 - state.RC * s, y: canvas.height-120 }, pedalR);
    dot(pedalR);
  
    // Cala fija en pedal
    const cleat = { x: pedalR.x, y: pedalR.y };
    dot(cleat);
  
    // Talón
    const heel = { x: cleat.x - cleatOffset * s, y: cleat.y };
    dot(heel);
  
    // Rodilla: intersección muslo–espinilla contra talón
    let knee = { x:(saddle.x + heel.x)/2, y:(saddle.y + heel.y)/2 };
    const kints = circleIntersections(saddle, THIGH_L*s, heel, SHIN_L*s);
    if(kints) knee = kints.find(p=>p.y > saddle.y) || kints[0];
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = isHighlighted('THIGH_L')?4:2; line(saddle, knee);
    ctx.lineWidth = isHighlighted('SHIN_L')?4:2; line(knee, heel);
    dot(knee);
  
    // Ángulo de rodilla
    {
      const v1 = { x: saddle.x - knee.x, y: saddle.y - knee.y };
      const v2 = { x: heel.x  - knee.x, y: heel.y  - knee.y };
      const dp = v1.x*v2.x + v1.y*v2.y;
      const angle = Math.acos(Math.min(1, Math.max(-1, dp/(Math.hypot(v1.x,v1.y)*Math.hypot(v2.x,v2.y)))));
      const r = 30 * s;
      const a1 = Math.atan2(v1.y, v1.x), a2 = Math.atan2(v2.y, v2.x);
      ctx.beginPath();
      ctx.arc(knee.x, knee.y, r, a1, a2);
      ctx.stroke();
      ctx.fillStyle = '#000'; ctx.font = '12px sans-serif';
      const mid = (a1 + a2) / 2;
      ctx.fillText(`${Math.round(angle*180/Math.PI)}°`, knee.x + (r+10)*Math.cos(mid), knee.y + (r+10)*Math.sin(mid));
    }
  
    // Pie
    ctx.strokeStyle='#d32f2f';
    ctx.lineWidth = isHighlighted('footLength')?4:2;
    const toe = { x: heel.x + footLength * s, y: heel.y };
    line(heel, toe);
  
    // Ángulo tobillo (igual que antes)
    {
      const v1 = { x: knee.x-heel.x, y: knee.y-heel.y };
      const v2 = { x: toe.x -heel.x, y: toe.y -heel.y };
      const dp = v1.x*v2.x + v1.y*v2.y;
      const r = 30*s;
      const a1 = Math.atan2(v1.y,v1.x), a2 = Math.atan2(v2.y,v2.x);
      ctx.beginPath(); ctx.arc(heel.x, heel.y, r, a1, a2); ctx.stroke();
    }
  
    // resto (torso, brazos, cabeza, stem) permanece igual
  }
  
  draw();