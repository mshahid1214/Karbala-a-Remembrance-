/* ============================================================
   TRIBUTE.JS — hand-detection candle, only used on tribute.html
   ============================================================
   This file is only linked from tribute.html, since it's the one
   page with the camera. Everything runs in the visitor's browser —
   no video frame is ever uploaded or sent anywhere.

   How it works, in plain terms:
   1. When "Turn on camera" is clicked, we load Google's MediaPipe
      "Hands" library from a CDN (a public file host) and point it
      at the camera video.
   2. MediaPipe reports back 21 landmark points on the hand, 21
      times a second, for as long as a hand is visible.
   3. isHandOpen() checks whether the five fingertips are stretched
      further from the wrist than the knuckles — a simple, fast way
      to tell an open hand from a fist or a closed hand.
   4. If the hand stays open for about a third of a second, the
      candle lights.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const startBtn    = document.getElementById('startBtn');
  const manualBtn   = document.getElementById('manualBtn');
  const resetBtn    = document.getElementById('resetBtn');
  const statusEl    = document.getElementById('status');
  const camFrame    = document.getElementById('camFrame');
  const camRing     = document.getElementById('camRing');
  const video       = document.getElementById('cam');
  const candlePanel = document.getElementById('candlePanel');

  let mpHands = null;
  let mpCamera = null;
  let openStreak = 0;
  let lit = false;
  const FRAMES_NEEDED = 10; // about a third of a second of steady detection

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function lightCandle() {
    if (lit) return;
    lit = true;
    candlePanel.classList.add('lit');
    setStatus('A candle is lit, in remembrance.');
    resetBtn.hidden = false;
  }

  function extinguish() {
    lit = false;
    openStreak = 0;
    candlePanel.classList.remove('lit');
    resetBtn.hidden = true;
    setStatus(video.srcObject ? 'Looking for an open hand…' : 'Camera is off.');
  }

  resetBtn.addEventListener('click', extinguish);

  // Always-available manual path — for anyone without a camera, who
  // prefers not to share one, or who is navigating by keyboard/screen reader.
  manualBtn.addEventListener('click', () => lightCandle());

  // ---- is the hand open? -------------------------------------------
  // Compares each fingertip's distance from the wrist to its own
  // knuckle's distance from the wrist. An extended finger sits
  // noticeably further out than its knuckle.
  function distance(pointA, pointB) {
    return Math.hypot(
      pointA.x - pointB.x,
      pointA.y - pointB.y,
      (pointA.z || 0) - (pointB.z || 0)
    );
  }

  function isHandOpen(landmarks) {
    const wrist = landmarks[0];
    const fingerTipsAndKnuckles = [
      [4, 2],   // thumb
      [8, 5],   // index
      [12, 9],  // middle
      [16, 13], // ring
      [20, 17]  // pinky
    ];
    let extendedCount = 0;
    fingerTipsAndKnuckles.forEach(([tip, knuckle]) => {
      if (distance(wrist, landmarks[tip]) > distance(wrist, landmarks[knuckle]) * 1.15) {
        extendedCount++;
      }
    });
    return extendedCount >= 4;
  }

  function onResults(results) {
    const hasHand = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
    if (!hasHand) {
      openStreak = 0;
      camRing.classList.remove('active');
      if (!lit) setStatus('Looking for an open hand…');
      return;
    }
    const open = isHandOpen(results.multiHandLandmarks[0]);
    if (open) {
      camRing.classList.add('active');
      openStreak++;
      if (!lit) setStatus('Hold your hand steady…');
      if (openStreak >= FRAMES_NEEDED) lightCandle();
    } else {
      camRing.classList.remove('active');
      openStreak = 0;
      if (!lit) setStatus('Open your hand toward the camera.');
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.crossOrigin = 'anonymous';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  async function startCamera() {
    startBtn.disabled = true;
    setStatus('Asking for camera access…');
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');

      mpHands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });
      mpHands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
      });
      mpHands.onResults(onResults);

      mpCamera = new Camera(video, {
        onFrame: async () => { await mpHands.send({ image: video }); },
        width: 480,
        height: 480
      });
      await mpCamera.start();

      camFrame.classList.add('on');
      setStatus('Looking for an open hand…');
      startBtn.hidden = true;
    } catch (err) {
      console.error(err);
      setStatus('Camera unavailable — you can still light the candle by hand.');
      startBtn.disabled = false;
    }
  }

  startBtn.addEventListener('click', startCamera);
});
