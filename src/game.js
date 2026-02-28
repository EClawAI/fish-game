// 大鱼吃小鱼游戏 - 完整版

// 鱼类定义 - 12 种普通鱼 + 3 种特殊鱼
const FISH_TYPES = [
    // 小型鱼 (5-20)
    { name: '小丑鱼', minSize: 5, maxSize: 12, color: '#FF6B6B', pattern: 'stripes', rarity: 'common' },
    { name: '孔雀鱼', minSize: 12, maxSize: 18, color: '#FF9FF3', pattern: 'gradient', rarity: 'common' },
    { name: '灯鱼', minSize: 18, maxSize: 25, color: '#54A0FF', pattern: 'glow', rarity: 'common' },
    
    // 中型鱼 (25-45)
    { name: '神仙鱼', minSize: 25, maxSize: 32, color: '#48DBFB', pattern: 'elegant', rarity: 'common' },
    { name: '蝴蝶鱼', minSize: 32, maxSize: 38, color: '#FFD93D', pattern: 'spots', rarity: 'common' },
    { name: '鹦鹉鱼', minSize: 38, maxSize: 45, color: '#FF6B9D', pattern: 'colorful', rarity: 'common' },
    
    // 大型鱼 (45-65)
    { name: '金枪鱼', minSize: 45, maxSize: 52, color: '#C8D6E5', pattern: 'streamline', rarity: 'common' },
    { name: '鲨鱼', minSize: 52, maxSize: 60, color: '#576574', pattern: 'smooth', rarity: 'uncommon' },
    { name: '魔鬼鱼', minSize: 60, maxSize: 65, color: '#8395A7', pattern: 'wing', rarity: 'uncommon' },
    
    // 巨型鱼 (65-80)
    { name: '海豚', minSize: 65, maxSize: 72, color: '#0ABDE3', pattern: 'smart', rarity: 'rare' },
    { name: '虎鲸', minSize: 72, maxSize: 78, color: '#222F3E', pattern: 'orca', rarity: 'rare' },
    { name: '蓝鲸', minSize: 78, maxSize: 80, color: '#1E3799', pattern: 'whale', rarity: 'legendary' }
];

// 特殊鱼类（稀有）
const SPECIAL_FISH = {
    golden: {
        name: '🌟 黄金鱼',
        size: 25,
        color: '#FFD700',
        pattern: 'golden',
        rarity: 'special',
        points: 500,
        speed: 4,
        spawnChance: 0.02 // 2% 概率
    },
    rainbow: {
        name: '🌈 彩虹鱼',
        size: 30,
        color: 'rainbow',
        pattern: 'rainbow',
        rarity: 'special',
        points: 300,
        speed: 3.5,
        spawnChance: 0.03 // 3% 概率
    },
    ghost: {
        name: '👻 幽灵鱼',
        size: 35,
        color: '#A8E6CF',
        pattern: 'ghost',
        rarity: 'special',
        points: 200,
        speed: 2,
        spawnChance: 0.04 // 4% 概率
    }
};

class Fish {
    constructor(x, y, size, speed, isPlayer = false, specialType = null) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.baseSpeed = speed;
        this.speed = speed;
        this.isPlayer = isPlayer;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.color = this.randomColor();
        this.tailAngle = 0;
        this.tailSpeed = 0.1 + Math.random() * 0.1;
        this.fishType = this.getFishType();
        this.glowAngle = 0;
        this.changeDirTimer = 0;
        this.changeDirInterval = 60 + Math.random() * 60;
        
        // 特殊鱼类
        this.specialType = specialType;
        this.isSpecial = specialType !== null;
        this.rainbowAngle = 0;
        
        // 生存周期
        this.birthTime = Date.now();
        this.maxLifetime = this.isSpecial ? 30000 : 15000 + Math.random() * 15000;
        this.age = 0;
        this.isDying = false;
        
