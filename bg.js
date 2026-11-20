const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');

// 像素块大小，改这个数调整颗粒粗细
const PIXEL = 8;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function drawBackground() {
  const w = canvas.width;
  const h = canvas.height;

  // 日落渐变
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0a0a1a');
  grad.addColorStop(0.35, '#1a1a3a');
  grad.addColorStop(0.55, '#3d2b52');
  grad.addColorStop(0.72, '#8b4a3a');
  grad.addColorStop(0.85, '#d4763a');
  grad.addColorStop(1, '#f0a04a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 叠加像素颗粒
  for (let y = 0; y < h; y += PIXEL) {
    for (let x = 0; x < w; x += PIXEL) {
      const noise = (Math.random() - 0.5) * 14;
      ctx.fillStyle = noise > 0
        ? `rgba(255,255,255,${noise / 255})`
        : `rgba(0,0,0,${-noise / 255})`;
      ctx.fillRect(x, y, PIXEL, PIXEL);
    }
  }
}

window.addEventListener('resize', () => {
  resize();
  drawBackground();
});

resize();
drawBackground();