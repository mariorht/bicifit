let video = document.getElementById('video');
let fileInput = document.getElementById('fileInput');
let canvas = document.getElementById('overlay');
let ctx = canvas.getContext('2d');

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
    if (video.ended || video.currentTime >= video.duration) {
      console.log('[INFO] Video ended. Restarting...');
      video.currentTime = 0; // reiniciar
      setTimeout(processFrameLoop, FRAME_INTERVAL);
      return;
    }
  
    console.log(`[INFO] Processing at ${video.currentTime.toFixed(2)}s`);
  
    try {
      const poses = await detector.estimatePoses(video);
      console.log('[INFO] Poses received:', poses);
  
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      if (poses.length > 0 && poses[0].keypoints) {
        drawKeypoints(poses[0].keypoints);
      }
    } catch (err) {
      console.error('[ERROR] Pose estimation failed:', err);
    }
  
    // Avanzar al siguiente frame
    video.currentTime += FRAME_INTERVAL / 1000;
  
    setTimeout(processFrameLoop, FRAME_INTERVAL);
  }
  

function drawKeypoints(keypoints) {
  keypoints.forEach(kp => {
    if (kp.score > 0.5) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
    }
  });
}