        // 音效
        this.eatenSound = null;
    }

    getFishType() {
        if (this.specialType) {
            return SPECIAL_FISH[this.specialType];
        }
        for (let type of FISH_TYPES) {
            if (this.size >= type.minSize && this.size < type.maxSize) {
                return type;
            }
        }
        return FISH_TYPES[FISH_TYPES.length - 1];
    }

    randomColor() {
        if (this.specialType) {
            return SPECIAL_FISH[this.specialType].color;
        }
        if (this.fishType) {
            return this.fishType.color;
        }
        return '#4ECDC4';
    }

    update(canvasWidth, canvasHeight, player) {
        this.age = Date.now() - this.birthTime;
        
        if (this.age > this.maxLifetime * 0.8) {
            this.isDying = true;
        }
        
        // 彩虹鱼颜色变化
        if (this.specialType === 'rainbow') {
            this.rainbowAngle += 0.05;
        }
        
        if (this.isPlayer) {
            // 玩家直接移动到鼠标位置（带平滑）
            const dx = player.targetX - this.x;
            const dy = player.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 10) {
                // 快速跟随鼠标
                const moveSpeed = Math.min(dist * 0.15, this.speed * 3);
                this.x += (dx / dist) * moveSpeed;
                this.y += (dy / dist) * moveSpeed;
            } else {
                // 接近鼠标时微调
                this.x += dx * 0.1;
                this.y += dy * 0.1;
            }
            
            // 根据移动方向设置朝向
            if (Math.abs(dx) > 5) {
                this.direction = dx > 0 ? 1 : -1;
            }
            this.glowAngle += 0.1;
        } else {
            this.changeDirTimer++;
            
            const ageFactor = Math.max(0.3, 1 - (this.age / this.maxLifetime) * 0.5);
            
            if (this.changeDirTimer > this.changeDirInterval) {
                this.changeDirTimer = 0;
                this.changeDirInterval = 60 + Math.random() * 60;
                this.targetAngle = Math.random() * Math.PI * 2;
            }
            
            if (player && Math.abs(player.x - this.x) < 200 && Math.abs(player.y - this.y) < 200) {
                if (player.size > this.size) {
                    const escapeAngle = Math.atan2(player.y - this.y, player.x - this.x) + Math.PI;
                    this.targetAngle = escapeAngle;
                }
            }
            
            let angleDiff = this.targetAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.angle += angleDiff * 0.05;
            
            this.x += Math.cos(this.angle) * this.speed * ageFactor;
            this.y += Math.sin(this.angle) * this.speed * ageFactor;
            
            this.direction = Math.cos(this.angle) > 0 ? 1 : -1;
            
            const margin = this.size * 2;
            if (this.x < -margin) {
                this.x = canvasWidth + margin;
                this.targetAngle = Math.random() * Math.PI - Math.PI / 2;
            } else if (this.x > canvasWidth + margin) {
                this.x = -margin;
                this.targetAngle = Math.random() * Math.PI + Math.PI / 2;
            }
            if (this.y < -margin) {
                this.y = canvasHeight + margin;
                this.targetAngle = Math.random() * Math.PI;
            } else if (this.y > canvasHeight + margin) {
                this.y = -margin;
                this.targetAngle = Math.random() * Math.PI + Math.PI;
            }
        }

        this.tailAngle += this.tailSpeed;
    }

    shouldRemove() {
        return this.age > this.maxLifetime;
    }

    draw(ctx, cameraScale = 1) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const drawAngle = this.isPlayer ? 0 : this.angle;
        ctx.rotate(drawAngle);
        
        if (this.isSpecial) {
            this.drawSpecialEffect(ctx);
        }
        
        if (this.isPlayer) {
            const glowSize = this.size * 2.5 + Math.sin(this.glowAngle) * 3;
            const gradient = ctx.createRadialGradient(0, 0, this.size * 1.5, 0, 0, glowSize);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.15)');
            gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
            ctx.beginPath();
            ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            ctx.rotate(-drawAngle);
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
        // 特殊鱼类光环
        const time = Date.now() / 200;
        
        if (this.specialType === 'golden') {
            // 金色光芒
            const gradient = ctx.createRadialGradient(0, 0, this.size, 0, 0, this.size * 2.5);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // 闪烁星星
            if (Math.sin(time * 2) > 0.7) {
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.arc(Math.sin(time) * this.size * 1.5, Math.cos(time) * this.size * 1.5, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.specialType === 'rainbow') {
            // 彩虹色
            const hue = (this.rainbowAngle * 50) % 360;
            ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.5)`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.8, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.specialType === 'ghost') {
            // 幽灵半透明
            ctx.globalAlpha = 0.6 + Math.sin(time) * 0.2;
            
            // 小幽灵粒子
            if (Math.random() < 0.1) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(this.size * 2, -this.size * 2, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawFishBody(ctx) {
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.5, this.size, 0, 0, Math.PI * 2);
        
        if (this.specialType === 'rainbow') {
            const hue = (this.rainbowAngle * 50) % 360;
            ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        } else {
            ctx.fillStyle = this.fishType ? this.fishType.color : this.color;
        }
        ctx.fill();
        
        const gradient = ctx.createRadialGradient(-this.size * 0.5, -this.size * 0.3, 0, 0, 0, this.size);
        const baseColor = this.specialType === 'rainbow' ? `hsl(${(this.rainbowAngle * 50) % 360}, 80%, 60%)` : (this.fishType ? this.fishType.color : this.color);
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
            // 金色闪光
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
                case 'whale':
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.ellipse(-this.size * 0.5 + i * this.size * 0.4, -this.size * 0.3, this.size * 0.2, this.size * 0.1, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                default:
                    for (let i = -this.size; i < this.size; i += this.size * 0.3) {
                        ctx.beginPath();
                        ctx.arc(i, 0, this.size * 0.4, -Math.PI * 0.3, Math.PI * 0.3);
                        ctx.stroke();
                    }
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
        ctx.quadraticCurveTo(0, -this.size * (1.2 + this.size / 100), this.size * 0.5, -this.size * 0.8);
        ctx.fillStyle = this.fishType ? this.fishType.color : this.color;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-this.size * 0.3, this.size * 0.7);
        ctx.lineTo(0, this.size * (0.9 + this.size / 150));
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
        this.size = Math.min(80, this.size + amount * 3);
        this.speed = 3 + (20 / this.size);
        this.fishType = this.getFishType();
    }
}

// 音效管理器
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.bgmPlaying = false;
        this.bgmOscillators = [];
        this.enabled = true;
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
        
        // 根据鱼大小改变音调
        osc.frequency.value = 800 - size * 5;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    playSpecialSound() {
        if (!this.enabled || !this.audioContext) return;
        
        // 特殊鱼类音效（和弦）
        const notes = [523.25, 659.25, 783.99]; // C大调和弦
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.frequency.value = freq;
                osc.type = 'sine';
                
                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.3);
            }, i * 100);
        });
    }

    playGameOverSound() {
        if (!this.enabled || !this.audioContext) return;
        
        const notes = [392, 370, 349, 311]; // 下降音阶
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.frequency.value = freq;
                osc.type = 'triangle';
                
                gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.4);
            }, i * 150);
        });
    }

    startBGM() {
        if (!this.enabled || !this.audioContext || this.bgmPlaying) return;
        
        this.bgmPlaying = true;
        const now = this.audioContext.currentTime;
        
        // 创建海浪声（粉红噪声模拟）
        this.bgmGain = this.audioContext.createGain();
        this.bgmGain.gain.value = 0.05;
        this.bgmGain.connect(this.audioContext.destination);
        
        // 使用多个振荡器模拟海浪
        const waveFreqs = [80, 120, 180, 250, 350];
        
        this.bgmOscillators = waveFreqs.map((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            // 缓慢的音量变化模拟海浪起伏
            const lfo = this.audioContext.createOscillator();
            lfo.frequency.value = 0.1 + i * 0.05; // 非常慢的调制
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
        
        // 添加低频隆隆声（深海效果）
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
            try {
                osc.stop(now + 1);
                if (lfo) lfo.stop(now + 1);
            } catch (e) {}
        });
        
        this.bgmPlaying = false;
        this.bgmOscillators = [];
        this.bgmGain = null;
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.startBGM();
        } else {
            this.stopBGM();
        }
        return this.enabled;
    }
}

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
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore(); // 已在 draw 函数末尾恢复
    }
}

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
        this.isRunning = false;
        this.mouseX = 0;
        this.mouseY = 0;
        
        // 游戏世界大小：3x3 屏幕 = 9 个屏幕
        this.worldWidth = 0;
        this.worldHeight = 0;
        
        this.camera = {
            x: 0,
            y: 0,
            scale: 1,
            targetScale: 1
        };
        
        this.soundManager = new SoundManager();
        this.specialSpawnTimer = 0;

        this.init();
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;
        
        // 游戏世界 = 3x3 屏幕
        this.worldWidth = this.canvas.width * 3;
        this.worldHeight = this.canvas.height * 3;
    }

    init() {
        for (let i = 0; i < 30; i++) {
            this.bubbles.push(new Bubble(this.canvas.width, this.canvas.height));
        }

        // 全局鼠标监听（即使移出 canvas 也能跟踪）
        document.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            
            // 限制在画布范围内
            this.mouseX = Math.max(0, Math.min(this.canvas.width, this.mouseX));
            this.mouseY = Math.max(0, Math.min(this.canvas.height, this.mouseY));
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.touches[0].clientX - rect.left;
            this.mouseY = e.touches[0].clientY - rect.top;
            
            this.mouseX = Math.max(0, Math.min(this.canvas.width, this.mouseX));
            this.mouseY = Math.max(0, Math.min(this.canvas.height, this.mouseY));
        });
        
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    updateCamera() {
        if (!this.player) return;
        
        const baseScale = 1;
        const minScale = 0.4;
        this.camera.targetScale = baseScale - (this.player.size - 15) / 65 * (baseScale - minScale);
        this.camera.targetScale = Math.max(minScale, Math.min(baseScale, this.camera.targetScale));
        this.camera.scale += (this.camera.targetScale - this.camera.scale) * 0.05;
        
        // 基于鼠标位置移动摄像机
        const edgeMargin = this.canvas.width * 0.15; // 屏幕边缘 15% 区域
        const moveSpeed = 0.03; // 摄像机移动速度
        
        // 检测鼠标是否在屏幕边缘
        let targetX = this.camera.x;
        let targetY = this.camera.y;
        
        // 鼠标在左边缘 → 摄像机向左移动
        if (this.mouseX < edgeMargin) {
            targetX += (edgeMargin - this.mouseX) * moveSpeed;
        }
        // 鼠标在右边缘 → 摄像机向右移动
        else if (this.mouseX > this.canvas.width - edgeMargin) {
            targetX -= (this.mouseX - (this.canvas.width - edgeMargin)) * moveSpeed;
        }
        
        // 鼠标在上边缘 → 摄像机向上移动
        if (this.mouseY < edgeMargin) {
            targetY += (edgeMargin - this.mouseY) * moveSpeed;
        }
        // 鼠标在下边缘 → 摄像机向下移动
        else if (this.mouseY > this.canvas.height - edgeMargin) {
            targetY -= (this.mouseY - (this.canvas.height - edgeMargin)) * moveSpeed;
        }
        
        // 平滑移动
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        // 限制摄像机在世界范围内
        const maxX = this.worldWidth / 2 - this.canvas.width / 2;
        const maxY = this.worldHeight / 2 - this.canvas.height / 2;
        const minX = -maxX;
        const minY = -maxY;
        
        this.camera.x = Math.max(minX, Math.min(maxX, this.camera.x));
        this.camera.y = Math.max(minY, Math.min(maxY, this.camera.y));
    }

    start() {
        try {
            this.soundManager.init();
        } catch (e) {
            console.log('Audio init failed:', e);
        }
        
        // 玩家从世界中心开始
        this.player = new Fish(this.worldWidth / 2, this.worldHeight / 2, 15, 3, true);
        this.player.targetX = this.mouseX;
        this.player.targetY = this.mouseY;
        this.enemies = [];
        this.particles = [];
        this.score = 0;
        this.isRunning = true;
        this.camera.scale = 1;
        this.camera.x = 0;
        this.camera.y = 0;
        this.specialSpawnTimer = 0;
        
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        
        setTimeout(() => {
            try {
                if (this.soundManager.enabled && this.isRunning) {
                    this.soundManager.startBGM();
                }
            } catch (e) {
                console.log('BGM start failed:', e);
            }
        }, 500);
        
        this.updateUI();
        this.loop();
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (this.isRunning) {
                    this.spawnInitialEnemy();
                }
            }, i * 400);
        }
        
        this.spawnEnemy();
        this.spawnSpecialFish();
    }

    spawnInitialEnemy() {
        const size = 8 + Math.random() * 7;
        // 在玩家附近生成
        const x = this.player.x + (Math.random() - 0.5) * this.canvas.width;
        const y = this.player.y + (Math.random() - 0.5) * this.canvas.height;
        const enemy = new Fish(x, y, size, 1 + Math.random() * 2, false);
        this.enemies.push(enemy);
    }

    restart() {
        this.start();
    }

    spawnEnemy() {
        if (!this.isRunning) return;

        const maxEnemies = 20 + Math.floor(this.score / 100) * 5;
        if (this.enemies.length >= maxEnemies) {
            setTimeout(() => this.spawnEnemy(), 2000);
            return;
        }

        const playerSize = this.player ? this.player.size : 15;
        
        let size;
        if (Math.random() < 0.7) {
            size = Math.random() * (playerSize * 0.6) + playerSize * 0.3;
            size = Math.max(5, Math.min(size, playerSize * 0.9));
        } else {
            size = Math.random() * (playerSize * 0.9) + playerSize * 1.1;
            size = Math.min(size, 80);
        }
        
        let x, y;
        const edge = Math.floor(Math.random() * 4);
        switch(edge) {
            case 0: x = Math.random() * this.canvas.width; y = -50; break;
            case 1: x = this.canvas.width + 50; y = Math.random() * this.canvas.height; break;
            case 2: x = Math.random() * this.canvas.width; y = this.canvas.height + 50; break;
            case 3: x = -50; y = Math.random() * this.canvas.height; break;
        }
        
        const enemy = new Fish(x, y, size, 1 + Math.random() * 2, false);
        this.enemies.push(enemy);

        let nextSpawn = 1500 - Math.min(800, this.score * 5);
        nextSpawn = Math.max(700, nextSpawn);
        
        setTimeout(() => this.spawnEnemy(), nextSpawn);
    }

    spawnSpecialFish() {
        if (!this.isRunning) return;
        
        // 每 30 秒尝试生成特殊鱼类
        this.specialTimer = setInterval(() => {
            if (!this.isRunning || this.enemies.length < 5) return;
            
            const rand = Math.random();
            let specialType = null;
            
            if (rand < 0.02) {
                specialType = 'golden';
            } else if (rand < 0.05) {
                specialType = 'rainbow';
            } else if (rand < 0.09) {
                specialType = 'ghost';
            }
            
            if (specialType) {
                const config = SPECIAL_FISH[specialType];
                const edge = Math.floor(Math.random() * 4);
                let x, y;
                switch(edge) {
                    case 0: x = Math.random() * this.canvas.width; y = -50; break;
                    case 1: x = this.canvas.width + 50; y = Math.random() * this.canvas.height; break;
                    case 2: x = Math.random() * this.canvas.width; y = this.canvas.height + 50; break;
                    case 3: x = -50; y = Math.random() * this.canvas.height; break;
                }
                
                const special = new Fish(x, y, config.size, config.speed, false, specialType);
                this.enemies.push(special);
                
                // 特殊鱼生成提示
                try {
                    this.showSpecialNotice(config.name);
                } catch (e) {
                    console.log('Notice failed:', e);
                }
            }
        }, 30000);
    }

    showSpecialNotice(name) {
        const notice = document.createElement('div');
        notice.textContent = `✨ ${name} 出现了！`;
        notice.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 32px;
            color: #FFD700;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
            pointer-events: none;
            z-index: 300;
            animation: fadeOut 2s forwards;
        `;
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 2000);
    }

    createExplosion(x, y, color, isSpecial = false) {
        const count = isSpecial ? 30 : 15;
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
                    const points = enemy.isSpecial ? (SPECIAL_FISH[enemy.specialType]?.points || 100) : Math.floor(enemy.size);
                    this.score += points;
                    this.player.grow(enemy.size * 0.05);
                    this.createExplosion(enemy.x, enemy.y, enemy.color, enemy.isSpecial);
                    
                    if (enemy.isSpecial) {
                        this.soundManager.playSpecialSound();
                    } else {
                        this.soundManager.playEatSound(enemy.size);
                    }
                    
                    this.enemies.splice(i, 1);
                    this.updateUI();
                } else if (this.player.size < enemy.size * 0.9) {
                    this.gameOver();
                }
            }
        }
    }

    updateUI() {
        this.scoreEl.textContent = this.score;
        this.sizeEl.textContent = Math.floor(this.player.size);
    }

    gameOver() {
        this.isRunning = false;
        this.finalScoreEl.textContent = this.score;
        try {
            this.soundManager.playGameOverSound();
            this.soundManager.stopBGM();
        } catch (e) {
            console.log('Sound error:', e);
        }
        this.gameOverScreen.classList.remove('hidden');
    }

    drawBackground() {
        // 绘制世界背景（受摄像机影响）
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.worldHeight);
        gradient.addColorStop(0, '#006994');
        gradient.addColorStop(0.5, '#004d7a');
        gradient.addColorStop(1, '#003366');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

        // 海底（世界底部）
        const bottomY = this.worldHeight - 50;
        this.ctx.fillStyle = '#1a1a2e';
        
        // 绘制多个海底丘陵
        for (let i = 0; i < 6; i++) {
            const x = i * this.worldWidth / 5;
            this.ctx.beginPath();
            this.ctx.ellipse(x, bottomY + 100, this.worldWidth / 8, 100, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 海草（世界底部）
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
        
        // 绘制世界边界提示
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);
    }

    drawFishTypeLegend() {
        if (this.player && this.player.fishType) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 16px PingFang SC';
            this.ctx.textAlign = 'left';
            this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
            this.ctx.shadowBlur = 4;
            this.ctx.fillText(`🐟 ${this.player.fishType.name}`, 20, 50);
            this.ctx.shadowBlur = 0;
        }
    }

    loop() {
        if (!this.isRunning) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 先绘制背景（不受摄像机影响）
        this.drawBackground();

        this.updateCamera();

        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.scale, this.camera.scale);

        this.bubbles.forEach(bubble => {
            bubble.update();
            bubble.draw(this.ctx);
        });

        this.player.targetX = this.mouseX;
        this.player.targetY = this.mouseY;
        this.player.update(this.worldWidth, this.worldHeight, this.player);

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.worldWidth, this.worldHeight, this.player);
            
            if (enemy.shouldRemove()) {
                this.enemies.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        this.checkCollisions();

        this.enemies.forEach(enemy => enemy.draw(this.ctx, 1));
        this.particles.forEach(particle => particle.draw(this.ctx));
        this.player.draw(this.ctx, 1);

        this.ctx.restore();

        this.drawFishTypeLegend();

        requestAnimationFrame(() => this.loop());
    }
}

const game = new Game();

// 添加 CSS 动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
    }
`;
document.head.appendChild(style);
