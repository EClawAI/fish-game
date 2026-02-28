// 大鱼吃小鱼游戏核心逻辑 - 优化版

// 鱼类定义 - 从最小到最大
const FISH_TYPES = [
    { name: '小丑鱼', minSize: 5, maxSize: 15, color: '#FF6B6B', pattern: 'stripes' },
    { name: '热带鱼', minSize: 15, maxSize: 25, color: '#4ECDC4', pattern: 'spots' },
    { name: '金鱼', minSize: 25, maxSize: 35, color: '#FFD93D', pattern: 'gradient' },
    { name: '鲑鱼', minSize: 35, maxSize: 45, color: '#FF8C42', pattern: 'scales' },
    { name: '鲨鱼', minSize: 45, maxSize: 60, color: '#4A90A4', pattern: 'smooth' },
    { name: '鲸鱼', minSize: 60, maxSize: 80, color: '#2E5C8A', pattern: 'whale' }
];

class Fish {
    constructor(x, y, size, speed, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.baseSpeed = speed;
        this.speed = speed;
        this.isPlayer = isPlayer;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.color = this.randomColor();
        this.tailAngle = 0;
        this.tailSpeed = 0.1 + Math.random() * 0.1;
        this.fishType = this.getFishType();
        this.glowAngle = 0;
    }

    getFishType() {
        for (let type of FISH_TYPES) {
            if (this.size >= type.minSize && this.size < type.maxSize) {
                return type;
            }
        }
        return FISH_TYPES[FISH_TYPES.length - 1];
    }

    randomColor() {
        if (this.fishType) {
            return this.fishType.color;
        }
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
            '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update(canvasWidth, canvasHeight, player) {
        if (this.isPlayer) {
            const dx = player.targetX - this.x;
            const dy = player.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                this.x += (dx / dist) * this.speed * 2;
                this.y += (dy / dist) * this.speed * 2;
            }
            if (dx > 0) this.direction = 1;
            else if (dx < 0) this.direction = -1;
            this.glowAngle += 0.1;
        } else {
            this.x += this.speed * this.direction;
            
            if (this.x < -this.size * 2) {
                this.x = canvasWidth + this.size * 2;
                this.direction = -1;
            } else if (this.x > canvasWidth + this.size * 2) {
                this.x = -this.size * 2;
                this.direction = 1;
            }

            if (player && Math.abs(player.x - this.x) < 200 && Math.abs(player.y - this.y) < 200) {
                if (player.size > this.size) {
                    if (player.x < this.x && this.direction === 1) this.direction = -1;
                    if (player.x > this.x && this.direction === -1) this.direction = 1;
                }
            }
        }

