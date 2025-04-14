let video = document.getElementById('video');
let canvas = document.getElementById('overlay');
let ctx = canvas.getContext('2d');
let fileInput = document.getElementById('fileInput');

let homeScreen = document.getElementById('home');
let appScreen = document.getElementById('app');

const angleList = document.getElementById('angleList');
const noPersonBanner = document.getElementById('noPersonBanner');

let playing = false;
let usingCamera = false;
let detector;
let frameLoopTimeout = null;
const FRAME_INTERVAL = 100; // ms (~10 FPS)

const DETECTION_THRESHOLD = 0.3;

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
let currentSide = 'right';

// Pantalla inicial
document.getElementById('btnLoadVideo').addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', handleVideoUpload);

async function getAvailableCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  }
  

  async function startCameraWithFacingMode(facingMode) {
    usingCamera = true;
    showSpinner();
  
    homeScreen.style.display = 'none';
    appScreen.style.display = 'block';
  
    await loadModel();
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
  
      video.srcObject = stream;
  
      video.addEventListener('loadeddata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
  
        hideSpinner();
        video.play();
        processCameraFrameLoop();
      }, { once: true });
  
    } catch (err) {
      alert('Error al acceder a la cámara: ' + err.message);
      hideSpinner();
      homeScreen.style.display = 'flex';
    }
  }
  

  const cameraMenu = document.getElementById('cameraMenu');

  document.getElementById('btnUseCamera').addEventListener('click', async () => {
    try {
      // Obligatorio para desbloquear nombres de cámara
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(track => track.stop());
    } catch (err) {
      alert('Necesitas conceder acceso a la cámara para continuar.');
      return;
    }
  
    const cameras = await getAvailableCameras();
  
    if (cameras.length <= 1) {
      // Solo una cámara
      startCameraWithFacingMode('user');
    } else {
      // Mostrar menú personalizado
      cameraMenu.classList.remove('hidden');
    }
  });
  
  
  async function startCameraWithDeviceId(deviceId) {
    usingCamera = true;
    showSpinner();
  
    homeScreen.style.display = 'none';
    appScreen.style.display = 'block';
  
    await loadModel();
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
  
      video.srcObject = stream;
  
      video.addEventListener('loadeddata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
  
        hideSpinner();
        video.play();
        processCameraFrameLoop();
      }, { once: true });
  
    } catch (err) {
      alert('Error al acceder a la cámara: ' + err.message);
      hideSpinner();
      homeScreen.style.display = 'flex';
    }
  }
  

  document.getElementById('btnFrontCamera').addEventListener('click', () => {
    cameraMenu.classList.add('hidden');
    startCameraWithFacingMode('user');
  });
  
  document.getElementById('btnRearCamera').addEventListener('click', () => {
    cameraMenu.classList.add('hidden');
    startCameraWithFacingMode({ exact: 'environment' });
  });
  
  
  

// Modelo de pose
async function loadModel() {
  console.log('[INFO] Loading pose model...');
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
    }
  );
  console.log('[INFO] Model loaded successfully!');
}

async function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
  
    showSpinner();
  
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
  
      // Fuerza al primer frame (tiempo 0)
      video.currentTime = 0;
  
      // Espera al seek para asegurar que el frame está visible
      video.addEventListener('seeked', () => {
        requestAnimationFrame(() => {
            hideSpinner();
            processSingleFrame();
          });
      }, { once: true });
    }, { once: true });
  }
  
  
  

// Botones
document.querySelectorAll('.toggle-group .toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-group .toggle').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSide = btn.dataset.side;
      processSingleFrame();

    });
  });

  
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
      // Mostrar lista, ocultar banner
      angleList.classList.remove('hidden');
      noPersonBanner.classList.add('hidden');
      drawKeypoints(poses[0].keypoints);
    } else {
      // No hay persona → ocultar lista, mostrar banner
      angleList.classList.add('hidden');
      noPersonBanner.classList.remove('hidden');
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
    //console.log(keypoints);

    const side = currentSide;
    const prefix = side === 'right' ? 'right_' : 'left_';
    currentAngles = [];
  
    const allowedNames = new Set(keypointsBySide[side]);
  
    keypoints.forEach(kp => {
      if (kp.score > DETECTION_THRESHOLD && allowedNames.has(kp.name)) {
        //console.log(kp.name, kp.score);
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      }
    });
  
    drawSkeleton(keypoints, side);
  
    drawAngleBetween(keypoints, `${prefix}shoulder`, `${prefix}hip`, `${prefix}knee`, 'Cadera');
    drawAngleBetween(keypoints, `${prefix}elbow`, `${prefix}shoulder`, `${prefix}hip`, 'Hombro');
    drawAngleBetween(keypoints, `${prefix}shoulder`, `${prefix}elbow`, `${prefix}wrist`, 'Codo');
    drawAngleBetween(keypoints, `${prefix}hip`, `${prefix}knee`, `${prefix}ankle`, 'Rodilla');
    drawAngleBetween(keypoints, `${prefix}knee`, `${prefix}ankle`, `${prefix}foot_index`, 'Tobillo');
  
    updateAngleList(currentAngles);
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

let currentAngles = [];
function drawAngleBetween(keypoints, a, b, c, label) {
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

    // Dibuja el número sobre el punto
    ctx.fillStyle = 'yellow';
    ctx.font = '16px sans-serif';
    ctx.fillText(`${Math.round(angle)}°`, p2.x + 5, p2.y - 5);

    // Guarda el ángulo en la lista
    currentAngles.push({ joint: label, angle });
  }
}


function getKeypointByName(keypoints, name) {
  return keypoints.find(kp => kp.name === name && kp.score > DETECTION_THRESHOLD);
}


//Lista de ángulos
function updateAngleList(angleData) {
  angleList.innerHTML = angleData.map(({ joint, angle }) =>
    `<div>${joint}: ${Math.round(angle)}°</div>`
  ).join('');
}



// En directo
async function processCameraFrameLoop() {
    if (!usingCamera) return;
  
    const poses = await detector.estimatePoses(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    if (poses.length > 0 && poses[0].keypoints) {
      angleList.classList.remove('hidden');
      noPersonBanner.classList.add('hidden');
      drawKeypoints(poses[0].keypoints);
    } else {
      angleList.classList.add('hidden');
      noPersonBanner.classList.remove('hidden');
    }
  
    requestAnimationFrame(processCameraFrameLoop);
  }
  