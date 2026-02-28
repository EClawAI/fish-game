// 大鱼吃小鱼游戏核心逻辑 - 全屏优化版

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
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.color = this.randomColor();
        this.tailAngle = 0;
        this.tailSpeed = 0.1 + Math.random() * 0.1;
        this.fishType = this.getFishType();
        this.glowAngle = 0;
        this.changeDirTimer = 0;
        this.changeDirInterval = 60 + Math.random() * 60;
        
        // 生存周期系统
        this.birthTime = Date.now();
        this.maxLifetime = 15000 + Math.random() * 15000; // 15-30 秒
        this.age = 0;
        this.isDying = false;
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
        // 更新年龄
        this.age = Date.now() - this.birthTime;
        
        // 检查是否超过生命周期
        if (this.age > this.maxLifetime * 0.8) {
            this.isDying = true;
        }
        
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
            // AI 鱼：随机游动
            this.changeDirTimer++;
            
            // 老年鱼游动变慢
            const ageFactor = Math.max(0.3, 1 - (this.age / this.maxLifetime) * 0.5);
            
            // 定期改变方向
            if (this.changeDirTimer > this.changeDirInterval) {
                this.changeDirTimer = 0;
                this.changeDirInterval = 60 + Math.random() * 60;
                this.targetAngle = Math.random() * Math.PI * 2;
            }
            
            // 躲避大鱼（玩家）
            if (player && Math.abs(player.x - this.x) < 200 && Math.abs(player.y - this.y) < 200) {
                if (player.size > this.size) {
                    const escapeAngle = Math.atan2(player.y - this.y, player.x - this.x) + Math.PI;
                    this.targetAngle = escapeAngle;
                }
            }
            
            // 平滑转向
            let angleDiff = this.targetAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.angle += angleDiff * 0.05;
            
            // 根据角度移动
            this.x += Math.cos(this.angle) * this.speed * ageFactor;
            this.y += Math.sin(this.angle) * this.speed * ageFactor;
            
            // 根据游动方向设置朝向
            this.direction = Math.cos(this.angle) > 0 ? 1 : -1;
            
            // 边界检测：碰到边界反弹
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
        // 超过生命周期应该移除
        return this.age > this.maxLifetime;
    }

    draw(ctx, cameraScale = 1) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 老年鱼半透明效果
        if (this.isDying && !this.isPlayer) {
            ctx.globalAlpha = 1 - ((this.age - this.maxLifetime * 0.8) / (this.maxLifetime * 0.2));
        }
        
        const drawAngle = this.isPlayer ? 0 : this.angle;
        ctx.rotate(drawAngle);
        
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
        ctx.globalAlpha = 1;
    }

    draw(ctx, cameraScale = 1) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 根据游动角度旋转
        const drawAngle = this.isPlayer ? 0 : this.angle;
        ctx.rotate(drawAngle);
        
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
                    ctx.arc(-this.size * 0.5 + i * this.size * 0.3, 
                           Math.sin(i) * this.size * 0.3, 
                           this.size * 0.15, 0, Math.PI * 2);
                    ctx.fillStyle = this.lightenColor(this.fishType.color, 40);
                    ctx.fill();
                }
                break;
            case 'scales':
                for (let i = -this.size; i < this.size; i += this.size * 0.3) {
                    ctx.beginPath();
                    ctx.arc(i, 0, this.size * 0.4, -Math.PI * 0.3, Math.PI * 0.3);
                    ctx.stroke();
                }
                break;
            case 'whale':
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
            this.x = Math.random() * canvasWidth;
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
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.camera = {
            x: 0,
            y: 0,
            scale: 1,
            targetScale: 1
        };

        this.init();
        this.resize();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        // 全屏自适应
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;
    }

    init() {
        for (let i = 0; i < 30; i++) {
            this.bubbles.push(new Bubble(this.canvas.width, this.canvas.height));
        }

        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.mouseX = e.touches[0].clientX;
            this.mouseY = e.touches[0].clientY;
        });
    }

    updateCamera() {
        if (!this.player) return;
        
        const baseScale = 1;
        const minScale = 0.4;
        this.camera.targetScale = baseScale - (this.player.size - 15) / 65 * (baseScale - minScale);
        this.camera.targetScale = Math.max(minScale, Math.min(baseScale, this.camera.targetScale));
        
        this.camera.scale += (this.camera.targetScale - this.camera.scale) * 0.05;
        
        const targetX = this.canvas.width / 2 - this.player.x * this.camera.scale;
        const targetY = this.canvas.height / 2 - this.player.y * this.camera.scale;
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
    }

    start() {
        this.player = new Fish(this.canvas.width / 2, this.canvas.height / 2, 15, 3, true);
        this.player.targetX = this.mouseX;
        this.player.targetY = this.mouseY;
        this.enemies = [];
        this.particles = [];
        this.score = 0;
        this.isRunning = true;
        this.camera.scale = 1;
        
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        
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
    }

    spawnInitialEnemy() {
        const size = 8 + Math.random() * 7;
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height;
        const enemy = new Fish(x, y, size, 1 + Math.random() * 2, false);
        this.enemies.push(enemy);
    }

    restart() {
        this.start();
    }

    spawnEnemy() {
        if (!this.isRunning) return;

        // 数量控制：最大敌人数量
        const maxEnemies = 20 + Math.floor(this.score / 100) * 5;
        if (this.enemies.length >= maxEnemies) {
            // 超过最大数量，延迟生成
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
        
        // 从屏幕边缘随机位置生成
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
        // 显示当前鱼群数量
        // this.ctx.fillStyle = 'white';
        // this.ctx.font = '14px PingFang SC';
        // this.ctx.fillText(`鱼群：${this.enemies.length}`, 20, 80);
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

        // 海底
        const bottomY = this.canvas.height - 50;
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.beginPath();
        this.ctx.ellipse(this.canvas.width / 2, bottomY + 100, this.canvas.width / 1.5, 100, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // 海草
        this.ctx.fillStyle = '#2d5016';
        const grassCount = Math.floor(this.canvas.width / 100);
        for (let i = 0; i < grassCount; i++) {
            const x = i * 100 + 50;
            const height = 50 + Math.sin(Date.now() / 1000 + i) * 20;
            this.ctx.beginPath();
            this.ctx.moveTo(x, bottomY);
            this.ctx.quadraticCurveTo(x + 20, bottomY - height / 2, x, bottomY - height);
            this.ctx.quadraticCurveTo(x - 20, bottomY - height / 2, x, bottomY);
            this.ctx.fill();
        }
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

        this.updateCamera();

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

        // 更新敌人并移除超时的鱼
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.canvas.width / this.camera.scale, this.canvas.height / this.camera.scale, this.player);
            
            // 移除超过生命周期的鱼
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
