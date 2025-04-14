let video = document.getElementById('video');
let canvas = document.getElementById('overlay');
let ctx = canvas.getContext('2d');
let fileInput = document.getElementById('fileInput');

let homeScreen = document.getElementById('home');
let appScreen = document.getElementById('app');

let playing = false;
let detector;
let frameLoopTimeout = null;
const FRAME_INTERVAL = 100; // ms (~10 FPS)

//Spinner
const loadingSpinner = document.getElementById('loadingSpinner');

function showSpinner() {
  loadingSpinner.classList.remove('hidden');
}

function hideSpinner() {
  loadingSpinner.classList.add('hidden');
}


// Controles
const btnPlayPause = document.getElementById('btnPlayPause');
const btnNext = document.getElementById('btnNext');
const btnPrev = document.getElementById('btnPrev');
const sideSelect = document.getElementById('sideSelect');

// Pantalla inicial
document.getElementById('btnLoadVideo').addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', handleVideoUpload);

// Modelo de pose
async function loadModel() {
  console.log('[INFO] Loading pose model...');
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true
    }
  );
  console.log('[INFO] Model loaded successfully!');
}

async function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
  
    showSpinner(); // 👈 Muestra el spinner
  
    const url = URL.createObjectURL(file);
    video.src = url;
  
    video.addEventListener('loadeddata', async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
  
      await loadModel();
      await video.play();
      video.pause();
  
      homeScreen.style.display = 'none';
      appScreen.style.display = 'block';
      hideSpinner(); // 👈 Oculta el spinner
  
      processSingleFrame();
    });
  }
  
  

// Botones
btnPlayPause.addEventListener('click', () => {
    playing = !playing;
  
    if (playing) {
      btnPlayPause.textContent = '⏸️';
      processFrameLoop();
    } else {
      btnPlayPause.textContent = '▶️';
      clearTimeout(frameLoopTimeout);
    }
  });
  

btnNext.addEventListener('click', () => {
  playing = false;
  if (video.currentTime + FRAME_INTERVAL / 1000 >= video.duration) {
    video.currentTime = 0;
  } else {
    video.currentTime += FRAME_INTERVAL / 1000;
  }
  setTimeout(() => processSingleFrame(), 50);
});

btnPrev.addEventListener('click', () => {
  playing = false;
  if (video.currentTime <= 0) {
    video.currentTime = Math.max(0, video.duration - FRAME_INTERVAL / 1000);
  } else {
    video.currentTime -= FRAME_INTERVAL / 1000;
  }
  setTimeout(() => processSingleFrame(), 50);
});

// Procesamiento por frame
async function processFrameLoop() {
  if (!playing) return;

  if (video.currentTime >= video.duration) {
    video.currentTime = 0;
  }

  await processSingleFrame();
  video.currentTime += FRAME_INTERVAL / 1000;
  frameLoopTimeout = setTimeout(processFrameLoop, FRAME_INTERVAL);
}

async function processSingleFrame() {
  const poses = await detector.estimatePoses(video);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (poses.length > 0 && poses[0].keypoints) {
    drawKeypoints(poses[0].keypoints);
  }
}

// Dibujo
const keypointsBySide = {
  left: [
    'left_shoulder', 'left_elbow', 'left_wrist',
    'left_hip', 'left_knee', 'left_ankle',
    'left_foot_index'
  ],
  right: [
    'right_shoulder', 'right_elbow', 'right_wrist',
    'right_hip', 'right_knee', 'right_ankle',
    'right_foot_index'
  ]
};

const skeletonBySide = {
  left: [
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    ['left_shoulder', 'left_hip'],
    ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'],
    ['left_ankle', 'left_foot_index']
  ],
  right: [
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    ['right_shoulder', 'right_hip'],
    ['right_hip', 'right_knee'],
    ['right_knee', 'right_ankle'],
    ['right_ankle', 'right_foot_index']
  ]
};

function drawKeypoints(keypoints) {
  const side = sideSelect.value;
  const allowedNames = new Set(keypointsBySide[side]);

  // Puntos
  keypoints.forEach(kp => {
    if (kp.score > 0.5 && allowedNames.has(kp.name)) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
    }
  });

  // Esqueleto
  drawSkeleton(keypoints, side);

  // Ángulos
  if (side === 'right') {
    drawAngleBetween(keypoints, 'right_shoulder', 'right_hip', 'right_knee'); // Cadera
    drawAngleBetween(keypoints, 'right_elbow', 'right_shoulder', 'right_hip'); // Hombro
    drawAngleBetween(keypoints, 'right_shoulder', 'right_elbow', 'right_wrist'); // Codo
    drawAngleBetween(keypoints, 'right_hip', 'right_knee', 'right_ankle'); // Rodilla
  } else {
    drawAngleBetween(keypoints, 'left_shoulder', 'left_hip', 'left_knee');
    drawAngleBetween(keypoints, 'left_elbow', 'left_shoulder', 'left_hip');
    drawAngleBetween(keypoints, 'left_shoulder', 'left_elbow', 'left_wrist');
    drawAngleBetween(keypoints, 'left_hip', 'left_knee', 'left_ankle');
  }
}

function drawSkeleton(keypoints, side) {
  const pairs = skeletonBySide[side];
  for (const [a, b] of pairs) {
    const kp1 = getKeypointByName(keypoints, a);
    const kp2 = getKeypointByName(keypoints, b);
    if (kp1 && kp2) {
      ctx.beginPath();
      ctx.moveTo(kp1.x, kp1.y);
      ctx.lineTo(kp2.x, kp2.y);
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function drawAngleBetween(keypoints, a, b, c) {
  const p1 = getKeypointByName(keypoints, a);
  const p2 = getKeypointByName(keypoints, b);
  const p3 = getKeypointByName(keypoints, c);

  if (p1 && p2 && p3) {
    const v1 = [p1.x - p2.x, p1.y - p2.y];
    const v2 = [p3.x - p2.x, p3.y - p2.y];
    const dot = v1[0]*v2[0] + v1[1]*v2[1];
    const mag1 = Math.hypot(...v1);
    const mag2 = Math.hypot(...v2);
    const angle = Math.acos(dot / (mag1 * mag2)) * 180 / Math.PI;

    ctx.fillStyle = 'yellow';
    ctx.font = '16px sans-serif';
    ctx.fillText(`${Math.round(angle)}°`, p2.x + 5, p2.y - 5);
  }
}

function getKeypointByName(keypoints, name) {
  return keypoints.find(kp => kp.name === name && kp.score > 0.5);
}
