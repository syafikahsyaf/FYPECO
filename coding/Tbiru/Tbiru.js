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
        imageTargetSrc: "/FYPECO/assets/targets/tongkitar/tongbiru.mind"
      });

      const { renderer, scene, camera } = mindarThree;
      scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));

      /* =====================
          BUTTON BACK + INFO
      ====================== */
      const backBtn = document.createElement("a");
      backBtn.innerHTML = `<img src="/FYPECO/image-menu/back.png" style="width:100%; height:auto; object-fit:contain;">`;
      backBtn.onclick = (event) => {
        event.stopPropagation();
        window.location.href = "/FYPECO/tongkitarsemula.html";
      };
      Object.assign(backBtn.style, {
        position: "fixed",
        top: "clamp(10px, 3vw, 20px)",
        left: "clamp(10px, 3vw, 20px)",
        width: "clamp(70px, 12vw, 110px)",
        cursor: "pointer",
        zIndex: "9999"
      });
      document.body.appendChild(backBtn);

      const infoBtn = document.createElement("div");
      infoBtn.innerHTML = "💡";
      Object.assign(infoBtn.style, {
        position: "fixed",
        top: "clamp(10px, 3vw, 20px)",
        right: "clamp(10px, 3vw, 20px)",
        fontSize: "clamp(32px, 8vw, 50px)",
        cursor: "pointer",
        zIndex: "9999",
        userSelect: "none"
      });
      document.body.appendChild(infoBtn);

      const infoText = document.createElement("div");
      Object.assign(infoText.style, {
        position: "fixed",
        bottom: "100px",
        left: "50%",
        transform: "translateX(-50%) scale(0.9)",
        padding: "14px 20px",
        maxWidth: "92%",
        background: "#8cd878",
        border: "3px solid #5faa48",
        color: "#1e4d14",
        fontSize: "clamp(16px, 4vw, 22px)",
        fontWeight: "bold",
        fontFamily: "'Comic Sans MS','Poppins'",
        borderRadius: "25px",
        boxShadow: "0px 8px 18px rgba(80,150,90,0.3)",
        display: "none",
        opacity: "0",
        pointerEvents: "none",
        transition: "all .25s ease",
        zIndex: "9999"
      });
      document.body.appendChild(infoText);

      let infoShown = false;
      infoBtn.onclick = (event) => {
        event.stopPropagation();
        infoShown = !infoShown;
        if (infoShown) {
          infoText.style.display = "block";
          setTimeout(() => {
            infoText.style.opacity = "1";
            infoText.style.transform = "translateX(-50%) scale(1)";
          }, 10);
        } else {
          infoText.style.opacity = "0";
          infoText.style.transform = "translateX(-50%) scale(0.9)";
          setTimeout(() => infoText.style.display = "none", 200);
        }
      };

      /* =====================
          AUDIO ON/OFF BUTTON
      ====================== */
      let soundOn = true;
      const soundBtn = document.createElement("div");
      soundBtn.innerHTML = "🔊";
      Object.assign(soundBtn.style, {
        position: "fixed",
        top: "clamp(10px, 3vw, 20px)",
        right: "clamp(60px, 15vw, 80px)",
        fontSize: "clamp(32px, 8vw, 50px)",
        cursor: "pointer",
        zIndex: "9999",
        userSelect: "none"
      });
      document.body.appendChild(soundBtn);

      soundBtn.onclick = (event) => {
        event.stopPropagation();
        soundOn = !soundOn;
        soundBtn.innerHTML = soundOn ? "🔊" : "🔇";

        const currentAudio = steps[currentStep]?.audioObj;
        if (currentAudio && targetFound) {
          if (soundOn) {
            if (!currentAudio.isPlaying) currentAudio.play();
          } else {
            if (currentAudio.isPlaying) currentAudio.stop();
          }
        }
      };

      /* =====================
          INSTRUCTION POPUP
      ====================== */
      const instructionOverlay = document.createElement("div");
      Object.assign(instructionOverlay.style, {
        position: "fixed",
        inset: "0",
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "99999",
        fontFamily: "'Poppins', sans-serif"
      });

      const instructionBox = document.createElement("div");
      Object.assign(instructionBox.style, {
        background: "#ffffff",
        padding: "clamp(18px, 4vw, 30px)",
        borderRadius: "25px",
        maxWidth: "92%",
        width: "clamp(260px, 80vw, 420px)",
        textAlign: "center",
        boxShadow: "0 15px 35px rgba(0,0,0,.3)"
      });

      instructionBox.innerHTML = `
        <h2 style="margin:0 0 10px; font-size:clamp(20px,4vw,26px)">📱 Cara Interaksi</h2>
         <p style="font-size:clamp(14px,3.5vw,18px); line-height:1.4; text-align:left; display:inline-block;">
           👉 <b>1 Tap(sentuhan)</b> : Tukar Paparan AR <br>
          👉 <b>Drag(Seret)</b> : Pusing model 3D<br>
          👉 <b>Pinch(Cubit)/Scroll</b> : Zoom Besar/Kecil<br><br>
           Arahkan kamera ke <b>Imej Sasaran</b> untuk mula.
        </p><br>
        <button id="startARBtn"
          style="
            margin-top:14px;
            padding:12px 22px;
            font-size:clamp(15px,4vw,18px);
            background:#8cd878;
            border:none;
            border-radius:18px;
            font-weight:bold;
            cursor:pointer;
          ">
          FAHAM & MULA
        </button>
      `;

      instructionOverlay.appendChild(instructionBox);
      document.body.appendChild(instructionOverlay);

      document.getElementById("startARBtn").onclick = () => {
        instructionOverlay.style.display = "none";
      };

      /* =====================
          Loader
      ====================== */
      const dLoader = new DRACOLoader();
      dLoader.setDecoderPath("/FYPECO/libs/draco/");
      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dLoader);

      const listener = new THREE.AudioListener();
      camera.add(listener);

      const steps = [
        { sceneName: "Jenis Sampah yang sesuai", glb: "/FYPECO/assets/models/Mtongkitar/kertasmain.glb", audio: "/FYPECO/assets/suara/Stongkitar/tbiru1.mp3", scale: 0.2, info: "Tong biru sesuai untuk sampah jenis kertas.", loaded: false },
        { sceneName: "Bahan boleh dikitar semula", glb: "/FYPECO/assets/models/Mtongkitar/kertas1.glb", audio: "/FYPECO/assets/suara/Stongkitar/tbiru2.mp3", scale: 0.2, info: "Bahan kertas yang boleh dikitar semula adalah seperti surat khabar, kotak kertas dan sampul surat.", loaded: false },
        { sceneName: "Bahan tak boleh dikitar semula", glb: "/FYPECO/assets/models/Mtongkitar/kertas2.glb", audio: "/FYPECO/assets/suara/Stongkitar/tbiru3.mp3", scale: 0.2, info: "Bahan kertas yang tak boleh kitar semula adalah seperti cawan kertas, kotak berminyak dan nota lekat.", loaded: false },
      ];

      let currentStep = 0;
      let targetFound = false;
      const mixers = [];
      const anchor = mindarThree.addAnchor(0);

      /* =====================
          Unlock Audio
      ====================== */
      const unlockAudio = () => {
        const ctx = THREE.AudioContext.getContext();
        if (ctx.state === "suspended") ctx.resume();
      };
      document.addEventListener("touchstart", unlockAudio, { once: true });
      document.addEventListener("click", unlockAudio, { once: true });

      /* =====================
          PROGRESS TEXT + BAR
      ====================== */
      const progressText = document.createElement("div");
      Object.assign(progressText.style, {
        position: "fixed",
        top: "14px",
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: "clamp(18px,4vw,24px)",
        fontWeight: "bold",
        fontFamily: "'Comic Sans MS','Comic Neue','Arial'",
        color: "black",
        background: "white",
        padding: "6px 16px",
        borderRadius: "12px",
        border: "2px solid #f0f0f0",
        zIndex: "9999",
        pointerEvents: "none",
        textAlign: "center",
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
      });
      document.body.appendChild(progressText);

      const progressBarContainer = document.createElement("div");
      Object.assign(progressBarContainer.style, {
        position: "fixed",
        bottom: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "80%",
        height: "14px",
        background: "rgba(200,200,200,0.4)",
        borderRadius: "12px",
        overflow: "hidden",
        zIndex: "9999"
      });
      document.body.appendChild(progressBarContainer);

      const progressBarFill = document.createElement("div");
      Object.assign(progressBarFill.style, {
        width: "0%",
        height: "100%",
        borderRadius: "12px",
        background: "linear-gradient(90deg, #ff9a9e, #fad0c4, #a1c4fd, #c2e9fb)",
        transition: "width 0.3s ease"
      });
      progressBarContainer.appendChild(progressBarFill);

      const updateProgress = (index) => {
        progressText.innerText = steps[index].sceneName;
        progressBarFill.style.width = `${((index + 1) / steps.length) * 100}%`;
      };

      /* =====================
          Load Step
      ====================== */
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
        audio.setLoop(false);
        audio.setRefDistance(999999);
        anchor.group.add(audio);
        step.audioObj = audio;

        step.loaded = true;
      }

      /* =====================
          Go To Step
      ====================== */
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

      anchor.onTargetFound = async () => {
        targetFound = true;
        instructionOverlay.style.display = "none";
        await goToStep(currentStep);
      };

      anchor.onTargetLost = () => {
        targetFound = false;
        steps.forEach(s => s.audioObj?.stop());
      };

      /* =====================
          INTERACTION LOGIC (ROTATE + ZOOM + TAP)
      ====================== */
      const MIN_SCALE = 0.05;
      const MAX_SCALE = 0.8;
      let initialPinchDistance = 0;
      let dragging = false;
      let moved = false; // Elak tap masa sedang rotate/zoom
      let sx = 0, sy = 0;

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let touchHandled = false;

      // Fungsi kira jarak pinch
      const getDistance = (touches) => Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);

      function tryTap(x, y) {
        if (!targetFound || moved) return; // Jika moved=true, jangan tap

        mouse.x = (x / window.innerWidth) * 2 - 1;
        mouse.y = -(y / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const currentModel = steps[currentStep].model;
        if (!currentModel) return;

        const hit = raycaster.intersectObject(currentModel, true);
        if (hit.length > 0) {
          goToStep((currentStep + 1) % steps.length);
        }
      }

      // --- TOUCH EVENTS ---
      document.addEventListener("touchstart", (e) => {
        if (!targetFound) return;
        dragging = true;
        moved = false;

        if (e.touches.length === 1) {
          sx = e.touches[0].clientX;
          sy = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          initialPinchDistance = getDistance(e.touches);
        }
      }, { passive: false });

      document.addEventListener("touchmove", (e) => {
        if (!dragging || !targetFound) return;

        if (e.touches.length === 1 && !initialPinchDistance) {
          // Rotate
          const dx = e.touches[0].clientX - sx;
          const dy = e.touches[0].clientY - sy;
          if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;

          if (moved && steps[currentStep].model) {
            steps[currentStep].model.rotation.y += dx * 0.008;
            steps[currentStep].model.rotation.x += dy * 0.008;
          }
          sx = e.touches[0].clientX;
          sy = e.touches[0].clientY;
        } 
        else if (e.touches.length === 2) {
          // Pinch Zoom
          moved = true;
          const currentDist = getDistance(e.touches);
          const diff = (currentDist - initialPinchDistance) * 0.001;
          
          if (steps[currentStep].model) {
            let newScale = steps[currentStep].model.scale.x + diff;
            newScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
            steps[currentStep].model.scale.setScalar(newScale);
          }
          initialPinchDistance = currentDist;
        }
      }, { passive: false });

      document.addEventListener("touchend", (e) => {
        dragging = false;
        initialPinchDistance = 0;
        if (e.touches.length === 0) {
          touchHandled = true;
          tryTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }
      });

      // --- MOUSE EVENTS ---
      document.addEventListener("mousedown", (e) => {
        if (!targetFound) return;
        dragging = true;
        moved = false;
        sx = e.clientX;
        sy = e.clientY;
      });

      document.addEventListener("mousemove", (e) => {
        if (!dragging || !targetFound) return;
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;

        if (moved && steps[currentStep].model) {
          steps[currentStep].model.rotation.y += dx * 0.008;
          steps[currentStep].model.rotation.x += dy * 0.008;
        }
        sx = e.clientX;
        sy = e.clientY;
      });

      document.addEventListener("mouseup", (e) => {
        dragging = false;
        if (touchHandled) {
          touchHandled = false;
          return;
        }
        tryTap(e.clientX, e.clientY);
      });

      // Mouse Wheel Zoom
      window.addEventListener("wheel", (e) => {
        if (!targetFound || !steps[currentStep].model) return;
        const zoomSpeed = 0.0005;
        let newScale = steps[currentStep].model.scale.x - e.deltaY * zoomSpeed;
        newScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
        steps[currentStep].model.scale.setScalar(newScale);
      }, { passive: false });

      /* =====================
          Start AR
      ====================== */
      await mindarThree.start();

      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        const delta = clock.getDelta();
        mixers.forEach(m => m.update(delta));
        renderer.render(scene, camera);
      });

    } catch (e) {
      console.error("AR ERROR:", e);
    }
  };

  start();
});
