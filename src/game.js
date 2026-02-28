// 大鱼吃小鱼游戏核心逻辑

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
    }

    randomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
            '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update(canvasWidth, canvasHeight, player) {
        if (this.isPlayer) {
            // 玩家跟随鼠标
            const dx = player.targetX - this.x;
            const dy = player.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                this.x += (dx / dist) * this.speed * 2;
                this.y += (dy / dist) * this.speed * 2;
            }
            // 根据移动方向设置朝向
            if (dx > 0) this.direction = 1;
            else if (dx < 0) this.direction = -1;
        } else {
            // AI 鱼自动游动
            this.x += this.speed * this.direction;
            
            // 边界检测，反向
            if (this.x < -this.size * 2) {
                this.x = canvasWidth + this.size * 2;
                this.direction = -1;
            } else if (this.x > canvasWidth + this.size * 2) {
                this.x = -this.size * 2;
                this.direction = 1;
            }

            // 躲避大鱼
            if (player && Math.abs(player.x - this.x) < 200 && Math.abs(player.y - this.y) < 200) {
                if (player.size > this.size) {
                    // 躲避玩家
                    if (player.x < this.x && this.direction === 1) this.direction = -1;
                    if (player.x > this.x && this.direction === -1) this.direction = 1;
                }
            }
        }

        // 边界限制
        this.y = Math.max(this.size, Math.min(canvasHeight - this.size, this.y));
        
        // 尾巴摆动
        this.tailAngle += this.tailSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.direction, 1);
        
        // 身体（椭圆形）
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.5, this.size, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 身体渐变
        const gradient = ctx.createRadialGradient(-this.size * 0.5, -this.size * 0.3, 0, 0, 0, this.size);
        gradient.addColorStop(0, this.lightenColor(this.color, 30));
        gradient.addColorStop(1, this.color);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 尾巴
        ctx.beginPath();
        const tailWag = Math.sin(this.tailAngle) * 0.3;
        ctx.moveTo(-this.size * 1.2, 0);
        ctx.lineTo(-this.size * 2.2, -this.size * 0.8 + tailWag * this.size);
        ctx.lineTo(-this.size * 2.2, this.size * 0.8 + tailWag * this.size);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();

        // 背鳍
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.5, -this.size * 0.8);
        ctx.quadraticCurveTo(0, -this.size * 1.5, this.size * 0.5, -this.size * 0.8);
        ctx.fillStyle = this.color;
        ctx.fill();

        // 腹鳍
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.3, this.size * 0.7);
        ctx.lineTo(0, this.size * 1.2);
        ctx.lineTo(this.size * 0.3, this.size * 0.7);
        ctx.fillStyle = this.color;
        ctx.fill();

        // 眼睛
        ctx.beginPath();
        ctx.arc(this.size * 0.8, -this.size * 0.3, this.size * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.size * 0.9, -this.size * 0.3, this.size * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();

        // 鱼鳞纹理
        ctx.strokeStyle = this.lightenColor(this.color, 20);
        ctx.lineWidth = 1;
        for (let i = -this.size; i < this.size; i += this.size * 0.3) {
            ctx.beginPath();
            ctx.arc(i, 0, this.size * 0.5, -Math.PI * 0.3, Math.PI * 0.3);
            ctx.stroke();
        }

        ctx.restore();
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
        // 优化：成长速度加快，从 0.05 提升到 0.15
        this.size = Math.min(80, this.size + amount * 3);
        // 优化：速度衰减更平缓
        this.speed = 3 + (20 / this.size);
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

        this.init();
    }

    init() {
        // 创建气泡
        for (let i = 0; i < 20; i++) {
            this.bubbles.push(new Bubble(this.canvas.width, this.canvas.height));
        }

        // 鼠标/触摸控制
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

    start() {
        this.player = new Fish(450, 300, 15, 3, true);
        this.player.targetX = 450;
        this.player.targetY = 300;
        this.enemies = [];
        this.particles = [];
        this.score = 0;
        this.isRunning = true;
        
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        
        this.updateUI();
        this.loop();
        
        // 优化：初始生成几条小鱼，避免开局被秒
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
        
        // 定期生成敌人
        this.spawnEnemy();
    }

    restart() {
        this.start();
    }

    spawnEnemy() {
        if (!this.isRunning) return;

        // 优化：根据玩家大小生成敌人，确保大部分鱼比玩家小
        const playerSize = this.player ? this.player.size : 15;
        
        // 70% 生成比玩家小的鱼，30% 生成比玩家大的鱼
        let size;
        if (Math.random() < 0.7) {
            // 小鱼：玩家大小的 30%-90%
            size = Math.random() * (playerSize * 0.6) + playerSize * 0.3;
            size = Math.max(5, Math.min(size, playerSize * 0.9));
        } else {
            // 大鱼：玩家大小的 110%-200%
            size = Math.random() * (playerSize * 0.9) + playerSize * 1.1;
            size = Math.min(size, 80);
        }
        
        const y = Math.random() * (this.canvas.height - 100) + 50;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const x = direction === 1 ? -50 : this.canvas.width + 50;
        
        const enemy = new Fish(x, y, size, 1 + Math.random() * 2, false);
        enemy.direction = direction;
        this.enemies.push(enemy);

        // 优化：生成速度更快，但难度递增更平缓
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
                    // 吃掉小鱼
                    this.score += Math.floor(enemy.size);
                    this.player.grow(enemy.size * 0.05);
                    this.createExplosion(enemy.x, enemy.y, enemy.color);
                    this.enemies.splice(i, 1);
                    this.updateUI();
                } else if (this.player.size < enemy.size * 0.9) {
                    // 被大鱼吃掉
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
        // 海洋渐变
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#006994');
        gradient.addColorStop(0.5, '#004d7a');
        gradient.addColorStop(1, '#003366');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 海底
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.beginPath();
        this.ctx.ellipse(450, 650, 600, 100, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // 海草
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

    loop() {
        if (!this.isRunning) return;

        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景
        this.drawBackground();

        // 更新和绘制气泡
        this.bubbles.forEach(bubble => {
            bubble.update(this.canvas.height);
            bubble.draw(this.ctx);
        });

        // 更新玩家
        this.player.targetX = this.mouseX;
        this.player.targetY = this.mouseY;
        this.player.update(this.canvas.width, this.canvas.height, this.player);

        // 更新敌人
        this.enemies.forEach(enemy => {
            enemy.update(this.canvas.width, this.canvas.height, this.player);
        });

        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 碰撞检测
        this.checkCollisions();

        // 绘制敌人
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // 绘制粒子
        this.particles.forEach(particle => particle.draw(this.ctx));

        // 绘制玩家
        this.player.draw(this.ctx);

        requestAnimationFrame(() => this.loop());
    }
}

// 启动游戏
const game = new Game();
