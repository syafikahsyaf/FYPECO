import { loadAudio } from "/FYPECO/libs/loader.js";
import { DRACOLoader } from "/FYPECO/libs/three.js-r132/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "/FYPECO/libs/three.js-r132/examples/jsm/loaders/GLTFLoader.js";

const THREE = window.MINDAR.IMAGE.THREE;

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    try {
      /* =====================
          MindAR Init
      ====================== */
      const mindarThree = new window.MINDAR.IMAGE.MindARThree({
        container: document.body,
        imageTargetSrc: "/FYPECO/assets/targets/tongkitar/tongcoklat.mind"
      });

      const { renderer, scene, camera } = mindarThree;
      scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));

      /* =====================
          VARIABLES UNTUK ZOOM & RESPONSIVE
      ====================== */
      let initialPinchDistance = null;
      const MIN_SCALE = 0.05; 
      const MAX_SCALE = 0.8; 
      const isMobile = window.innerWidth < 768;
      // Set saiz berbeza ikut peranti secara automatik
      const defaultScale = isMobile ? 0.15 : 0.25;

      /* =====================
          BUTTON BACK + INFO
      ====================== */
      const backBtn = document.createElement("a");
      backBtn.innerHTML = `<img src="/FYPECO/image-menu/back.png" style="width:100%; height:auto; object-fit:contain;">`;
      backBtn.onclick = (event) => {
        event.stopPropagation();
        window.location.href = "/FYPECO/tongkitarsemula.html";
      };
      Object.assign(backBtn.style, { position: "fixed", top: "clamp(10px, 3vw, 20px)", left: "clamp(10px, 3vw, 20px)", width: "clamp(70px, 12vw, 110px)", cursor: "pointer", zIndex: "9999" });
      document.body.appendChild(backBtn);

      const infoBtn = document.createElement("div");
      infoBtn.innerHTML = "💡";
      Object.assign(infoBtn.style, { position: "fixed", top: "clamp(10px, 3vw, 20px)", right: "clamp(10px, 3vw, 20px)", fontSize: "clamp(32px, 8vw, 50px)", cursor: "pointer", zIndex: "9999", userSelect: "none" });
      document.body.appendChild(infoBtn);

      const infoText = document.createElement("div");
      Object.assign(infoText.style, { position: "fixed", bottom: "100px", left: "50%", transform: "translateX(-50%) scale(0.9)", padding: "14px 20px", maxWidth: "92%", background: "#8cd878", border: "3px solid #5faa48", color: "#1e4d14", fontSize: "clamp(16px, 4vw, 22px)", fontWeight: "bold", fontFamily: "'Comic Sans MS','Poppins'", borderRadius: "25px", boxShadow: "0px 8px 18px rgba(80,150,90,0.3)", display: "none", opacity: "0", pointerEvents: "none", transition: "all .25s ease", zIndex: "9999" });
      document.body.appendChild(infoText);

      let infoShown = false;
      infoBtn.onclick = (event) => {
        event.stopPropagation();
        infoShown = !infoShown;
        if (infoShown) {
          infoText.style.display = "block";
          setTimeout(() => { infoText.style.opacity = "1"; infoText.style.transform = "translateX(-50%) scale(1)"; }, 10);
        } else {
          infoText.style.opacity = "0"; infoText.style.transform = "translateX(-50%) scale(0.9)";
          setTimeout(() => infoText.style.display = "none", 200);
        }
      };

      /* =====================
          AUDIO BUTTON
      ====================== */
      let soundOn = true;
      const soundBtn = document.createElement("div");
      soundBtn.innerHTML = "🔊";
      Object.assign(soundBtn.style, { position: "fixed", top: "clamp(10px, 3vw, 20px)", right: "clamp(60px, 15vw, 80px)", fontSize: "clamp(32px, 8vw, 50px)", cursor: "pointer", zIndex: "9999", userSelect: "none" });
      document.body.appendChild(soundBtn);

      soundBtn.onclick = (event) => {
        event.stopPropagation();
        soundOn = !soundOn;
        soundBtn.innerHTML = soundOn ? "🔊" : "🔇";
        const currentAudio = steps[currentStep]?.audioObj;
        if (currentAudio && targetFound) {
          if (soundOn) { if (!currentAudio.isPlaying) currentAudio.play(); } 
          else { if (currentAudio.isPlaying) currentAudio.stop(); }
        }
      };

      /* =====================
          INSTRUCTION POPUP
      ====================== */
      const instructionOverlay = document.createElement("div");
      Object.assign(instructionOverlay.style, { position: "fixed", inset: "0", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: "99999", fontFamily: "'Poppins', sans-serif" });
      const instructionBox = document.createElement("div");
      Object.assign(instructionBox.style, { background: "#ffffff", padding: "clamp(18px, 4vw, 30px)", borderRadius: "25px", maxWidth: "92%", width: "clamp(260px, 80vw, 420px)", textAlign: "center", boxShadow: "0 15px 35px rgba(0,0,0,.3)" });
      instructionBox.innerHTML = `
        <h2 style="margin:0 0 10px; font-size:clamp(20px,4vw,26px)">📱 Cara Interaksi</h2>
        <p style="font-size:clamp(14px,3.5vw,18px); line-height:1.4">
          👉 <b>1 Tap</b> : Tukar Model AR <br>
          👉 <b>Drag</b> : Pusing Model 3D <br>
          👉 <b>Pinch/Scroll</b> : Besarkan/Kecilkan Model<br><br>
           Arahkan kamera ke <b>Imej Sasaran</b> untuk mula.
        </p>
        <button id="startARBtn" style="margin-top:14px; padding:12px 22px; font-size:clamp(15px,4vw,18px); background:#8cd878; border:none; border-radius:18px; font-weight:bold; cursor:pointer;">FAHAM & MULA</button>
      `;
      instructionOverlay.appendChild(instructionBox);
      document.body.appendChild(instructionOverlay);
      document.getElementById("startARBtn").onclick = () => { instructionOverlay.style.display = "none"; };

      /* =====================
          LOADER & STEPS (TONG COKLAT)
      ====================== */
      const dLoader = new DRACOLoader();
      dLoader.setDecoderPath("/FYPECO/libs/draco/");
      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dLoader);

      const listener = new THREE.AudioListener();
      camera.add(listener);

      const steps = [
        { sceneName: "Jenis Sampah yang sesuai", glb: "/FYPECO/assets/models/Mtongkitar/kacamain.glb", audio: "/FYPECO/assets/suara/Stongkitar/tcoklat1.mp3", scale: defaultScale, info: "Tong coklat sesuai untuk sampah jenis kaca.", loaded: false },
        { sceneName: "Bahan boleh dikitar semula", glb: "/FYPECO/assets/models/Mtongkitar/kaca1.glb", audio: "/FYPECO/assets/suara/Stongkitar/tcoklat2.mp3", scale: defaultScale, info: "Bahan kaca yang boleh dikitar semula adalah Balang kaca, botol kaca dan gelas kaca.", loaded: false },
        { sceneName: "Bahan tak boleh dikitar semula", glb: "/FYPECO/assets/models/Mtongkitar/kaca2.glb", audio: "/FYPECO/assets/suara/Stongkitar/tcoklat3.mp3", scale: defaultScale * 0.9, info: "Bahan kaca yang tak boleh kitar semula adalah seperti mentol lampu, cermin dan mangkuk seramik.", loaded: false }
      ];

      let currentStep = 0;
      let targetFound = false;
      const mixers = [];
      const anchor = mindarThree.addAnchor(0);

      /* =====================
          PROGRESS UI
      ====================== */
      const progressText = document.createElement("div");
      Object.assign(progressText.style, { position: "fixed", top: "14px", left: "50%", transform: "translateX(-50%)", fontSize: "clamp(18px,4vw,24px)", fontWeight: "bold", fontFamily: "'Comic Sans MS'", color: "black", background: "white", padding: "6px 16px", borderRadius: "12px", border: "2px solid #f0f0f0", zIndex: "9999", pointerEvents: "none", textAlign: "center", boxShadow: "0 4px 8px rgba(0,0,0,0.2)" });
      document.body.appendChild(progressText);

      const progressBarContainer = document.createElement("div");
      Object.assign(progressBarContainer.style, { position: "fixed", bottom: "12px", left: "50%", transform: "translateX(-50%)", width: "80%", height: "14px", background: "rgba(200,200,200,0.4)", borderRadius: "12px", overflow: "hidden", zIndex: "9999" });
      document.body.appendChild(progressBarContainer);

      const progressBarFill = document.createElement("div");
      Object.assign(progressBarFill.style, { width: "0%", height: "100%", borderRadius: "12px", background: "linear-gradient(90deg, #ff9a9e, #fad0c4, #a1c4fd, #c2e9fb)", transition: "width 0.3s ease" });
      progressBarContainer.appendChild(progressBarFill);

      const updateProgress = (index) => {
        progressText.innerText = steps[index].sceneName;
        progressBarFill.style.width = `${((index + 1) / steps.length) * 100}%`;
      };

      async function loadStep(index) {
        const step = steps[index];
        if (step.loaded) return;
        const gltf = await new Promise((res, rej) => gltfLoader.load(step.glb, res, undefined, rej));
        gltf.scene.scale.setScalar(step.scale);
        gltf.scene.visible = false;
        anchor.group.add(gltf.scene);
        step.model = gltf.scene;
        const mixer = new THREE.AnimationMixer(gltf.scene);
        if (gltf.animations.length) mixer.clipAction(gltf.animations[0]).play();
        mixers.push(mixer);
        const clip = await loadAudio(step.audio);
        const audio = new THREE.PositionalAudio(listener);
        audio.setBuffer(clip);
        audio.setRefDistance(999999);
        anchor.group.add(audio);
        step.audioObj = audio;
        step.loaded = true;
      }

      async function goToStep(index) {
        await loadStep(index);
        steps.forEach((s, i) => {
          if (s.model) s.model.visible = (i === index);
          if (s.audioObj && s.audioObj.isPlaying) s.audioObj.stop();
        });
        currentStep = index;
        infoText.innerText = steps[index].info;
        if (soundOn && targetFound && steps[index].audioObj) steps[index].audioObj.play();
        updateProgress(index);
      }

      anchor.onTargetFound = async () => { targetFound = true; instructionOverlay.style.display = "none"; await goToStep(currentStep); };
      anchor.onTargetLost = () => { targetFound = false; steps.forEach(s => s.audioObj?.stop()); };

      /* =====================
          INTERACTION LOGIC (TAP, ROTATE, ZOOM)
      ====================== */
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let dragging = false;
      let moved = false;
      let sx = 0, sy = 0;

      function tryTap(x, y) {
        if (!targetFound || moved) return; 
        mouse.x = (x / window.innerWidth) * 2 - 1;
        mouse.y = -(y / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hit = raycaster.intersectObject(steps[currentStep].model, true);
        if (hit.length > 0) goToStep((currentStep + 1) % steps.length);
      }

      // 1. Laptop Scroll Zoom
      document.addEventListener('wheel', (e) => {
        if (!targetFound || !steps[currentStep].model) return;
        let model = steps[currentStep].model;
        let scaleChange = e.deltaY * -0.0005;
        let newScale = Math.min(Math.max(model.scale.x + scaleChange, MIN_SCALE), MAX_SCALE);
        model.scale.setScalar(newScale);
      }, { passive: false });

      // 2. Mouse Events
      document.addEventListener("mousedown", e => { if (!targetFound) return; dragging = true; moved = false; sx = e.clientX; sy = e.clientY; });
      document.addEventListener("mousemove", e => {
        if (!dragging || !targetFound) return;
        const dx = e.clientX - sx; const dy = e.clientY - sy;
        if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
        if (moved && steps[currentStep].model) {
          steps[currentStep].model.rotation.y += dx * 0.008;
          steps[currentStep].model.rotation.x += dy * 0.008;
        }
        sx = e.clientX; sy = e.clientY;
      });
      document.addEventListener("mouseup", e => { if (dragging && !moved) tryTap(e.clientX, e.clientY); dragging = false; });

      // 3. Touch Events (Phone Rotate + Pinch Zoom)
      document.addEventListener("touchstart", e => {
        if (!targetFound) return;
        if (e.touches.length === 1) {
          dragging = true; moved = false;
          sx = e.touches[0].clientX; sy = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          initialPinchDistance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
        }
      });

      document.addEventListener("touchmove", e => {
        if (!targetFound || !steps[currentStep].model) return;
        if (e.touches.length === 1 && dragging) {
          const dx = e.touches[0].clientX - sx; const dy = e.touches[0].clientY - sy;
          if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
          if (moved) {
            steps[currentStep].model.rotation.y += dx * 0.008;
            steps[currentStep].model.rotation.x += dy * 0.008;
          }
          sx = e.touches[0].clientX; sy = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          moved = true; // Elak tap bila tengah pinch
          const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
          if (initialPinchDistance) {
            let factor = dist / initialPinchDistance;
            let newScale = Math.min(Math.max(steps[currentStep].model.scale.x * factor, MIN_SCALE), MAX_SCALE);
            steps[currentStep].model.scale.setScalar(newScale);
            initialPinchDistance = dist;
          }
        }
      });

      document.addEventListener("touchend", e => {
        if (!moved && e.changedTouches.length > 0) tryTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        dragging = false; initialPinchDistance = null;
      });

      /* =====================
          RENDER LOOP
      ====================== */
      await mindarThree.start();
      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        const delta = clock.getDelta();
        mixers.forEach(m => m.update(delta));
        renderer.render(scene, camera);
      });

    } catch (e) { console.error("AR ERROR:", e); }
  };
  start();
});
