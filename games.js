/**
 * FIFA 2026 Interactive Fan Hub - HTML5 Canvas Mini-Games Engine (4 Games Suite)
 * Smooth 60fps rendering, responsive touch/mouse controls, particle systems, and local persistence.
 * RESET TO ZERO MANDATE INCLUDED.
 */

(function () {
  'use strict';

  // ==========================================
  // STORAGE & CONSTANTS (RESET TO ZERO)
  // ==========================================
  const HIGH_SCORES_KEY = 'fifa2026_minigames_highscores_v3_zero';
  let highScores = {
    penalty: 0,
    keepy: 0,
    goalie: 0,
    crossbar: 0
  };

  // Canvas context holders
  let pCanvas, pCtx;
  let kCanvas, kCtx;
  let gCanvas, gCtx;
  let cCanvas, cCtx;

  // Active state flags
  let activeTab = 'penalty'; // 'penalty', 'keepy', 'goalie', 'crossbar'

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function initGames() {
    loadHighScores();

    pCanvas = document.getElementById('penaltyCanvas');
    kCanvas = document.getElementById('keepyCanvas');
    gCanvas = document.getElementById('goalieCanvas');
    cCanvas = document.getElementById('crossbarCanvas');

    if (pCanvas && pCanvas.getContext) {
      pCtx = pCanvas.getContext('2d');
      initPenaltyGame();
    }

    if (kCanvas && kCanvas.getContext) {
      kCtx = kCanvas.getContext('2d');
      initKeepyGame();
    }

    if (gCanvas && gCanvas.getContext) {
      gCtx = gCanvas.getContext('2d');
      initGoalieGame();
    }

    if (cCanvas && cCanvas.getContext) {
      cCtx = cCanvas.getContext('2d');
      initCrossbarGame();
    }

    setupGameNavigation();
    updateScoreDisplays();

    // Start Master Render Loop
    requestAnimationFrame(masterGameLoop);
  }

  function loadHighScores() {
    const saved = localStorage.getItem(HIGH_SCORES_KEY);
    if (saved) {
      try {
        highScores = JSON.parse(saved);
      } catch (e) {
        highScores = { penalty: 0, keepy: 0, goalie: 0, crossbar: 0 };
      }
    } else {
      highScores = { penalty: 0, keepy: 0, goalie: 0, crossbar: 0 };
    }
  }

  function saveHighScores() {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores));
    updateScoreDisplays();
  }

  function updateScoreDisplays() {
    // Game 1
    const pHigEl = document.getElementById('penaltyHighDisplay');
    const pHomeEl = document.getElementById('launcherPenaltyScore');
    if (pHigEl) pHigEl.textContent = `${highScores.penalty}`;
    if (pHomeEl) pHomeEl.textContent = `${highScores.penalty} GOALS`;

    // Game 2
    const kHigEl = document.getElementById('keepyHighDisplay');
    const kHomeEl = document.getElementById('launcherKeepyScore');
    if (kHigEl) kHigEl.textContent = `${highScores.keepy}`;
    if (kHomeEl) kHomeEl.textContent = `${highScores.keepy} KICKS`;

    // Game 3
    const gHigEl = document.getElementById('goalieHighDisplay');
    const gHomeEl = document.getElementById('launcherGoalieScore');
    if (gHigEl) gHigEl.textContent = `${highScores.goalie}`;
    if (gHomeEl) gHomeEl.textContent = `${highScores.goalie} SAVES`;

    // Game 4
    const cHigEl = document.getElementById('crossbarHighDisplay');
    const cHomeEl = document.getElementById('launcherCrossbarScore');
    if (cHigEl) cHigEl.textContent = `${highScores.crossbar}`;
    if (cHomeEl) cHomeEl.textContent = `${highScores.crossbar} PTS`;
  }

  function setupGameNavigation() {
    const tabBtns = document.querySelectorAll('[data-selectgame]');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const game = btn.getAttribute('data-selectgame');
        selectGameTab(game);
      });
    });

    document.getElementById('resetPenaltyBtn')?.addEventListener('click', resetPenaltyRound);
    document.getElementById('resetKeepyBtn')?.addEventListener('click', resetKeepyRound);
    document.getElementById('resetGoalieBtn')?.addEventListener('click', resetGoalieRound);
    document.getElementById('resetCrossbarBtn')?.addEventListener('click', resetCrossbarRound);

    window.selectMiniGameTab = selectGameTab;
    window.reloadMiniGamesScores = () => {
      highScores = { penalty: 0, keepy: 0, goalie: 0, crossbar: 0 };
      resetPenaltyRound();
      resetKeepyRound();
      resetGoalieRound();
      resetCrossbarRound();
      updateScoreDisplays();
    };

    window.addEventListener('resize', handleResize);
  }

  function selectGameTab(gameName) {
    activeTab = gameName;
    const tabBtns = document.querySelectorAll('[data-selectgame]');
    const wraps = {
      penalty: document.getElementById('game-penalty-wrapper'),
      keepy: document.getElementById('game-keepy-wrapper'),
      goalie: document.getElementById('game-goalie-wrapper'),
      crossbar: document.getElementById('game-crossbar-wrapper')
    };

    tabBtns.forEach(b => {
      if (b.getAttribute('data-selectgame') === gameName) {
        b.classList.add('active', 'bg-[#00FF66]', 'text-black', 'shadow-[0_0_20px_rgba(0,255,102,0.4)]');
        b.classList.remove('text-gray-400', 'bg-[#0A192F]');
      } else {
        b.classList.remove('active', 'bg-[#00FF66]', 'text-black', 'shadow-[0_0_20px_rgba(0,255,102,0.4)]');
        b.classList.add('text-gray-400', 'bg-[#0A192F]');
      }
    });

    Object.keys(wraps).forEach(k => {
      if (wraps[k]) {
        if (k === gameName) wraps[k].classList.remove('hidden');
        else wraps[k].classList.add('hidden');
      }
    });

    handleResize();
  }

  function handleResize() {
    // Canvases maintain internal 800x500 fixed resolution
  }

  function getCanvasCoords(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY
    };
  }

  // ==========================================
  // HELPER PARTICLE ENGINE
  // ==========================================
  class Particle {
    constructor(x, y, color, speed, size, life) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = size;
      this.vx = (Math.random() - 0.5) * speed;
      this.vy = (Math.random() - 0.5) * speed - 1.5;
      this.life = life;
      this.maxLife = life;
      this.alpha = 1;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.18; // gravity
      this.life--;
      this.alpha = Math.max(0, this.life / this.maxLife);
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ==========================================
  // COMMON STADIUM BACKGROUND RENDERER
  // ==========================================
  function drawNightStadium(ctx, bannerText, accentColor = '#00FF66') {
    // 1. Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 180);
    skyGrad.addColorStop(0, '#040b16');
    skyGrad.addColorStop(1, '#0c223f');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 800, 180);

    // Crowd bokeh
    ctx.fillStyle = 'rgba(212,175,55,0.18)';
    for (let i = 0; i < 35; i++) {
      ctx.beginPath();
      ctx.arc((i * 43) % 800, (i * 19) % 110 + 20, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // LED Banner
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 130, 800, 24);
    ctx.fillStyle = '#000000';
    ctx.font = '900 12px monospace';
    ctx.fillText(bannerText, 100 + (Date.now() / 45) % 400 - 200, 146);

    // 2. Pitch
    const pitchGrad = ctx.createLinearGradient(0, 154, 0, 500);
    pitchGrad.addColorStop(0, '#113c20');
    pitchGrad.addColorStop(1, '#1e6638');
    ctx.fillStyle = pitchGrad;
    ctx.fillRect(0, 154, 800, 346);

    // Turf stripes
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 154; y < 500; y += 40) {
      ctx.fillRect(0, y, 800, 20);
    }
  }

  function drawGoalFrame(ctx, gl) {
    // Net mesh
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = gl.left; x <= gl.right; x += 18) {
      ctx.moveTo(x, gl.top);
      ctx.lineTo(x + (x > 400 ? 18 : -18), gl.bottom);
    }
    for (let y = gl.top; y <= gl.bottom; y += 14) {
      ctx.moveTo(gl.left, y);
      ctx.lineTo(gl.right, y);
    }
    ctx.stroke();

    // Cylindrical posts
    ctx.fillStyle = '#eeeeee';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    ctx.fillRect(gl.left - 6, gl.top, 8, gl.bottom - gl.top);
    ctx.fillRect(gl.right - 2, gl.top, 8, gl.bottom - gl.top);
    ctx.fillRect(gl.left - 6, gl.top - 6, gl.right - gl.left + 12, 8);
    ctx.shadowBlur = 0;
  }

  function drawFootball(ctx, x, y, radius, rot) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, radius + 3, radius * 0.85, radius * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(rot);

    // White base
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Shading
    const sGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius);
    sGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
    sGrad.addColorStop(1, 'rgba(110,110,110,0.85)');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Pentagon patches
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      const px = Math.cos(a) * radius * 0.72;
      const py = Math.sin(a) * radius * 0.72;
      ctx.beginPath();
      ctx.arc(px, py, radius * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function showOverlay(id, title, sub, color) {
    const overlay = document.getElementById(id);
    const titleEl = document.getElementById(`${id}Text`);
    const subEl = document.getElementById(`${id}Subtext`);
    if (!overlay || !titleEl) return;

    titleEl.textContent = title;
    titleEl.style.color = color;
    if (subEl) subEl.textContent = sub;
    overlay.style.opacity = '1';
  }

  // ==========================================
  // GAME 1: PENALTY SHOOTOUT ENGINE
  // ==========================================
  let penaltyState = {
    score: 0,
    shots: 0,
    status: 'aiming',
    ball: { x: 400, y: 430, targetX: 400, targetY: 430, radius: 18, scale: 1, rotation: 0 },
    goalie: { x: 400, y: 110, width: 70, height: 80, vx: 4.5, direction: 1 },
    goal: { left: 200, right: 600, top: 40, bottom: 135 },
    particles: []
  };

  function initPenaltyGame() {
    resetPenaltyRound();
    pCanvas.addEventListener('pointerdown', handlePenaltyClick);
  }

  function resetPenaltyRound() {
    penaltyState.score = 0;
    penaltyState.shots = 0;
    const sEl = document.getElementById('penaltyScoreDisplay');
    const shEl = document.getElementById('penaltyShotsDisplay');
    if (sEl) sEl.textContent = '0';
    if (shEl) shEl.textContent = '0';
    resetPenaltyBall();
  }

  function resetPenaltyBall() {
    penaltyState.status = 'aiming';
    penaltyState.ball.x = 400;
    penaltyState.ball.y = 430;
    penaltyState.ball.scale = 1;
    penaltyState.ball.rotation = 0;
    penaltyState.particles = [];

    const overlay = document.getElementById('penaltyOverlay');
    if (overlay) overlay.style.opacity = '0';
  }

  function handlePenaltyClick(evt) {
    if (penaltyState.status !== 'aiming' || activeTab !== 'penalty') return;
    const pos = getCanvasCoords(pCanvas, evt);
    if (pos.y > 450) return;

    penaltyState.status = 'flying';
    penaltyState.ball.targetX = pos.x;
    penaltyState.ball.targetY = pos.y;
    penaltyState.shots++;
    document.getElementById('penaltyShotsDisplay').textContent = `${penaltyState.shots}`;

    for (let i = 0; i < 15; i++) {
      penaltyState.particles.push(new Particle(400, 430, '#ffffff', 8, Math.random() * 4 + 2, 25));
    }
  }

  function updatePenaltyPhysics() {
    const g = penaltyState.goalie;
    const boost = Math.min(penaltyState.score * 0.45, 7);
    g.x += (g.vx + boost) * g.direction;

    if (g.x - g.width / 2 < penaltyState.goal.left + 20) g.direction = 1;
    else if (g.x + g.width / 2 > penaltyState.goal.right - 20) g.direction = -1;
    if (Math.random() < 0.02) g.direction *= -1;

    if (penaltyState.status === 'flying') {
      const b = penaltyState.ball;
      b.x += (b.targetX - b.x) * 0.14;
      b.y += (b.targetY - b.y) * 0.14;
      b.scale = Math.max(0.55, b.scale * 0.98);
      b.rotation += 0.35;

      penaltyState.particles.push(new Particle(b.x, b.y, 'rgba(0,255,102,0.4)', 2, 3, 10));

      if (Math.abs(b.y - b.targetY) < 5 && Math.abs(b.x - b.targetX) < 5) {
        const hitG = Math.abs(b.x - g.x) < (g.width / 2 + 15) && Math.abs(b.y - g.y) < (g.height / 2 + 15);
        if (hitG) {
          penaltyState.status = 'resetting';
          for (let i = 0; i < 20; i++) penaltyState.particles.push(new Particle(b.x, b.y, '#FFD700', 10, 4, 30));
          showOverlay('penaltyOverlay', 'SAVED!', 'Great block by the Goalkeeper!', '#FF4500');
          setTimeout(resetPenaltyBall, 1500);
        } else {
          const inGoal = b.x > penaltyState.goal.left + 15 && b.x < penaltyState.goal.right - 15 && b.y > penaltyState.goal.top + 10 && b.y < penaltyState.goal.bottom - 5;
          if (inGoal) {
            penaltyState.status = 'celebrating';
            penaltyState.score++;
            document.getElementById('penaltyScoreDisplay').textContent = `${penaltyState.score}`;
            if (penaltyState.score > highScores.penalty) {
              highScores.penalty = penaltyState.score;
              saveHighScores();
            }
            if (window.addFanTokens) window.addFanTokens(5);
            for (let i = 0; i < 50; i++) penaltyState.particles.push(new Particle(b.x, b.y, i % 2 === 0 ? '#00FF66' : '#D4AF37', 15, Math.random() * 5 + 3, 45));
            showOverlay('penaltyOverlay', 'GOAL!', '+5 Reward Tokens Earned!', '#00FF66');
            setTimeout(resetPenaltyBall, 1500);
          } else {
            penaltyState.status = 'resetting';
            showOverlay('penaltyOverlay', 'MISSED!', 'Just wide of the target!', '#FFA500');
            setTimeout(resetPenaltyBall, 1500);
          }
        }
      }
    }

    for (let i = penaltyState.particles.length - 1; i >= 0; i--) {
      penaltyState.particles[i].update();
      if (penaltyState.particles[i].life <= 0) penaltyState.particles.splice(i, 1);
    }
  }

  function drawGoalieSprite(ctx, g) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, g.height / 2, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0a192f';
    ctx.fillRect(-15, 10, 10, 30);
    ctx.fillRect(5, 10, 10, 30);

    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-20, -25, 40, 40);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-12, -20, 6, 30);
    ctx.fillRect(6, -20, 6, 30);

    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-35, -20, 15, 10);
    ctx.fillRect(20, -20, 15, 10);
    ctx.fillStyle = '#FF3300';
    ctx.beginPath();
    ctx.arc(-35, -15, 8, 0, Math.PI * 2);
    ctx.arc(35, -15, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(0, -32, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.arc(0, -35, 11, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function renderPenaltyScene() {
    pCtx.clearRect(0, 0, 800, 500);
    drawNightStadium(pCtx, '🏆 FIFA WORLD CUP 2026 • PENALTY SHOOTOUT ARENA • LIVE ⚽', '#00FF66');

    // Penalty box
    pCtx.strokeStyle = 'rgba(255,255,255,0.7)';
    pCtx.lineWidth = 3;
    pCtx.strokeRect(100, 154, 600, 226);
    pCtx.fillStyle = '#ffffff';
    pCtx.beginPath();
    pCtx.arc(400, 310, 5, 0, Math.PI * 2);
    pCtx.fill();

    drawGoalFrame(pCtx, penaltyState.goal);
    drawGoalieSprite(pCtx, penaltyState.goalie);
    penaltyState.particles.forEach(p => p.draw(pCtx));
    drawFootball(pCtx, penaltyState.ball.x, penaltyState.ball.y, penaltyState.ball.radius * penaltyState.ball.scale, penaltyState.ball.rotation);

    if (penaltyState.status === 'aiming') {
      pCtx.strokeStyle = 'rgba(0,255,102,0.5)';
      pCtx.setLineDash([4, 4]);
      pCtx.beginPath();
      pCtx.moveTo(400, 430);
      pCtx.lineTo(400, 135);
      pCtx.stroke();
      pCtx.setLineDash([]);
    }
  }

  // ==========================================
  // GAME 2: KEEPY-UPPY PRO ENGINE
  // ==========================================
  let keepyState = {
    streak: 0,
    status: 'idle',
    ball: { x: 400, y: 150, vx: 1.5, vy: 0, radius: 24, rotation: 0, vRot: 0.05 },
    gravity: 0.28,
    particles: []
  };

  function initKeepyGame() {
    resetKeepyRound();
    kCanvas.addEventListener('pointerdown', handleKeepyClick);
  }

  function resetKeepyRound() {
    keepyState.streak = 0;
    keepyState.status = 'idle';
    keepyState.ball.x = 400;
    keepyState.ball.y = 150;
    keepyState.ball.vx = (Math.random() - 0.5) * 3;
    keepyState.ball.vy = 2;
    keepyState.ball.vRot = 0.05;
    keepyState.particles = [];

    const stEl = document.getElementById('keepyStreakDisplay');
    if (stEl) stEl.textContent = '0';
    const overlay = document.getElementById('keepyOverlay');
    if (overlay) overlay.style.opacity = '0';
  }

  function handleKeepyClick(evt) {
    if (activeTab !== 'keepy') return;
    const pos = getCanvasCoords(kCanvas, evt);
    const b = keepyState.ball;

    if (keepyState.status === 'dropped') {
      resetKeepyRound();
      keepyState.status = 'bouncing';
      return;
    }
    if (keepyState.status === 'idle') keepyState.status = 'bouncing';

    const dist = Math.sqrt((pos.x - b.x) ** 2 + (pos.y - b.y) ** 2);
    if (dist < b.radius + 35) {
      keepyState.streak++;
      document.getElementById('keepyStreakDisplay').textContent = `${keepyState.streak}`;
      if (keepyState.streak > highScores.keepy) {
        highScores.keepy = keepyState.streak;
        saveHighScores();
      }
      if (keepyState.streak > 0 && keepyState.streak % 10 === 0) {
        if (window.addFanTokens) window.addFanTokens(5);
        if (window.showToast) window.showToast(`🔥 ${keepyState.streak} Kick Streak! (+5 PTS)`, '🤹');
      }

      b.vy = -10.5 - Math.min(keepyState.streak * 0.08, 3.5);
      b.vx = -(pos.x - b.x) * 0.18 + (Math.random() - 0.5) * 2;
      b.vRot = (pos.x - b.x) * 0.01;

      for (let i = 0; i < 25; i++) {
        keepyState.particles.push(new Particle(pos.x, pos.y, i % 2 === 0 ? '#D4AF37' : '#00FF66', 10, Math.random() * 5 + 2, 35));
      }
    }
  }

  function updateKeepyPhysics() {
    if (keepyState.status !== 'bouncing') return;
    const b = keepyState.ball;
    b.vy += keepyState.gravity;
    b.vx *= 0.995;
    b.x += b.vx;
    b.y += b.vy;
    b.rotation += b.vRot;

    if (b.x - b.radius < 20) { b.x = 20 + b.radius; b.vx *= -0.8; }
    else if (b.x + b.radius > 780) { b.x = 780 - b.radius; b.vx *= -0.8; }

    const floor = 450;
    if (b.y + b.radius >= floor) {
      b.y = floor - b.radius;
      keepyState.status = 'dropped';
      for (let i = 0; i < 35; i++) keepyState.particles.push(new Particle(b.x, floor, '#EF4444', 12, Math.random() * 6 + 3, 40));
      showOverlay('keepyOverlay', 'DROPPED!', `Final Streak: ${keepyState.streak} Kicks. Tap canvas to restart.`, '#EF4444');
    }

    for (let i = keepyState.particles.length - 1; i >= 0; i--) {
      keepyState.particles[i].update();
      if (keepyState.particles[i].life <= 0) keepyState.particles.splice(i, 1);
    }
  }

  function renderKeepyScene() {
    kCtx.clearRect(0, 0, 800, 500);
    
    // Arena Sky
    const skyGrad = kCtx.createLinearGradient(0, 0, 0, 450);
    skyGrad.addColorStop(0, '#051122');
    skyGrad.addColorStop(1, '#133b6e');
    kCtx.fillStyle = skyGrad;
    kCtx.fillRect(0, 0, 800, 450);

    // Spotlight
    kCtx.save();
    const spot = kCtx.createRadialGradient(400, 0, 10, 400, 350, 400);
    spot.addColorStop(0, 'rgba(212, 175, 55, 0.15)');
    spot.addColorStop(1, 'rgba(212, 175, 55, 0)');
    kCtx.fillStyle = spot;
    kCtx.beginPath();
    kCtx.moveTo(380, 0); kCtx.lineTo(420, 0); kCtx.lineTo(750, 450); kCtx.lineTo(50, 450);
    kCtx.closePath(); kCtx.fill();
    kCtx.restore();

    // Watermark
    kCtx.fillStyle = 'rgba(255,255,255,0.06)';
    kCtx.font = '900 140px Inter, sans-serif';
    kCtx.textAlign = 'center';
    kCtx.fillText(`${keepyState.streak}`, 400, 280);

    // Turf
    kCtx.fillStyle = '#0c2e17';
    kCtx.fillRect(0, 450, 800, 50);
    kCtx.strokeStyle = '#D4AF37';
    kCtx.lineWidth = 4;
    kCtx.beginPath(); kCtx.moveTo(0, 450); kCtx.lineTo(800, 450); kCtx.stroke();

    keepyState.particles.forEach(p => p.draw(kCtx));
    drawFootball(kCtx, keepyState.ball.x, keepyState.ball.y, keepyState.ball.radius, keepyState.ball.rotation);

    if (keepyState.status === 'idle') {
      kCtx.fillStyle = '#D4AF37';
      kCtx.font = '800 18px Inter, sans-serif';
      kCtx.fillText('👆 TAP BALL TO LAUNCH KICK STREAK!', 400, 360);
    }
  }

  // ==========================================
  // GAME 3: GOALIE GLOVE REFLEX CHALLENGE
  // ==========================================
  let goalieState = {
    saves: 0,
    conceded: 0,
    status: 'playing',
    glove: { x: 400, y: 80, radius: 35 },
    balls: [],
    spawnTimer: 0,
    particles: []
  };

  function initGoalieGame() {
    resetGoalieRound();
    gCanvas.addEventListener('pointermove', (evt) => {
      if (activeTab !== 'goalie') return;
      const pos = getCanvasCoords(gCanvas, evt);
      goalieState.glove.x = Math.max(220, Math.min(580, pos.x));
      goalieState.glove.y = Math.max(45, Math.min(130, pos.y));
    });
    gCanvas.addEventListener('pointerdown', (evt) => {
      if (goalieState.status === 'gameover') resetGoalieRound();
    });
  }

  function resetGoalieRound() {
    goalieState.saves = 0;
    goalieState.conceded = 0;
    goalieState.status = 'playing';
    goalieState.balls = [];
    goalieState.particles = [];
    goalieState.glove.x = 400;
    goalieState.glove.y = 80;

    const saEl = document.getElementById('goalieSavesDisplay');
    const coEl = document.getElementById('goalieConcededDisplay');
    if (saEl) saEl.textContent = '0';
    if (coEl) coEl.textContent = '0';
    const overlay = document.getElementById('goalieOverlay');
    if (overlay) overlay.style.opacity = '0';
  }

  function updateGoaliePhysics() {
    if (goalieState.status !== 'playing' || activeTab !== 'goalie') return;

    goalieState.spawnTimer++;
    const spawnRate = Math.max(40, 90 - goalieState.saves * 3);
    if (goalieState.spawnTimer >= spawnRate) {
      goalieState.spawnTimer = 0;
      // Fire ball from bottom center toward goal net
      const targetX = Math.random() * 360 + 220; // Goal width 200 to 600
      const targetY = Math.random() * 85 + 45;   // Goal height 40 to 135
      const speed = Math.random() * 0.04 + 0.06;
      goalieState.balls.push({
        x: 400, y: 460, startX: 400, startY: 460,
        targetX, targetY, progress: 0, speed, scale: 1.5, rot: 0
      });
    }

    for (let i = goalieState.balls.length - 1; i >= 0; i--) {
      const b = goalieState.balls[i];
      b.progress += b.speed;
      b.x = b.startX + (b.targetX - b.startX) * b.progress;
      b.y = b.startY + (b.targetY - b.startY) * b.progress;
      b.scale = Math.max(0.6, 1.5 - b.progress * 0.9);
      b.rot += 0.4;

      if (b.progress >= 0.95) {
        // Check intersection with glove
        const dist = Math.sqrt((b.x - goalieState.glove.x) ** 2 + (b.y - goalieState.glove.y) ** 2);
        if (dist < goalieState.glove.radius + 20) {
          // SAVED
          goalieState.saves++;
          document.getElementById('goalieSavesDisplay').textContent = `${goalieState.saves}`;
          if (goalieState.saves > highScores.goalie) {
            highScores.goalie = goalieState.saves;
            saveHighScores();
          }
          if (goalieState.saves % 5 === 0 && window.addFanTokens) window.addFanTokens(5);
          for (let p = 0; p < 20; p++) goalieState.particles.push(new Particle(b.x, b.y, '#00FF66', 10, 4, 30));
          goalieState.balls.splice(i, 1);
        } else if (b.progress >= 1.0) {
          // CONCEDED
          goalieState.conceded++;
          document.getElementById('goalieConcededDisplay').textContent = `${goalieState.conceded}`;
          for (let p = 0; p < 30; p++) goalieState.particles.push(new Particle(b.x, b.y, '#EF4444', 12, 5, 35));
          goalieState.balls.splice(i, 1);

          if (goalieState.conceded >= 3) {
            goalieState.status = 'gameover';
            showOverlay('goalieOverlay', 'GAME OVER', `Total Saves: ${goalieState.saves}. Tap canvas to retry.`, '#EF4444');
          }
        }
      }
    }

    for (let i = goalieState.particles.length - 1; i >= 0; i--) {
      goalieState.particles[i].update();
      if (goalieState.particles[i].life <= 0) goalieState.particles.splice(i, 1);
    }
  }

  function renderGoalieScene() {
    gCtx.clearRect(0, 0, 800, 500);
    drawNightStadium(gCtx, '🧤 REFLEX GOALKEEPING CHALLENGE • PROTECT THE NET • LIVE ⚽', '#00BFFF');
    drawGoalFrame(gCtx, { left: 200, right: 600, top: 40, bottom: 135 });

    // Draw Glove
    gCtx.save();
    gCtx.translate(goalieState.glove.x, goalieState.glove.y);
    gCtx.fillStyle = '#FFD700';
    gCtx.shadowColor = '#00FF66';
    gCtx.shadowBlur = 15;
    gCtx.beginPath();
    gCtx.arc(-15, 0, 20, 0, Math.PI * 2);
    gCtx.arc(15, 0, 20, 0, Math.PI * 2);
    gCtx.fill();
    gCtx.fillStyle = '#000000';
    gCtx.font = '900 10px Inter';
    gCtx.textAlign = 'center';
    gCtx.fillText('VIP', 0, 4);
    gCtx.restore();

    goalieState.particles.forEach(p => p.draw(gCtx));
    goalieState.balls.forEach(b => drawFootball(gCtx, b.x, b.y, 18 * b.scale, b.rot));
  }

  // ==========================================
  // GAME 4: CROSSBAR TARGET DART
  // ==========================================
  let crossbarState = {
    score: 0,
    shots: 5,
    status: 'aiming', // 'aiming', 'flying', 'result'
    laserX: 200,
    laserDir: 6,
    targetBins: [
      { x: 225, y: 55, r: 25, pts: 100, color: '#D4AF37' }, // Top Left Bin
      { x: 575, y: 55, r: 25, pts: 100, color: '#D4AF37' }, // Top Right Bin
      { x: 400, y: 40, r: 35, pts: 50, color: '#00FF66' }    // Dead Center Crossbar
    ],
    ball: { x: 400, y: 430, targetX: 400, targetY: 40, scale: 1, rot: 0 },
    particles: []
  };

  function initCrossbarGame() {
    resetCrossbarRound();
    cCanvas.addEventListener('pointerdown', handleCrossbarClick);
  }

  function resetCrossbarRound() {
    crossbarState.score = 0;
    crossbarState.shots = 5;
    crossbarState.status = 'aiming';
    crossbarState.laserX = 200;
    crossbarState.particles = [];
    resetCrossbarShot();

    const scEl = document.getElementById('crossbarScoreDisplay');
    const shEl = document.getElementById('crossbarShotsDisplay');
    if (scEl) scEl.textContent = '0 PTS';
    if (shEl) shEl.textContent = '5';
    const overlay = document.getElementById('crossbarOverlay');
    if (overlay) overlay.style.opacity = '0';
  }

  function resetCrossbarShot() {
    if (crossbarState.shots <= 0) {
      crossbarState.status = 'gameover';
      showOverlay('crossbarOverlay', 'CHALLENGE FINISHED', `Total Score: ${crossbarState.score} PTS! Tap canvas to restart.`, '#D4AF37');
      return;
    }
    crossbarState.status = 'aiming';
    crossbarState.ball.x = 400;
    crossbarState.ball.y = 430;
    crossbarState.ball.scale = 1;
    crossbarState.ball.rot = 0;
  }

  function handleCrossbarClick(evt) {
    if (activeTab !== 'crossbar') return;
    if (crossbarState.status === 'gameover') {
      resetCrossbarRound();
      return;
    }
    if (crossbarState.status !== 'aiming') return;

    crossbarState.status = 'flying';
    crossbarState.ball.targetX = crossbarState.laserX;
    crossbarState.ball.targetY = 50; // crossbar elevation
    crossbarState.shots--;
    document.getElementById('crossbarShotsDisplay').textContent = `${crossbarState.shots}`;
  }

  function updateCrossbarPhysics() {
    if (activeTab !== 'crossbar') return;

    if (crossbarState.status === 'aiming') {
      crossbarState.laserX += crossbarState.laserDir;
      if (crossbarState.laserX < 200 || crossbarState.laserX > 600) crossbarState.laserDir *= -1;
    } else if (crossbarState.status === 'flying') {
      const b = crossbarState.ball;
      b.x += (b.targetX - b.x) * 0.15;
      b.y += (b.targetY - b.y) * 0.15;
      b.scale = Math.max(0.6, b.scale * 0.98);
      b.rot += 0.4;

      if (Math.abs(b.y - b.targetY) < 6) {
        // Evaluate hit
        let hitPts = 0;
        crossbarState.targetBins.forEach(tb => {
          const d = Math.sqrt((b.x - tb.x) ** 2 + (b.y - tb.y) ** 2);
          if (d < tb.r + 15) hitPts = tb.pts;
        });

        crossbarState.status = 'result';
        if (hitPts > 0) {
          crossbarState.score += hitPts;
          document.getElementById('crossbarScoreDisplay').textContent = `${crossbarState.score} PTS`;
          if (crossbarState.score > highScores.crossbar) {
            highScores.crossbar = crossbarState.score;
            saveHighScores();
          }
          if (window.addFanTokens) window.addFanTokens(10);
          for (let p = 0; p < 45; p++) crossbarState.particles.push(new Particle(b.x, b.y, '#D4AF37', 14, Math.random() * 5 + 3, 40));
          showOverlay('crossbarOverlay', `+${hitPts} BULLSEYE!`, 'Incredible Accuracy! (+10 Tokens)', '#00FF66');
        } else {
          for (let p = 0; p < 20; p++) crossbarState.particles.push(new Particle(b.x, b.y, '#ffffff', 8, 3, 25));
          showOverlay('crossbarOverlay', 'MISSED BIN', 'Slightly wide of the target rings.', '#FFA500');
        }
        setTimeout(() => {
          const o = document.getElementById('crossbarOverlay');
          if (o && crossbarState.shots > 0) o.style.opacity = '0';
          resetCrossbarShot();
        }, 1400);
      }
    }

    for (let i = crossbarState.particles.length - 1; i >= 0; i--) {
      crossbarState.particles[i].update();
      if (crossbarState.particles[i].life <= 0) crossbarState.particles.splice(i, 1);
    }
  }

  function renderCrossbarScene() {
    cCtx.clearRect(0, 0, 800, 500);
    drawNightStadium(cCtx, '🎯 CROSSBAR & TOP BINS CHALLENGE • HIT GOLD TARGETS • LIVE ⚽', '#D4AF37');
    drawGoalFrame(cCtx, { left: 200, right: 600, top: 40, bottom: 135 });

    // Draw Targets
    crossbarState.targetBins.forEach(tb => {
      cCtx.save();
      cCtx.strokeStyle = tb.color;
      cCtx.lineWidth = 4;
      cCtx.shadowColor = tb.color;
      cCtx.shadowBlur = 10;
      cCtx.beginPath();
      cCtx.arc(tb.x, tb.y, tb.r, 0, Math.PI * 2);
      cCtx.stroke();
      cCtx.fillStyle = '#ffffff';
      cCtx.font = '900 11px Inter';
      cCtx.textAlign = 'center';
      cCtx.fillText(`${tb.pts}`, tb.x, tb.y + 4);
      cCtx.restore();
    });

    // Aiming Reticle
    if (crossbarState.status === 'aiming') {
      cCtx.save();
      cCtx.strokeStyle = '#FF3300';
      cCtx.lineWidth = 2;
      cCtx.beginPath();
      cCtx.moveTo(crossbarState.laserX, 430);
      cCtx.lineTo(crossbarState.laserX, 40);
      cCtx.stroke();
      cCtx.fillStyle = '#FF3300';
      cCtx.beginPath();
      cCtx.arc(crossbarState.laserX, 50, 8, 0, Math.PI * 2);
      cCtx.fill();
      cCtx.restore();
    }

    crossbarState.particles.forEach(p => p.draw(cCtx));
    drawFootball(cCtx, crossbarState.ball.x, crossbarState.ball.y, 18 * crossbarState.ball.scale, crossbarState.ball.rot);
  }

  // ==========================================
  // MASTER RENDER LOOP
  // ==========================================
  function masterGameLoop() {
    if (activeTab === 'penalty' && pCtx) {
      updatePenaltyPhysics();
      renderPenaltyScene();
    } else if (activeTab === 'keepy' && kCtx) {
      updateKeepyPhysics();
      renderKeepyScene();
    } else if (activeTab === 'goalie' && gCtx) {
      updateGoaliePhysics();
      renderGoalieScene();
    } else if (activeTab === 'crossbar' && cCtx) {
      updateCrossbarPhysics();
      renderCrossbarScene();
    }
    requestAnimationFrame(masterGameLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGames);
  } else {
    initGames();
  }

})();
