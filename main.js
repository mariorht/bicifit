let video = document.getElementById('video');
let fileInput = document.getElementById('fileInput');
let canvas = document.getElementById('overlay');
let ctx = canvas.getContext('2d');

let playing = false;
let frameLoopTimeout = null;

const btnPlay = document.getElementById('btnPlay');
const btnPause = document.getElementById('btnPause');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');


const keypointsBySide = {
    left: [
      'left_eye', 'left_ear',
      'left_shoulder', 'left_elbow', 'left_wrist',
      'left_hip', 'left_knee', 'left_ankle'
    ],
    right: [
      'right_eye', 'right_ear',
      'right_shoulder', 'right_elbow', 'right_wrist',
      'right_hip', 'right_knee', 'right_ankle'
    ]
};

const skeletonBySide = {
    left: [
        ['left_shoulder', 'left_elbow'],
        ['left_elbow', 'left_wrist'],
        ['left_shoulder', 'left_hip'],
        ['left_hip', 'left_knee'],
        ['left_knee', 'left_ankle']
    ],
    right: [
        ['right_shoulder', 'right_elbow'],
        ['right_elbow', 'right_wrist'],
        ['right_shoulder', 'right_hip'],
        ['right_hip', 'right_knee'],
        ['right_knee', 'right_ankle']
    ]
};

function getKeypointByName(keypoints, name) {
    return keypoints.find(kp => kp.name === name && kp.score > 0.5);
}
  
  
  

let detector;
const FRAME_INTERVAL = 100; // en ms (~10 FPS)

fileInput.addEventListener('change', handleVideoUpload);

async function handleVideoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  video.src = url;

  video.addEventListener('loadeddata', async () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    await loadModel();

    try {
      await video.play();         // Necesario para cargar correctamente
      video.pause();              // ¡Lo controlamos nosotros!
      console.log('[INFO] Video playback ready.');

      processFrameLoop();         // Aquí empieza el análisis manual frame a frame
    } catch (err) {
      console.error('[ERROR] Could not start playback:', err);
    }
  });
}

async function loadModel() {
  console.log('[INFO] Loading pose model...');
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
  console.log('[INFO] Model loaded successfully!');
}

async function processFrameLoop() {
  if (!playing) return;

  if (video.currentTime >= video.duration) {
    video.currentTime = 0;
    return setTimeout(processFrameLoop, FRAME_INTERVAL);
  }

  await processSingleFrame();

  video.currentTime += FRAME_INTERVAL / 1000;
  frameLoopTimeout = setTimeout(processFrameLoop, FRAME_INTERVAL);
}

async function processSingleFrame() {
    try {
      const poses = await detector.estimatePoses(video);
      console.log(`[INFO] Poses received at ${video.currentTime.toFixed(2)}s:`, poses);
  
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      if (poses.length > 0 && poses[0].keypoints) {
        drawKeypoints(poses[0].keypoints);
      }
    } catch (err) {
      console.error('[ERROR] Pose estimation failed:', err);
    }
  }
  
  

function drawKeypoints(keypoints) {
    const side = document.getElementById('sideSelect').value;
    const allowedNames = new Set(keypointsBySide[side]);

    // Dibuja puntos
    keypoints.forEach(kp => {
        if (kp.score > 0.5 && allowedNames.has(kp.name)) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
        }
    });

    // Dibuja esqueleto
    drawSkeleton(keypoints, side);

    // Dibuja ángulos
    if (side === 'right') {
        drawAngleBetween(keypoints, 'right_shoulder', 'right_elbow', 'right_wrist');
        drawAngleBetween(keypoints, 'right_hip', 'right_knee', 'right_ankle');
        drawAngleBetween(keypoints, 'right_elbow', 'right_shoulder', 'right_hip');
    } else {
        drawAngleBetween(keypoints, 'left_shoulder', 'left_elbow', 'left_wrist');
        drawAngleBetween(keypoints, 'left_hip', 'left_knee', 'left_ankle');
        drawAngleBetween(keypoints, 'left_elbow', 'left_shoulder', 'left_hip');
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
  


btnPlay.addEventListener('click', () => {
    if (!playing) {
      playing = true;
      console.log('[INFO] ▶️ Play');
      processFrameLoop();
    }
  });
  
  btnPause.addEventListener('click', () => {
    playing = false;
    console.log('[INFO] ⏸️ Pause');
    clearTimeout(frameLoopTimeout);
  });
  
  btnNext.addEventListener('click', () => {
    playing = false;
  
    // Si estamos al final, reiniciar al principio
    if (video.currentTime + FRAME_INTERVAL / 1000 >= video.duration) {
      video.currentTime = 0;
    } else {
      video.currentTime += FRAME_INTERVAL / 1000;
    }
  
    setTimeout(() => {
      processSingleFrame();
    }, 50);
  });
  
  btnPrev.addEventListener('click', () => {
    playing = false;
  
    // Si estamos al principio, saltar al final
    if (video.currentTime <= 0) {
      video.currentTime = Math.max(0, video.duration - FRAME_INTERVAL / 1000);
    } else {
      video.currentTime = Math.max(0, video.currentTime - FRAME_INTERVAL / 1000);
    }
  
    setTimeout(() => {
      processSingleFrame();
    }, 50);
  });
  