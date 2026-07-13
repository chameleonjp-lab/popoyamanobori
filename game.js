const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const groundY = 250;

const ui = {
  hp: document.getElementById('hp'), score: document.getElementById('score'), distance: document.getElementById('distance'),
  label: document.getElementById('stateLabel'), title: document.getElementById('titleScreen'), over: document.getElementById('gameOver'),
  resultTitle: document.getElementById('resultTitle'), resultText: document.getElementById('resultText'),
};

const keys = new Set();
let game;

function resetGame() {
  game = {
    running: true, time: 0, speed: 2.6, distance: 0, score: 0, spawn: 70, shrine: 0,
    player: { x: 78, y: groundY - 66, w: 48, h: 66, vy: 0, hp: 3, inv: 0, attack: 0, grounded: true },
    enemies: [], charms: [], particles: [], clouds: Array.from({ length: 7 }, (_, i) => ({ x: i * 95, y: 34 + Math.random() * 48, s: .7 + Math.random() * .9 }))
  };
  ui.over.classList.add('hidden');
  ui.title.classList.add('hidden');
  ui.label.textContent = '修験道を駆け抜けろ！';
}

function jump() { if (!game?.running) return; const p = game.player; if (p.grounded) { p.vy = -10.5; p.grounded = false; burst(p.x + 20, groundY - 5, '#fff0b8', 8); } }
function attack() { if (!game?.running) return; if (game.player.attack <= 0) { game.player.attack = 22; ui.label.textContent = '法螺貝の衝撃波！'; burst(game.player.x + 58, game.player.y + 28, '#8ee9ff', 10); } }

function spawnEnemy() {
  const types = [
    { name: '赤鬼', color: '#c43b19', hp: 1, w: 52, h: 58 }, { name: '烏天狗', color: '#1d2028', hp: 1, w: 54, h: 56 },
    { name: '雪女', color: '#d8f6ff', hp: 1, w: 42, h: 62 }, { name: '一つ目小僧', color: '#b46b28', hp: 1, w: 46, h: 48 },
    { name: '河童', color: '#3f8a35', hp: 1, w: 48, h: 50 }, { name: '骸武者', color: '#262326', hp: 2, w: 50, h: 60 }
  ];
  const t = types[Math.floor(Math.random() * types.length)];
  game.enemies.push({ ...t, x: W + 30, y: groundY - t.h, hit: 0, phase: Math.random() * 9 });
  if (Math.random() < .55) game.charms.push({ x: W + 120, y: 125 + Math.random() * 78, r: 11, spin: 0 });
}

function update() {
  if (!game?.running) return;
  const p = game.player;
  game.time++; game.distance += game.speed / 12; game.speed = Math.min(5.2, 2.6 + game.distance / 650);
  p.vy += .55; p.y += p.vy;
  if (p.y >= groundY - p.h) { p.y = groundY - p.h; p.vy = 0; p.grounded = true; }
  if (p.inv > 0) p.inv--; if (p.attack > 0) p.attack--;
  if (keys.has('ArrowUp') || keys.has(' ')) jump(); if (keys.has('z')) attack();

  game.spawn--; if (game.spawn <= 0) { spawnEnemy(); game.spawn = Math.max(38, 92 - game.speed * 9 + Math.random() * 35); }
  for (const c of game.clouds) { c.x -= game.speed * .18 * c.s; if (c.x < -90) { c.x = W + 50; c.y = 26 + Math.random() * 60; } }
  for (const e of game.enemies) { e.x -= game.speed; e.phase += .08; if (e.hit > 0) e.hit--; }
  for (const c of game.charms) { c.x -= game.speed; c.spin += .12; }
  game.enemies = game.enemies.filter(e => e.x > -90 && e.hp > 0);
  game.charms = game.charms.filter(c => c.x > -40 && !c.got);
  handleCollisions();
  game.particles.forEach(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.life--; pt.vy += .04; });
  game.particles = game.particles.filter(pt => pt.life > 0);
  ui.hp.textContent = p.hp; ui.score.textContent = game.score; ui.distance.textContent = Math.floor(game.distance);
}

function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function handleCollisions() {
  const p = game.player;
  const attackBox = { x: p.x + 38, y: p.y + 12, w: 86, h: 36 };
  for (const e of game.enemies) {
    if (p.attack > 0 && hit(attackBox, e)) { e.hp--; e.hit = 8; game.score += 20; burst(e.x + e.w / 2, e.y + 25, '#8ee9ff', 12); continue; }
    if (p.inv <= 0 && hit(p, e)) { p.hp--; p.inv = 80; ui.label.textContent = `${e.name}に当たった！`; burst(p.x + 20, p.y + 22, '#ff5d4a', 14); if (p.hp <= 0) endGame(false); }
  }
  for (const c of game.charms) if (!c.got && hit(p, { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 })) { c.got = true; game.score += 10; burst(c.x, c.y, '#ffd45b', 9); }
  if (game.distance >= 1000) endGame(true);
}
function endGame(clear) { game.running = false; ui.resultTitle.textContent = clear ? '登頂成功！' : '修行終了'; ui.resultText.textContent = `護符 ${game.score} / 距離 ${Math.floor(game.distance)}m。${clear ? 'ぽぽは霊山の頂にたどり着いた！' : 'もう一度、妖怪の山道へ挑もう。'}`; ui.over.classList.remove('hidden'); }
function burst(x, y, color, n) { for (let i = 0; i < n; i++) game.particles.push({ x, y, vx: (Math.random() - .5) * 4, vy: (Math.random() - .7) * 3, life: 22 + Math.random() * 15, color }); }

