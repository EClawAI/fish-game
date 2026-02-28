// 大鱼吃小鱼游戏 - 专业版
// 修复了设计问题和程序 bug

// ==================== 游戏配置 ====================
const CONFIG = {
    WORLD_SCALE: 3,              // 世界倍数 (3x3=9 屏幕)
    EDGE_MARGIN: 0.15,           // 屏幕边缘触发区域 (15%)
    CAMERA_SPEED: 0.03,          // 摄像机移动速度
    MAX_PARTICLES: 100,          // 最大粒子数（性能优化）
    MAX_ENEMIES_BASE: 25,        // 基础最大敌人数量
    MAX_ENEMIES_PER_SCORE: 5,    // 每 100 分增加的敌人上限
    SPECIAL_SPAWN_INTERVAL: 20000, // 特殊鱼生成间隔 (20 秒)
    PLAYER_START_SIZE: 15,       // 玩家初始大小
    PLAYER_START_SPEED: 3,       // 玩家初始速度
    GROWTH_RATE: 0.15,           // 成长系数
};

// ==================== 鱼类定义 ====================
const FISH_TYPES = [
    { name: '小丑鱼', minSize: 5, maxSize: 12, color: '#FF6B6B', pattern: 'stripes' },
    { name: '孔雀鱼', minSize: 12, maxSize: 18, color: '#FF9FF3', pattern: 'gradient' },
    { name: '灯鱼', minSize: 18, maxSize: 25, color: '#54A0FF', pattern: 'glow' },
    { name: '神仙鱼', minSize: 25, maxSize: 32, color: '#48DBFB', pattern: 'elegant' },
    { name: '蝴蝶鱼', minSize: 32, maxSize: 38, color: '#FFD93D', pattern: 'spots' },
    { name: '鹦鹉鱼', minSize: 38, maxSize: 45, color: '#FF6B9D', pattern: 'colorful' },
    { name: '金枪鱼', minSize: 45, maxSize: 52, color: '#C8D6E5', pattern: 'streamline' },
    { name: '鲨鱼', minSize: 52, maxSize: 60, color: '#576574', pattern: 'smooth' },
    { name: '魔鬼鱼', minSize: 60, maxSize: 65, color: '#8395A7', pattern: 'wing' },
    { name: '海豚', minSize: 65, maxSize: 72, color: '#0ABDE3', pattern: 'smart' },
    { name: '虎鲸', minSize: 72, maxSize: 78, color: '#222F3E', pattern: 'orca' },
    { name: '蓝鲸', minSize: 78, maxSize: 80, color: '#1E3799', pattern: 'whale' }
];

const SPECIAL_FISH = {
    golden: { name: '🌟 黄金鱼', size: 25, color: '#FFD700', points: 500, speed: 4 },
    rainbow: { name: '🌈 彩虹鱼', size: 30, color: 'rainbow', points: 300, speed: 3.5 },
    ghost: { name: '👻 幽灵鱼', size: 35, color: '#A8E6CF', points: 200, speed: 2 }
};

