# 📐 BiciFit WebApp

A browser-based web application for analyzing a cyclist's posture from a video or live camera feed. It detects the rider's pose, overlays key joint points, and computes angles of key joints in real-time.

---

## 🚴‍♂️ Features

- Upload local videos of a cyclist pedaling.
- Frame-by-frame pose estimation using **MoveNet** (TensorFlow.js).
- **Live camera mode** with real-time detection.
- Visualize either the left or right side of the body.
- Angle calculations and overlays for:
  - Hip
  - Shoulder
  - Elbow
  - Knee
  - Ankle
- App-style controls:
  - ▶️ Play/Pause
  - ⏮️⏭️ Previous/Next Frame
  - Left/Right side toggle
- Warning banner when no person is detected.

---

## 📦 Built With

- [TensorFlow.js](https://www.tensorflow.org/js) + [MoveNet](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection)
- Vanilla HTML, CSS, JavaScript
- Mobile-friendly UI design

---

## 📁 Project Structure

```
.
├── index.html
├── style.css
├── main.js

```

---

## 🛡️ Permissions

The app requests access to your camera only if you click on "📷 Use camera".

---