        this.y = Math.max(this.size, Math.min(canvasHeight - this.size, this.y));
        this.tailAngle += this.tailSpeed;
    }

    draw(ctx, cameraScale = 1) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.direction * cameraScale, cameraScale);
        
        // 玩家特殊效果：发光光环
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
            
            // 玩家名称标签
            ctx.scale(this.direction, 1);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px PingFang SC';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText('👤 你', 0, -this.size * 2.5);
            ctx.shadowBlur = 0;
            ctx.scale(this.direction, 1);
        }
        
        // 根据鱼的类型绘制不同外观
        this.drawFishBody(ctx);
        this.drawFishPattern(ctx);
        this.drawFishTail(ctx);
        this.drawFishFins(ctx);
        this.drawFishEye(ctx);

        ctx.restore();
    }

    drawFishBody(ctx) {
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.5, this.size, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.fishType ? this.fishType.color : this.color;
        ctx.fill();
        
        const gradient = ctx.createRadialGradient(-this.size * 0.5, -this.size * 0.3, 0, 0, 0, this.size);
        gradient.addColorStop(0, this.lightenColor(this.fishType ? this.fishType.color : this.color, 30));
        gradient.addColorStop(1, this.fishType ? this.fishType.color : this.color);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    drawFishPattern(ctx) {
        if (!this.fishType) return;
        
        ctx.strokeStyle = this.lightenColor(this.fishType.color, 20);
        ctx.lineWidth = 2;
        
        switch(this.fishType.pattern) {
            case 'stripes':
                // 小丑鱼条纹
                for (let i = -this.size * 0.8; i < this.size * 0.8; i += this.size * 0.4) {
                    ctx.beginPath();
                    ctx.moveTo(i, -this.size * 0.7);
                    ctx.lineTo(i + this.size * 0.2, this.size * 0.7);
                    ctx.stroke();
                }
                break;
            case 'spots':
                // 热带鱼斑点
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.arc(-this.size * 0.5 + i * this.size * 0.3, 
                           Math.sin(i) * this.size * 0.3, 
                           this.size * 0.15, 0, Math.PI * 2);
                    ctx.fillStyle = this.lightenColor(this.fishType.color, 40);
                    ctx.fill();
                }
                break;
            case 'scales':
                // 鲑鱼鳞片
                for (let i = -this.size; i < this.size; i += this.size * 0.3) {
                    ctx.beginPath();
                    ctx.arc(i, 0, this.size * 0.4, -Math.PI * 0.3, Math.PI * 0.3);
                    ctx.stroke();
                }
                break;
            case 'whale':
                // 鲸鱼纹理
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.ellipse(-this.size * 0.5 + i * this.size * 0.4, 
                               -this.size * 0.3, 
                               this.size * 0.2, this.size * 0.1, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            default:
                // 默认鳞片
                for (let i = -this.size; i < this.size; i += this.size * 0.3) {
                    ctx.beginPath();
                    ctx.arc(i, 0, this.size * 0.4, -Math.PI * 0.3, Math.PI * 0.3);
                    ctx.stroke();
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
        // 背鳍
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.5, -this.size * 0.8);
        ctx.quadraticCurveTo(0, -this.size * (1.2 + this.size / 100), this.size * 0.5, -this.size * 0.8);
        ctx.fillStyle = this.fishType ? this.fishType.color : this.color;
        ctx.fill();

        // 腹鳍
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
        
        // 玩家额外眼白高光
        if (this.isPlayer) {
            ctx.beginPath();
            ctx.arc(this.size * 0.95, -this.size * 0.35, this.size * 0.05, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
        }
    }

    lightenColor(color, percent) {
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
        ctx.globalAlpha = 1;
    }
}

class Bubble {
    constructor(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth;
        this.y = canvasHeight + 10;
        this.size = Math.random() * 8 + 2;
        this.speed = Math.random() * 1 + 0.5;
        this.wobble = Math.random() * Math.PI * 2;
    }

    update(canvasHeight) {
        this.y -= this.speed;
        this.x += Math.sin(this.wobble) * 0.5;
        this.wobble += 0.05;
        if (this.y < -10) {
            this.y = canvasHeight + 10;
            this.x = Math.random() * 900;
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
        
        this.player = null;
        this.enemies = [];
        this.particles = [];
        this.bubbles = [];
        this.score = 0;
        this.isRunning = false;
        this.mouseX = 450;
        this.mouseY = 300;
        
        // 摄像机系统
        this.camera = {
            x: 0,
            y: 0,
            scale: 1,
            targetScale: 1
        };

        this.init();
    }

    init() {
        for (let i = 0; i < 20; i++) {
            this.bubbles.push(new Bubble(this.canvas.width, this.canvas.height));
        }

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.touches[0].clientX - rect.left;
            this.mouseY = e.touches[0].clientY - rect.top;
        });
    }

    updateCamera() {
        if (!this.player) return;
        
        // 根据玩家大小动态调整摄像机缩放
        // 玩家越大，缩放越小（视野越大）
        const baseScale = 1;
        const minScale = 0.4; // 最大时缩小到 40%
        this.camera.targetScale = baseScale - (this.player.size - 15) / 65 * (baseScale - minScale);
        this.camera.targetScale = Math.max(minScale, Math.min(baseScale, this.camera.targetScale));
        
        // 平滑过渡
        this.camera.scale += (this.camera.targetScale - this.camera.scale) * 0.05;
        
        // 摄像机跟随玩家
        const targetX = this.canvas.width / 2 - this.player.x * this.camera.scale;
        const targetY = this.canvas.height / 2 - this.player.y * this.camera.scale;
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
    }

    start() {
        this.player = new Fish(450, 300, 15, 3, true);
        this.player.targetX = 450;
        this.player.targetY = 300;
        this.enemies = [];
        this.particles = [];
        this.score = 0;
        this.isRunning = true;
        this.camera.scale = 1;
        
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        
        this.updateUI();
        this.loop();
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (this.isRunning) {
                    const size = 8 + Math.random() * 7;
                    const y = Math.random() * (this.canvas.height - 100) + 50;
                    const enemy = new Fish(
                        Math.random() > 0.5 ? -50 : this.canvas.width + 50,
                        y,
                        size,
                        1 + Math.random() * 2,
                        false
                    );
                    enemy.direction = Math.random() > 0.5 ? 1 : -1;
                    this.enemies.push(enemy);
                }
            }, i * 500);
        }
        
        this.spawnEnemy();
    }

    restart() {
        this.start();
    }

    spawnEnemy() {
        if (!this.isRunning) return;

        const playerSize = this.player ? this.player.size : 15;
        
        let size;
        if (Math.random() < 0.7) {
            size = Math.random() * (playerSize * 0.6) + playerSize * 0.3;
            size = Math.max(5, Math.min(size, playerSize * 0.9));
        } else {
            size = Math.random() * (playerSize * 0.9) + playerSize * 1.1;
            size = Math.min(size, 80);
        }
        
        const y = Math.random() * (this.canvas.height - 100) + 50;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const x = direction === 1 ? -50 : this.canvas.width + 50;
        
        const enemy = new Fish(x, y, size, 1 + Math.random() * 2, false);
        enemy.direction = direction;
        this.enemies.push(enemy);

        let nextSpawn = 1500 - Math.min(800, this.score * 5);
        nextSpawn = Math.max(700, nextSpawn);
        
        setTimeout(() => this.spawnEnemy(), nextSpawn);
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
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
                    this.score += Math.floor(enemy.size);
                    this.player.grow(enemy.size * 0.05);
                    this.createExplosion(enemy.x, enemy.y, enemy.color);
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
        this.gameOverScreen.classList.remove('hidden');
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#006994');
        gradient.addColorStop(0.5, '#004d7a');
        gradient.addColorStop(1, '#003366');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.beginPath();
        this.ctx.ellipse(450, 600, 600, 100, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#2d5016';
        for (let i = 0; i < 10; i++) {
            const x = i * 100 + 50;
            const height = 50 + Math.sin(Date.now() / 1000 + i) * 20;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 600);
            this.ctx.quadraticCurveTo(x + 20, 600 - height / 2, x, 600 - height);
            this.ctx.quadraticCurveTo(x - 20, 600 - height / 2, x, 600);
            this.ctx.fill();
        }
    }

    drawFishTypeLegend() {
        // 显示当前鱼类名称
        if (this.player && this.player.fishType) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 16px PingFang SC';
            this.ctx.textAlign = 'left';
            this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            this.ctx.fillText(`🐟 ${this.player.fishType.name}`, 20, 50);
            this.ctx.shadowBlur = 0;
        }
    }

    loop() {
        if (!this.isRunning) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 更新摄像机
        this.updateCamera();

        // 应用摄像机变换
        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.scale, this.camera.scale);

        this.drawBackground();

        this.bubbles.forEach(bubble => {
            bubble.update(this.canvas.height / this.camera.scale);
            bubble.draw(this.ctx);
        });

        this.player.targetX = this.mouseX;
        this.player.targetY = this.mouseY;
        this.player.update(this.canvas.width / this.camera.scale, this.canvas.height / this.camera.scale, this.player);

        this.enemies.forEach(enemy => {
            enemy.update(this.canvas.width / this.camera.scale, this.canvas.height / this.camera.scale, this.player);
        });

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

        // UI 绘制（不受摄像机影响）
        this.drawFishTypeLegend();

        requestAnimationFrame(() => this.loop());
    }
}

const game = new Game();