// ==================== 鱼类 ====================
class Fish {
    constructor(x, y, size, speed, isPlayer = false, specialType = null) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.baseSpeed = speed;
        this.speed = speed;
        this.isPlayer = isPlayer;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.angle = angle !== null ? angle : Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.color = this.randomColor();
        this.tailAngle = 0;
        this.tailSpeed = 0.1 + Math.random() * 0.1;
        this.fishType = this.getFishType();
        this.glowAngle = 0;
        this.specialType = specialType;
        this.isSpecial = specialType !== null;
        this.rainbowAngle = 0;
        this.birthTime = Date.now();
        // AI 鱼寿命延长到 40-80 秒
        this.maxLifetime = this.isPlayer ? 0 : (40000 + Math.random() * 40000);
        this.age = 0;
        this.isLeaving = false; // 标记是否游出世界
    }

    getFishType() {
        if (this.specialType) return SPECIAL_FISH[this.specialType];
        for (let type of FISH_TYPES) {
            if (this.size >= type.minSize && this.size < type.maxSize) return type;
        }
        return FISH_TYPES[FISH_TYPES.length - 1];
    }

    randomColor() {
        if (this.specialType) return SPECIAL_FISH[this.specialType].color;
        return this.fishType ? this.fishType.color : '#4ECDC4';
    }

    // 检查是否进化
    checkEvolution() {
        const oldType = this.fishType;
        this.fishType = this.getFishType();
        return oldType !== this.fishType && this.isPlayer;
    }

    update(worldWidth, worldHeight, player, camera) {
        this.age = Date.now() - this.birthTime;
        
        if (this.isPlayer) {
            const dx = player.targetX - this.x;
            const dy = player.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 10) {
                const moveSpeed = Math.min(dist * 0.15, this.speed * 3);
                this.x += (dx / dist) * moveSpeed;
                this.y += (dy / dist) * moveSpeed;
            } else {
                this.x += dx * 0.1;
                this.y += dy * 0.1;
            }
            
            if (Math.abs(dx) > 5) this.direction = dx > 0 ? 1 : -1;
            this.glowAngle += 0.1;
            
            // 边界限制
            this.x = Math.max(this.size, Math.min(worldWidth - this.size, this.x));
            this.y = Math.max(this.size, Math.min(worldHeight - this.size, this.y));
        } else {
            // AI 鱼：直线游动，不随机转向
            const ageFactor = Math.max(0.5, 1 - (this.age / this.maxLifetime) * 0.3);
            
            // 只躲避玩家，不随机转向
            if (player && Math.abs(player.x - this.x) < 250 && Math.abs(player.y - this.y) < 250) {
                if (player.size > this.size * 1.2) {
                    // 躲避玩家
                    const escapeAngle = Math.atan2(player.y - this.y, player.x - this.x) + Math.PI;
                    let angleDiff = escapeAngle - this.angle;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    this.angle += angleDiff * 0.03;
                }
            }
            
            this.x += Math.cos(this.angle) * this.speed * ageFactor;
            this.y += Math.sin(this.angle) * this.speed * ageFactor;
            this.direction = Math.cos(this.angle) > 0 ? 1 : -1;
            
            // 检查是否游出世界边界（标记为离开）
            const margin = this.size * 3;
            if (this.x < -margin || this.x > worldWidth + margin || 
                this.y < -margin || this.y > worldHeight + margin) {
                this.isLeaving = true;
            }
        }

        this.tailAngle += this.tailSpeed;
    }

    shouldRemove() {
        return this.age > this.maxLifetime;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.translate(this.x, this.y);
        
        const drawAngle = this.isPlayer ? 0 : this.angle;
        ctx.rotate(drawAngle);
        
        if (this.isSpecial) this.drawSpecialEffect(ctx);
        
        if (this.isPlayer) {
            // 玩家光环
            const glowSize = this.size * 2.5 + Math.sin(this.glowAngle) * 3;
            const gradient = ctx.createRadialGradient(0, 0, this.size * 1.5, 0, 0, glowSize);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.15)');
            gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
            ctx.beginPath();
            ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // 玩家标签
            ctx.rotate(-drawAngle);
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px PingFang SC';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText('👤 你', 0, -this.size * 2.5);
            ctx.shadowBlur = 0;
            ctx.rotate(drawAngle);
        }
        
        this.drawFishBody(ctx);
        this.drawFishPattern(ctx);
        this.drawFishTail(ctx);
        this.drawFishFins(ctx);
        this.drawFishEye(ctx);

        ctx.restore();
    }

    drawSpecialEffect(ctx) {
        const time = Date.now() / 200;
        ctx.save();
        
        if (this.specialType === 'golden') {
            const gradient = ctx.createRadialGradient(0, 0, this.size, 0, 0, this.size * 2.5);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            if (Math.sin(time * 2) > 0.7) {
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.arc(Math.sin(time) * this.size * 1.5, Math.cos(time) * this.size * 1.5, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.specialType === 'rainbow') {
            const hue = (this.rainbowAngle * 50) % 360;
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.5)`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.8, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.specialType === 'ghost') {
            ctx.globalAlpha = 0.6 + Math.sin(time) * 0.2;
            if (Math.random() < 0.1) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(this.size * 2, -this.size * 2, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
        ctx.globalAlpha = 1.0;
    }

    drawFishBody(ctx) {
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.5, this.size, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.fishType ? this.fishType.color : this.color;
        ctx.fill();
        
        const gradient = ctx.createRadialGradient(-this.size * 0.5, -this.size * 0.3, 0, 0, 0, this.size);
        const baseColor = this.fishType ? this.fishType.color : this.color;
        gradient.addColorStop(0, this.lightenColor(baseColor, 30));
        gradient.addColorStop(1, baseColor);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    drawFishPattern(ctx) {
        if (!this.fishType) return;
        ctx.strokeStyle = this.lightenColor(this.fishType.color, 20);
        ctx.lineWidth = 2;
        
        if (this.specialType === 'golden') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(-this.size * 0.5 + i * this.size * 0.3, 0, this.size * 0.1, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            switch(this.fishType.pattern) {
                case 'stripes':
                    for (let i = -this.size * 0.8; i < this.size * 0.8; i += this.size * 0.4) {
                        ctx.beginPath();
                        ctx.moveTo(i, -this.size * 0.7);
                        ctx.lineTo(i + this.size * 0.2, this.size * 0.7);
                        ctx.stroke();
                    }
                    break;
                case 'spots':
                    for (let i = 0; i < 5; i++) {
                        ctx.beginPath();
                        ctx.arc(-this.size * 0.5 + i * this.size * 0.3, Math.sin(i) * this.size * 0.3, this.size * 0.15, 0, Math.PI * 2);
                        ctx.fillStyle = this.lightenColor(this.fishType.color, 40);
                        ctx.fill();
                    }
                    break;
                case 'glow':
                    ctx.shadowColor = this.fishType.color;
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
                    ctx.fillStyle = this.lightenColor(this.fishType.color, 20);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    break;
            }
        }
    }

    drawFishTail(ctx) {
        ctx.beginPath();
        const tailWag = Math.sin(this.tailAngle) * 0.3;
        ctx.moveTo(-this.size * 1.2, 0);
        ctx.lineTo(-this.size * 2.2, -this.size * 0.8 + tailWag * this.size);
        ctx.lineTo(-this.size * 2.2, this.size * 0.8 + tailWag * this.size);
        ctx.closePath();
        ctx.fillStyle = this.fishType ? this.fishType.color : this.color;
        ctx.fill();
    }

    drawFishFins(ctx) {
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.5, -this.size * 0.8);
        ctx.quadraticCurveTo(0, -this.size * 1.3, this.size * 0.5, -this.size * 0.8);
        ctx.fillStyle = this.fishType ? this.fishType.color : this.color;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-this.size * 0.3, this.size * 0.7);
        ctx.lineTo(0, this.size * 1.0);
        ctx.lineTo(this.size * 0.3, this.size * 0.7);
        ctx.fillStyle = this.fishType ? this.fishType.color : this.color;
        ctx.fill();
    }

    drawFishEye(ctx) {
        ctx.beginPath();
        ctx.arc(this.size * 0.8, -this.size * 0.3, this.size * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.size * 0.9, -this.size * 0.3, this.size * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        if (this.isPlayer) {
            ctx.beginPath();
            ctx.arc(this.size * 0.95, -this.size * 0.35, this.size * 0.05, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
        }
    }

    lightenColor(color, percent) {
        if (color.startsWith('hsl')) return color;
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    grow(amount) {
        const oldSize = this.size;
        this.size = Math.min(80, this.size + amount * CONFIG.GROWTH_RATE);
        this.speed = 3 + (20 / this.size);
        this.fishType = this.getFishType();
        return oldSize !== this.size;
    }
}

// ==================== 粒子系统 ====================
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = (Math.random() - 0.5) * 6;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.02;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.1;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

// ==================== 气泡 ====================
class Bubble {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.x = Math.random() * canvasWidth;
        this.y = canvasHeight + 10;
        this.size = Math.random() * 8 + 2;
        this.speed = Math.random() * 1 + 0.5;
        this.wobble = Math.random() * Math.PI * 2;
    }

    update() {
        this.y -= this.speed;
        this.x += Math.sin(this.wobble) * 0.5;
        this.wobble += 0.05;
        if (this.y < -10) {
            this.y = this.canvasHeight + 10;
            this.x = Math.random() * this.canvasWidth;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// ==================== 音效管理器 ====================
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.bgmPlaying = false;
        this.bgmGain = null;
        this.bgmOscillators = [];
        this.enabled = true;
    }

    init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
            } else {
                this.enabled = false;
            }
        } catch (e) {
            this.enabled = false;
        }
    }

    playEatSound(size) {
        if (!this.enabled || !this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.frequency.value = 800 - size * 5;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    playSpecialSound() {
        if (!this.enabled || !this.audioContext) return;
        const notes = [523.25, 659.25, 783.99];
        const now = this.audioContext.currentTime;
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.1, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }

    playEvolutionSound() {
        if (!this.enabled || !this.audioContext) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        const now = this.audioContext.currentTime;
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.15, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.4);
        });
    }

    playGameOverSound() {
        if (!this.enabled || !this.audioContext) return;
        const notes = [392, 370, 349, 311];
        const now = this.audioContext.currentTime;
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.frequency.value = freq;
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0.15, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.4);
        });
    }

    startBGM() {
        if (!this.enabled || !this.audioContext || this.bgmPlaying) return;
        this.bgmPlaying = true;
        const now = this.audioContext.currentTime;
        
        this.bgmGain = this.audioContext.createGain();
        this.bgmGain.gain.value = 0.05;
        this.bgmGain.connect(this.audioContext.destination);
        
        const waveFreqs = [80, 120, 180, 250, 350];
        this.bgmOscillators = waveFreqs.map((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.frequency.value = freq;
            osc.type = 'sine';
            const lfo = this.audioContext.createOscillator();
            lfo.frequency.value = 0.1 + i * 0.05;
            const lfoGain = this.audioContext.createGain();
            lfoGain.gain.value = 0.3;
            lfo.connect(lfoGain);
            lfoGain.connect(gain.gain);
            gain.gain.value = 0.02;
            osc.connect(gain);
            gain.connect(this.bgmGain);
            osc.start(now);
            lfo.start(now);
            return { osc, lfo, gain };
        });
        
        const deepOsc = this.audioContext.createOscillator();
        const deepGain = this.audioContext.createGain();
        deepOsc.frequency.value = 40;
        deepOsc.type = 'sine';
        deepGain.gain.value = 0.015;
        deepOsc.connect(deepGain);
        deepGain.connect(this.bgmGain);
        deepOsc.start(now);
        this.bgmOscillators.push({ osc: deepOsc, lfo: null, gain: deepGain });
    }

    stopBGM() {
        if (!this.audioContext) return;
        const now = this.audioContext.currentTime;
        if (this.bgmGain) {
            this.bgmGain.gain.exponentialRampToValueAtTime(0.001, now + 1);
        }
        this.bgmOscillators.forEach(({ osc, lfo }) => {
            try { osc.stop(now + 1); if (lfo) lfo.stop(now + 1); } catch (e) {}
        });
        this.bgmPlaying = false;
        this.bgmOscillators = [];
        this.bgmGain = null;
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) this.startBGM();
        else this.stopBGM();
        return this.enabled;
    }
}

// ==================== 游戏主类 ====================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('score');
        this.sizeEl = document.getElementById('size');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreEl = document.getElementById('finalScore');
        this.bgmBtn = document.getElementById('bgmBtn');
        
        this.player = null;
        this.enemies = [];
        this.particles = [];
        this.bubbles = [];
        this.score = 0;
        this.highScore = localStorage.getItem('fishGameHighScore') || 0;
        this.isRunning = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.worldWidth = 0;
        this.worldHeight = 0;
        this.camera = { x: 0, y: 0, scale: 1, targetScale: 1 };
        this.soundManager = new SoundManager();
        this.specialTimer = null;
        this.evolutionNotices = [];
        this.lastFishType = null;

        this.init();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    init() {
        for (let i = 0; i < 30; i++) {
            this.bubbles.push(new Bubble(this.canvas.width, this.canvas.height));
        }

        // 全局鼠标跟踪（即使移出浏览器也能跟踪）
        document.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = Math.max(0, Math.min(this.canvas.width, e.touches[0].clientX - rect.left));
            this.mouseY = Math.max(0, Math.min(this.canvas.height, e.touches[0].clientY - rect.top));
        });
        
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;
        this.worldWidth = this.canvas.width * CONFIG.WORLD_SCALE;
        this.worldHeight = this.canvas.height * CONFIG.WORLD_SCALE;
    }

    updateCamera() {
        if (!this.player) return;
        
        const baseScale = 1;
        const minScale = 0.4;
        this.camera.targetScale = baseScale - (this.player.size - CONFIG.PLAYER_START_SIZE) / 65 * (baseScale - minScale);
        this.camera.targetScale = Math.max(minScale, Math.min(baseScale, this.camera.targetScale));
        this.camera.scale += (this.camera.targetScale - this.camera.scale) * 0.05;
        
        const edgeMargin = this.canvas.width * CONFIG.EDGE_MARGIN;
        let targetX = this.camera.x;
        let targetY = this.camera.y;
        
        if (this.mouseX < edgeMargin) targetX += (edgeMargin - this.mouseX) * CONFIG.CAMERA_SPEED;
        else if (this.mouseX > this.canvas.width - edgeMargin) targetX -= (this.mouseX - (this.canvas.width - edgeMargin)) * CONFIG.CAMERA_SPEED;
        if (this.mouseY < edgeMargin) targetY += (edgeMargin - this.mouseY) * CONFIG.CAMERA_SPEED;
        else if (this.mouseY > this.canvas.height - edgeMargin) targetY -= (this.mouseY - (this.canvas.height - edgeMargin)) * CONFIG.CAMERA_SPEED;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        const maxX = this.worldWidth / 2 - this.canvas.width / 2;
        const maxY = this.worldHeight / 2 - this.canvas.height / 2;
        this.camera.x = Math.max(-maxX, Math.min(maxX, this.camera.x));
        this.camera.y = Math.max(-maxY, Math.min(maxY, this.camera.y));
    }

    start() {
        try {
            this.soundManager.init();
            
            // 确保 worldWidth 和 worldHeight 已初始化
            if (!this.worldWidth || !this.worldHeight) {
                this.resize();
            }
            
            this.player = new Fish(this.worldWidth / 2, this.worldHeight / 2, CONFIG.PLAYER_START_SIZE, CONFIG.PLAYER_START_SPEED, true);
            this.player.targetX = this.mouseX;
            this.player.targetY = this.mouseY;
            this.lastFishType = this.player.fishType;
            this.enemies = [];
            this.particles = [];
            this.evolutionNotices = [];
            this.score = 0;
            this.isRunning = true;
            this.camera.scale = 1;
            this.camera.x = 0;
            this.camera.y = 0;
            
            // 清理旧的定时器
            if (this.specialTimer) {
                clearInterval(this.specialTimer);
                this.specialTimer = null;
            }
            
            this.startScreen.classList.add('hidden');
            this.gameOverScreen.classList.add('hidden');
            
            setTimeout(() => {
                if (this.soundManager.enabled && this.isRunning) {
                    this.soundManager.startBGM();
                }
            }, 500);
            
            this.updateUI();
            this.loop();
            
            for (let i = 0; i < 5; i++) {
                setTimeout(() => { if (this.isRunning) this.spawnInitialEnemy(); }, i * 400);
            }
            
            this.spawnEnemy();
            this.startSpecialSpawner();
        } catch (e) {
            console.error('Game start error:', e);
            alert('游戏启动失败：' + e.message);
        }
    }

    startSpecialSpawner() {
        this.specialTimer = setInterval(() => {
            if (!this.isRunning) return;
            const rand = Math.random();
            let specialType = null;
            if (rand < 0.02) specialType = 'golden';
            else if (rand < 0.05) specialType = 'rainbow';
            else if (rand < 0.09) specialType = 'ghost';
            
            if (specialType) {
                const config = SPECIAL_FISH[specialType];
                const edge = Math.floor(Math.random() * 4);
                let x, y;
                switch(edge) {
                    case 0: x = Math.random() * this.worldWidth; y = -50; break;
                    case 1: x = this.worldWidth + 50; y = Math.random() * this.worldHeight; break;
                    case 2: x = Math.random() * this.worldWidth; y = this.worldHeight + 50; break;
                    case 3: x = -50; y = Math.random() * this.worldHeight; break;
                }
                const special = new Fish(x, y, config.size, config.speed, false, specialType);
                this.enemies.push(special);
                this.showEvolutionNotice(`✨ ${config.name} 出现了！`);
            }
        }, CONFIG.SPECIAL_SPAWN_INTERVAL);
    }

    spawnInitialEnemy() {
        const size = 8 + Math.random() * 7;
        // 从屏幕边缘生成，游向玩家
        const angle = Math.atan2(
            this.player.y - (Math.random() - 0.5) * this.canvas.height,
            this.player.x - (Math.random() - 0.5) * this.canvas.width
        );
        const dist = this.canvas.width * 0.8;
        const x = this.player.x + Math.cos(angle) * dist;
        const y = this.player.y + Math.sin(angle) * dist;
        this.enemies.push(new Fish(x, y, size, 1.5 + Math.random(), false, null, angle + Math.PI));
    }

    restart() {
        this.start();
    }

    spawnEnemy() {
        if (!this.isRunning) return;

        // 计算当前屏幕内的鱼数量（只统计屏幕内的）
        const screenFish = this.enemies.filter(fish => {
            const screenX = fish.x * this.camera.scale + this.camera.x;
            const screenY = fish.y * this.camera.scale + this.camera.y;
            return screenX >= -100 && screenX <= this.canvas.width + 100 &&
                   screenY >= -100 && screenY <= this.canvas.height + 100;
        }).length;
        
        // 屏幕内保持 8-15 条鱼
        const minScreenFish = 8;
        const maxScreenFish = 15;
        
        if (screenFish >= maxScreenFish) {
            setTimeout(() => this.spawnEnemy(), 3000);
            return;
        }

        const playerSize = this.player ? this.player.size : CONFIG.PLAYER_START_SIZE;
        let size;
        if (Math.random() < 0.75) {
            size = Math.random() * (playerSize * 0.6) + playerSize * 0.3;
            size = Math.max(5, Math.min(size, playerSize * 0.9));
        } else {
            size = Math.random() * (playerSize * 0.9) + playerSize * 1.1;
            size = Math.min(size, 80);
        }
        
        // 从世界边界外生成，确保鱼会游进屏幕
        let x, y, angle;
        const edge = Math.floor(Math.random() * 4);
        const spawnMargin = 200; // 生成在边界外 200 像素
        
        switch(edge) {
            case 0: // 上边
                x = Math.random() * this.worldWidth;
                y = -spawnMargin;
                angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5; // 向下
                break;
            case 1: // 右边
                x = this.worldWidth + spawnMargin;
                y = Math.random() * this.worldHeight;
                angle = Math.PI + (Math.random() - 0.5) * 0.5; // 向左
                break;
            case 2: // 下边
                x = Math.random() * this.worldWidth;
                y = this.worldHeight + spawnMargin;
                angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; // 向上
                break;
            case 3: // 左边
                x = -spawnMargin;
                y = Math.random() * this.worldHeight;
                angle = 0 + (Math.random() - 0.5) * 0.5; // 向右
                break;
        }
        
        const enemy = new Fish(x, y, size, 1.5 + Math.random() * 1.5, false, null, angle);
        this.enemies.push(enemy);
        
        // 根据屏幕内鱼数量调整生成速度
        let nextSpawn;
        if (screenFish < minScreenFish) {
            nextSpawn = 800; // 快速生成
        } else {
            nextSpawn = 2000 + Math.random() * 1000; // 正常生成
        }
        setTimeout(() => this.spawnEnemy(), nextSpawn);
    }

    createExplosion(x, y, color, isSpecial = false) {
        const count = Math.min(CONFIG.MAX_PARTICLES / 2, isSpecial ? 30 : 15);
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    checkCollisions() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.player.size + enemy.size) {
                if (this.player.size > enemy.size * 1.1) {
                    const points = enemy.isSpecial ? SPECIAL_FISH[enemy.specialType]?.points || 100 : Math.floor(enemy.size);
                    this.score += points;
                    const grew = this.player.grow(enemy.size * 0.05);
                    this.createExplosion(enemy.x, enemy.y, enemy.color, enemy.isSpecial);
                    
                    if (enemy.isSpecial) {
                        this.soundManager.playSpecialSound();
                    } else {
                        this.soundManager.playEatSound(enemy.size);
                    }
                    
                    // 检查进化
                    if (this.player.checkEvolution() && grew) {
                        this.showEvolutionNotice(`🎉 进化成 ${this.player.fishType.name}！`);
                        this.soundManager.playEvolutionSound();
                    }
                    
                    this.enemies.splice(i, 1);
                    this.updateUI();
                } else if (this.player.size < enemy.size * 0.9) {
                    this.gameOver();
                }
            }
        }
    }

    showEvolutionNotice(text) {
        this.evolutionNotices.push({ text, time: Date.now(), alpha: 1 });
    }

    updateUI() {
        this.scoreEl.textContent = this.score;
        this.sizeEl.textContent = Math.floor(this.player.size);
    }

    gameOver() {
        this.isRunning = false;
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('fishGameHighScore', this.highScore);
        }
        
        this.finalScoreEl.textContent = `${this.score} (最高：${this.highScore})`;
        this.soundManager.playGameOverSound();
        this.soundManager.stopBGM();
        
        if (this.specialTimer) {
            clearInterval(this.specialTimer);
            this.specialTimer = null;
        }
        
        this.gameOverScreen.classList.remove('hidden');
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.worldHeight);
        gradient.addColorStop(0, '#006994');
        gradient.addColorStop(0.5, '#004d7a');
        gradient.addColorStop(1, '#003366');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

        const bottomY = this.worldHeight - 50;
        this.ctx.fillStyle = '#1a1a2e';
        for (let i = 0; i < 6; i++) {
            const x = i * this.worldWidth / 5;
            this.ctx.beginPath();
            this.ctx.ellipse(x, bottomY + 100, this.worldWidth / 8, 100, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.fillStyle = '#2d5016';
        const grassCount = Math.floor(this.worldWidth / 100);
        for (let i = 0; i < grassCount; i++) {
            const x = i * 100 + 50;
            const height = 50 + Math.sin(Date.now() / 1000 + i) * 20;
            this.ctx.beginPath();
            this.ctx.moveTo(x, bottomY);
            this.ctx.quadraticCurveTo(x + 20, bottomY - height / 2, x, bottomY - height);
            this.ctx.quadraticCurveTo(x - 20, bottomY - height / 2, x, bottomY);
            this.ctx.fill();
        }
        
        // 世界边界
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);
    }

    drawEvolutionNotices() {
        const now = Date.now();
        for (let i = this.evolutionNotices.length - 1; i >= 0; i--) {
            const notice = this.evolutionNotices[i];
            const age = now - notice.time;
            
            if (age > 3000) {
                this.evolutionNotices.splice(i, 1);
                continue;
            }
            
            this.ctx.save();
            notice.alpha = 1 - (age / 3000);
            this.ctx.globalAlpha = notice.alpha;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 28px PingFang SC';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
            this.ctx.shadowBlur = 8;
            this.ctx.fillText(notice.text, this.canvas.width / 2, 100 + i * 40);
            this.ctx.restore();
        }
    }

    loop() {
        if (!this.isRunning) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();
        this.updateCamera();

        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.scale, this.camera.scale);

        this.bubbles.forEach(bubble => { bubble.update(); bubble.draw(this.ctx); });

        this.player.targetX = this.mouseX;
        this.player.targetY = this.mouseY;
        this.player.update(this.worldWidth, this.worldHeight, this.player);

        // 更新敌人并移除超时或离开世界的
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.worldWidth, this.worldHeight, this.player, this.camera);
            // 寿命结束或游出世界后移除
            if (enemy.shouldRemove() || enemy.isLeaving) {
                this.enemies.splice(i, 1);
            }
        }

        this.checkCollisions();

        // 绘制所有鱼（每条鱼独立保存/恢复状态）
        this.enemies.forEach(enemy => {
            this.ctx.save();
            this.ctx.globalAlpha = 1.0;
            enemy.draw(this.ctx);
            this.ctx.restore();
        });
        
        // 绘制粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            } else {
                this.ctx.save();
                this.ctx.globalAlpha = p.life;
                p.draw(this.ctx);
                this.ctx.restore();
            }
        }
        
        // 绘制玩家
        this.ctx.save();
        this.ctx.globalAlpha = 1.0;
        this.player.draw(this.ctx);
        this.ctx.restore();

        this.ctx.restore();

        // UI 绘制（不受摄像机影响）
        this.drawEvolutionNotices();

        requestAnimationFrame(() => this.loop());
    }
}

// 启动游戏
const game = new Game();

// 全局函数：按钮文字更新（暴露到 window 供 HTML onclick 调用）
window.toggleBGM = function() {
    const enabled = game.soundManager.toggle();
    const btn = document.getElementById('bgmBtn');
    if (btn) {
        btn.textContent = enabled ? '🔊 音乐开' : '🔇 音乐关';
    }
};