function drawTanuki(p) {
  ctx.save(); ctx.translate(p.x, p.y); if (p.inv % 10 > 5) ctx.globalAlpha = .45;
  ctx.fillStyle = '#7a431f'; ellipse(24, 35, 21, 24); ctx.fillStyle = '#c8782e'; ellipse(24, 28, 17, 15); ctx.fillStyle = '#243b52'; rect(10, 36, 28, 24, 7); ctx.fillStyle = '#fff5df'; rect(13, 38, 10, 19, 4); rect(26, 38, 10, 19, 4);
  ctx.fillStyle = '#202020'; ellipse(24, 7, 13, 7); rect(14, 2, 20, 8, 3); ctx.fillStyle = '#8b4b22'; ellipse(6, 28, 9, 19); ellipse(43, 28, 9, 19);
  ctx.fillStyle = '#f7e0bd'; ellipse(17, 25, 5, 4); ellipse(31, 25, 5, 4); ctx.fillStyle = '#111'; ellipse(17, 25, 2, 2); ellipse(31, 25, 2, 2); ctx.fillStyle = '#fff'; ellipse(18, 24, 1, 1); ellipse(32, 24, 1, 1);
  ctx.strokeStyle = '#d6a03a'; ctx.lineWidth = 4; line(36, 33, 60, 23); ctx.fillStyle = '#f5d06a'; ellipse(62, 22, 8, 8);
  if (p.attack > 0) { ctx.strokeStyle = '#80e7ff'; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(72 + i * 18, 25, 13 + i * 3, -0.8, 0.8); ctx.stroke(); } }
  ctx.restore();
}
function drawEnemy(e) { ctx.save(); ctx.translate(e.x, e.y + Math.sin(e.phase) * 2); ctx.globalAlpha = e.hit ? .55 : 1; ctx.fillStyle = e.color; ellipse(e.w/2, e.h/2, e.w*.42, e.h*.42); ctx.fillStyle = '#111'; ellipse(e.w/2, 13, e.w*.28, 9); ctx.fillStyle = e.color === '#d8f6ff' ? '#2a89ff' : '#ffdb66'; ellipse(e.w*.35, 28, 4, 4); ellipse(e.w*.63, 28, 4, 4); ctx.strokeStyle = '#18100b'; ctx.lineWidth = 4; line(8, e.h - 9, e.w - 6, e.h - 7); if (e.name === '赤鬼' || e.name === '骸武者') { ctx.fillStyle = '#f0d06a'; tri(14, 7, 20, -8, 25, 9); tri(e.w-14, 7, e.w-20, -8, e.w-25, 9); } ctx.restore(); }
function drawCharm(c) { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.spin); ctx.fillStyle = '#ffd45b'; rect(-8, -11, 16, 22, 3); ctx.fillStyle = '#8b2d17'; rect(-5, -7, 10, 14, 2); ctx.restore(); }
function draw() {
  ctx.clearRect(0,0,W,H); const t = game?.time || 0;
  const grd = ctx.createLinearGradient(0,0,0,H); grd.addColorStop(0,'#7bc9ff'); grd.addColorStop(.48,'#caecff'); grd.addColorStop(.49,'#8a5a30'); grd.addColorStop(1,'#2b1b10'); ctx.fillStyle = grd; ctx.fillRect(0,0,W,H);
  if (game) for (const c of game.clouds) { ctx.fillStyle = '#ffffffaa'; ellipse(c.x, c.y, 38*c.s, 12*c.s); ellipse(c.x+25*c.s, c.y+3, 25*c.s, 10*c.s); }
  ctx.fillStyle = '#6d4323'; for (let x = -((game?.distance || 0) * 3 % 90); x < W + 90; x += 90) { tri(x, groundY, x+50, 184 + Math.sin((x+t)/80)*12, x+115, groundY); }
  ctx.fillStyle = '#2d2016'; ctx.fillRect(0, groundY, W, H-groundY); ctx.fillStyle = '#5b3a20'; for (let x = -((game?.distance || 0) * 12 % 42); x < W; x += 42) rect(x, groundY + 12, 25, 9, 4);
  if (game) { game.charms.forEach(drawCharm); game.enemies.forEach(drawEnemy); drawTanuki(game.player); game.particles.forEach(pt => { ctx.globalAlpha = pt.life / 35; ctx.fillStyle = pt.color; ellipse(pt.x, pt.y, 3, 3); ctx.globalAlpha = 1; }); }
}
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
function rect(x,y,w,h,r=0){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); }
function ellipse(x,y,rx,ry){ ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fill(); }
function line(x1,y1,x2,y2){ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
function tri(x1,y1,x2,y2,x3,y3){ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.closePath(); ctx.fill(); }

document.getElementById('startButton').addEventListener('click', resetGame);
document.getElementById('retryButton').addEventListener('click', resetGame);
document.getElementById('jumpButton').addEventListener('pointerdown', jump);
document.getElementById('attackButton').addEventListener('pointerdown', attack);
let pressTimer = 0;
canvas.addEventListener('pointerdown', () => {
  jump();
  clearTimeout(pressTimer);
  pressTimer = setTimeout(attack, 260);
});
canvas.addEventListener('pointerup', () => clearTimeout(pressTimer));
canvas.addEventListener('pointercancel', () => clearTimeout(pressTimer));
addEventListener('keydown', e => { keys.add(e.key); if (e.key === 'z') attack(); });
addEventListener('keyup', e => keys.delete(e.key));
loop();
