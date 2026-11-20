// ========== 可调参数（想改效果就动这里）==========
const PIXEL = 8;          // 像素颗粒粗细：4细腻 / 8默认 / 12粗犷
const ACCELERATE = false; // true=加速演示(约40秒过完一天) / false=绑定真实时间
const TIME_SCALE = 40;    // 加速模式下：1秒 = 现实多少分钟（仅ACCELERATE=true时生效）

const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');
let w, h;

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}

// 颜色在 [0,1] 之间做插值（在两组RGB间平滑过渡）
function lerp(a, b, t) { return a + (b - a) * t; }
function mix(c1, c2, t) {
  return `rgb(${Math.round(lerp(c1[0], c2[0], t))},${Math.round(lerp(c1[1], c2[1], t))},${Math.round(lerp(c1[2], c2[2], t))})`;
}

// 天空关键帧：每个时间点 = [顶部色, 地平线色]
const SKY = [
  { h: 0,  top: [10,12,40],   bot: [18,22,60]   }, // 深夜
  { h: 5,  top: [20,25,70],   bot: [70,50,80]   }, // 黎明前
  { h: 6.5,top: [90,110,170], bot: [255,150,90] }, // 日出·橙
  { h: 8,  top: [110,170,225],bot: [180,220,240]}, // 清晨·蓝
  { h: 12, top: [95,165,230], bot: [190,225,245]}, // 正午·亮蓝
  { h: 17, top: [110,160,210],bot: [240,200,150]}, // 午后·偏黄
  { h: 18.5,top:[70,80,140],  bot: [255,120,60] }, // 日落·橙红
  { h: 20, top: [25,30,70],   bot: [60,40,80]   }, // 黄昏·暗紫
  { h: 24, top: [10,12,40],   bot: [18,22,60]   }, // 回到深夜
];

// 根据小时数取天空上下两色（线性插值）
function skyColors(hour) {
  for (let i = 0; i < SKY.length - 1; i++) {
    if (hour >= SKY[i].h && hour <= SKY[i + 1].h) {
      const t = (hour - SKY[i].h) / (SKY[i + 1].h - SKY[i].h);
      return { top: mix(SKY[i].top, SKY[i + 1].top, t), bot: mix(SKY[i].bot, SKY[i + 1].bot, t) };
    }
  }
  return { top: 'rgb(10,12,40)', bot: 'rgb(18,22,60)' };
}

// 星星：开机时随机撒一批，固定位置，夜晚才亮
const stars = [];
function makeStars() {
  stars.length = 0;
  const n = Math.floor((w * h) / 9000);
  for (let i = 0; i < n; i++) {
    stars.push({ x: Math.random() * w, y: Math.random() * h * 0.7, r: PIXEL, p: Math.random() * 6.28 });
  }
}

function draw(nowMs) {
  // ① 当前时刻
  let hour;
  if (ACCELERATE) {
    hour = (nowMs / 1000 * TIME_SCALE / 60) % 24;   // 加速：从0点跑起
  } else {
    const d = new Date();
    hour = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; // 真实时间
  }

  // ② 天空渐变
  const sky = skyColors(hour);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, sky.top);
  grad.addColorStop(1, sky.bot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // ③ 夜晚才画星星（6点前、19点后），会一闪一闪
  const night = hour < 6 || hour >= 19;
  if (night) {
    stars.forEach(s => {
      const tw = 0.5 + 0.5 * Math.sin(nowMs / 500 + s.p); // 闪烁系数
      ctx.fillStyle = `rgba(255,255,240,${0.3 + tw * 0.6})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    });
  }

  // ④ 太阳（6点升起、18点落下，走抛物线弧）
  if (hour >= 6 && hour <= 18) {
    const t = (hour - 6) / 12;                 // 0~1
    const sx = lerp(w * 0.12, w * 0.88, t);    // 从左到右
    const sy = h * 0.82 - Math.sin(t * Math.PI) * h * 0.66; // 弧线
    const size = PIXEL * 5;
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
    ctx.fillStyle = 'rgba(255,210,74,0.25)';   // 光晕
    ctx.fillRect(sx - size, sy - size, size * 2, size * 2);
  }

  // ⑤ 月亮（19点升起、次日5点落下）
  if (hour >= 19 || hour < 5) {
    const t = hour >= 19 ? (hour - 19) / 10 : (hour + 5) / 10;
    const mx = lerp(w * 0.15, w * 0.85, t);
    const my = h * 0.8 - Math.sin(t * Math.PI) * h * 0.6;
    const size = PIXEL * 4;
    ctx.fillStyle = '#e8ecf2';
    ctx.fillRect(mx - size / 2, my - size / 2, size, size);
  }

  // ⑥ 叠加像素颗粒（保持复古质感）
  for (let y = 0; y < h; y += PIXEL) {
    for (let x = 0; x < w; x += PIXEL) {
      const noise = (Math.random() - 0.5) * 10;
      ctx.fillStyle = noise > 0
        ? `rgba(255,255,255,${noise / 255})`
        : `rgba(0,0,0,${-noise / 255})`;
      ctx.fillRect(x, y, PIXEL, PIXEL);
    }
  }
}

// 主循环
function loop(ts) {
  draw(ts);
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => { resize(); makeStars(); });
resize();
makeStars();
requestAnimationFrame(loop);