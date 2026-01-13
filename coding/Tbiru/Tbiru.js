import { loadAudio } from "/FYPECO/libs/loader.js";
import { DRACOLoader } from "/FYPECO/libs/three.js-r132/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "/FYPECO/libs/three.js-r132/examples/jsm/loaders/GLTFLoader.js";

const THREE = window.MINDAR.IMAGE.THREE;

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    try {
      const mindarThree = new window.MINDAR.IMAGE.MindARThree({
        container: document.body,
        imageTargetSrc: "/FYPECO/assets/targets/tongkitar/tongbiru.mind"
      });

      const { renderer, scene, camera } = mindarThree;
      scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));

      let soundOn = true;
      let targetFound = false;
      let currentStep = 0;
      let isPinching = false;
      const mixers = [];

      /* =====================
          FUNGSI STOP AUDIO (KESELAMATAN)
      ====================== */
      const stopAllAudios = () => {
        steps.forEach(s => {
          if (s.audioObj && s.audioObj.isPlaying) {
            s.audioObj.stop();
          }
        });
      };

      /* =====================
          UI BUTTONS (BACK, INFO, SOUND)
      ====================== */
      const backBtn = document.createElement("a");
      backBtn.innerHTML = `<img src="/FYPECO/image-menu/back.png" style="width:100%; height:auto; object-fit:contain;">`;
      backBtn.onclick = (e) => { e.stopPropagation(); stopAllAudios(); window.location.href = "/FYPECO/tongkitarsemula.html"; };
      Object.assign(backBtn.style, { position: "fixed", top: "20px", left: "20px", width: "80px", zIndex: "9999", cursor: "pointer" });
      document.body.appendChild(backBtn);

      const infoBtn = document.createElement("div");
      infoBtn.innerHTML = "💡";
      Object.assign(infoBtn.style, { position: "fixed", top: "20px", right: "20px", fontSize: "40px", zIndex: "9999", cursor: "pointer" });
      document.body.appendChild(infoBtn);

      const infoText = document.createElement("div");
      Object.assign(infoText.style, { position: "fixed", bottom: "100px", left: "50%", transform: "translateX(-50%)", padding: "14px 20px", background: "#8cd878", border: "3px solid #5faa48", borderRadius: "25px", display: "none", zIndex: "9999", fontWeight: "bold", textAlign: "center", width: "80%" });
      document.body.appendChild(infoText);

      const soundBtn = document.createElement("div");
      soundBtn.innerHTML = "🔊";
      Object.assign(soundBtn.style, { position: "fixed", top: "20px", right: "80px", fontSize: "40px", zIndex: "9999", cursor: "pointer" });
      document.body.appendChild(soundBtn);

      soundBtn.onclick = (e) => {
        e.stopPropagation();
        soundOn = !soundOn;
        soundBtn.innerHTML = soundOn ? "🔊" : "🔇";
        if (!soundOn) stopAllAudios();
        else if (targetFound && steps[currentStep].audioObj) steps[currentStep].audioObj.play();
      };

      /* =====================
          STEPS DATA
      ====================== */
      const steps = [
        { sceneName: "Jenis Sampah yang sesuai", glb: "/FYPECO/assets/models/Mtongkitar/kertasmain.glb", audio: "/FYPECO/assets/suara/Stongkitar/tbiru1.mp3", scale: 0.2, info: "Tong biru sesuai untuk sampah jenis kertas.", loaded: false },
        { sceneName: "Bahan boleh dikitar semula", glb: "/FYPECO/assets/models/Mtongkitar/kertas1.glb", audio: "/FYPECO/assets/suara/Stongkitar/tbiru2.mp3", scale: 0.2, info: "Bahan kertas yang boleh dikitar semula adalah seperti surat khabar, kotak kertas dan sampul surat.", loaded: false },
        { sceneName: "Bahan tak boleh dikitar semula", glb: "/FYPECO/assets/models/Mtongkitar/kertas2.glb", audio: "/FYPECO/assets/suara/Stongkitar/tbiru3.mp3", scale: 0.2, info: "Bahan kertas yang tak boleh kitar semula adalah seperti cawan kertas, kotak berminyak dan nota lekat.", loaded: false }
      ];

      const anchor = mindarThree.addAnchor(0);
      const listener = new THREE.AudioListener();
      camera.add(listener);
      const gltfLoader = new GLTFLoader();

      /* =====================
          CORE FUNCTIONS
      ====================== */
      async function loadStep(index) {
        const step = steps[index];
        if (step.loaded) return;
        const gltf = await new Promise((res) => gltfLoader.load(step.glb, res));
        gltf.scene.scale.setScalar(step.scale);
        gltf.scene.visible = false;
        anchor.group.add(gltf.scene);
        step.model = gltf.scene;
        const clip = await loadAudio(step.audio);
        const audio = new THREE.Audio(listener); // Guna THREE.Audio untuk kawalan lebih stabil
        audio.setBuffer(clip);
        step.audioObj = audio;
        step.loaded = true;
      }

      async function goToStep(index) {
        stopAllAudios(); // MATIKAN SEMUA SEBELUM JALANKAN BARU
        await loadStep(index);
        
        steps.forEach((s, i) => {
          if (s.model) s.model.visible = (i === index);
        });

        currentStep = index;
        infoText.innerText = steps[index].info;
        
        if (soundOn && targetFound && steps[index].audioObj) {
          setTimeout(() => {
            if (!steps[index].audioObj.isPlaying) steps[index].audioObj.play();
          }, 100); 
        }
      }

      anchor.onTargetFound = () => { targetFound = true; goToStep(currentStep); };
      anchor.onTargetLost = () => { targetFound = false; stopAllAudios(); };

      /* =====================
          INTERACTION (ZOOM & TAP)
      ====================== */
      let dragging = false, moved = false, sx = 0, sy = 0;
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      function tryTap(x, y) {
        if (!targetFound || moved || isPinching) return;
        mouse.x = (x / window.innerWidth) * 2 - 1;
        mouse.y = -(y / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hit = raycaster.intersectObject(steps[currentStep].model, true);
        if (hit.length > 0) goToStep((currentStep + 1) % steps.length);
      }

      // Laptop Scroll Zoom
      window.addEventListener("wheel", (e) => {
        if (!targetFound || !steps[currentStep].model) return;
        let s = steps[currentStep].model.scale.x + (e.deltaY * -0.0005);
        steps[currentStep].model.scale.setScalar(Math.min(Math.max(s, 0.05), 0.8));
      }, { passive: false });

      // Touch Events
      document.addEventListener("touchstart", e => {
        if (e.touches.length === 2) isPinching = true;
        else { dragging = true; moved = false; sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
      });

      document.addEventListener("touchmove", e => {
        if (!targetFound || !steps[currentStep].model) return;
        if (e.touches.length === 1 && dragging) {
          const dx = e.touches[0].clientX - sx;
          const dy = e.touches[0].clientY - sy;
          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
          steps[currentStep].model.rotation.y += dx * 0.01;
          sx = e.touches[0].clientX; sy = e.touches[0].clientY;
        }
      });

      document.addEventListener("touchend", e => {
        if (!moved && !isPinching && e.changedTouches.length > 0) tryTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        dragging = false; isPinching = false;
      });

      await mindarThree.start();
      renderer.setAnimationLoop(() => { renderer.render(scene, camera); });

    } catch (e) { console.error(e); }
  };
  start();
});
