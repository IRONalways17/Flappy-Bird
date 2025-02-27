document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const gameIntro = document.getElementById('game-intro');
    const gameOver = document.getElementById('game-over');
    const finalScoreElement = document.getElementById('final-score');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');

    // Game variables
    let gameStarted = false;
    let gameActive = false;
    let gameSpeed = 1.5;               // Reduced game speed for easier play
    let gravity = 0.25;                // Significantly reduced gravity (was 0.4)
    let score = 0;
    let highScore = 0;
    
    // Track if space key is being held down
    let spaceKeyPressed = false;
    
    // Bird object
    const bird = {
        x: 80,
        y: canvas.height / 2 - 50,
        width: 40,
        height: 30,
        velocity: 0,
        jumpStrength: -4,              // Gentler jump
        maxUpwardVelocity: -6,         // Limited max upward speed
        liftForce: -0.4,               // More gentle lift force
        maxFallVelocity: 3,            // NEW: limit maximum falling speed
        rotation: 0,

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            // Bird body
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, this.height / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Bird's eye
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(8, -5, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Bird's beak
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(20, 0);
            ctx.lineTo(12, 4);
            ctx.fill();
            
            // Bird's wing
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.ellipse(-5, 3, 8, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        },

        flap() {
            this.velocity = this.jumpStrength;
            
            // If the game hasn't started yet but is ready, start it
            if (!gameActive && gameStarted) {
                gameActive = true;
            }
        },

        update() {
            // Only apply gravity and movement when game is active
            if (gameActive) {
                // Apply gravity - but slower
                this.velocity += gravity;
                
                // Apply continuous lift when space is held
                if (spaceKeyPressed) {
                    this.velocity += this.liftForce;
                    
                    // Limit upward velocity
                    if (this.velocity < this.maxUpwardVelocity) {
                        this.velocity = this.maxUpwardVelocity;
                    }
                }
                
                // NEW: Limit falling speed
                if (this.velocity > this.maxFallVelocity) {
                    this.velocity = this.maxFallVelocity;
                }
                
                this.y += this.velocity;
                
                // Calculate rotation based on velocity (for smooth tilting effect)
                this.rotation = this.velocity * 0.035;  // Reduced rotation effect
                
                // Cap the rotation to avoid extreme angles
                if (this.rotation > 0.4) this.rotation = 0.4;
                if (this.rotation < -0.4) this.rotation = -0.4;
            }

            // Prevent bird from going off the top of the screen
            if (this.y < this.height / 2) {
                this.y = this.height / 2;
                this.velocity = 0;
            }

            // Check if bird hit the ground
            if (this.y + this.height / 2 > canvas.height - groundHeight) {
                this.y = canvas.height - groundHeight - this.height / 2;
                gameOver.style.display = 'flex';
                finalScoreElement.textContent = score;
                
                // Update high score
                if (score > highScore) {
                    highScore = score;
                }
                
                gameStarted = false;
                gameActive = false;
                spaceKeyPressed = false;
            }
        },
        
        hover() {
            if (!gameActive) {
                const hoverOffset = Math.sin(Date.now() / 300) * 3;
                this.y = canvas.height / 2 - 50 + hoverOffset;
            }
        }
    };

    // Pipes
    let pipes = [];
    const pipeWidth = 70;
    const pipeGap = 180;               // Increased pipe gap for easier play (was 150)
    const pipeSpawnInterval = 2200;    // Longer time between pipes (was 1800)
    let lastPipeTime = 0;

    function createPipe() {
        const minHeight = 80;
        const maxHeight = canvas.height - groundHeight - pipeGap - minHeight;
        const height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
        
        pipes.push({
            x: canvas.width,
            y: 0,
            width: pipeWidth,
            height: height,
            passed: false
        });

        pipes.push({
            x: canvas.width,
            y: height + pipeGap,
            width: pipeWidth,
            height: canvas.height - height - pipeGap - groundHeight,
            passed: false
        });
    }

    function updatePipes() {
        if (!gameActive) return;
        
        const currentTime = Date.now();
        
        if (currentTime - lastPipeTime > pipeSpawnInterval) {
            createPipe();
            lastPipeTime = currentTime;
        }

        for (let i = 0; i < pipes.length; i++) {
            const pipe = pipes[i];
            pipe.x -= gameSpeed;

            if (!pipe.passed && pipe.x + pipe.width < bird.x) {
                pipe.passed = true;
                if (pipe.y === 0) {
                    score += 1;
                }
            }

            // More forgiving collision detection - reduced from 1/3 to 1/4 of bird size
            if (
                bird.x + bird.width / 4 > pipe.x &&
                bird.x - bird.width / 4 < pipe.x + pipe.width &&
                bird.y + bird.height / 4 > pipe.y &&
                bird.y - bird.height / 4 < pipe.y + pipe.height
            ) {
                gameOver.style.display = 'flex';
                finalScoreElement.textContent = score;
                gameStarted = false;
                gameActive = false;
                spaceKeyPressed = false;
            }
        }

        pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
    }

    // Ground
    const groundHeight = 100;
    let groundX = 0;

    function drawGround() {
        ctx.fillStyle = '#ded895';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
        
        ctx.fillStyle = '#7ec850';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, 8);
        
        ctx.strokeStyle = '#c0aa83';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 10; i++) {
            const yPosition = canvas.height - groundHeight + 20 + i * 7;
            ctx.beginPath();
            ctx.moveTo(0, yPosition);
            ctx.lineTo(canvas.width, yPosition);
            ctx.stroke();
        }
    }

    // Background elements
    function drawBackground() {
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height - groundHeight);
        gradient.addColorStop(0, '#72c8fa');
        gradient.addColorStop(1, '#aadeff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height - groundHeight);
        
        ctx.fillStyle = '#ffffff';
        
        // Cloud 1
        ctx.beginPath();
        ctx.arc(120, 100, 30, 0, Math.PI * 2);
        ctx.arc(160, 85, 40, 0, Math.PI * 2);
        ctx.arc(200, 100, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Cloud 2
        ctx.beginPath();
        ctx.arc(320, 70, 25, 0, Math.PI * 2);
        ctx.arc(360, 55, 35, 0, Math.PI * 2);
        ctx.arc(400, 70, 25, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw pipes
    function drawPipes() {
        ctx.fillStyle = '#74BF2E';
        
        for (let i = 0; i < pipes.length; i++) {
            const pipe = pipes[i];
            
            ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
            
            ctx.fillStyle = '#528F22';
            const capHeight = 28;
            const capWidth = 80;
            const capX = pipe.x - (capWidth - pipe.width) / 2;
            
            if (pipe.y === 0) {
                ctx.fillRect(capX, pipe.height - capHeight, capWidth, capHeight);
            } else {
                ctx.fillRect(capX, pipe.y, capWidth, capHeight);
            }
            
            ctx.fillStyle = '#74BF2E';
        }
    }

    // Visual feedback when space is pressed
    function drawThrustEffect() {
        if (gameActive && spaceKeyPressed) {
            // Draw small thrust particles below the bird
            ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';
            for (let i = 0; i < 3; i++) {
                const particleX = bird.x - 10 + Math.random() * 20;
                const particleY = bird.y + 15 + Math.random() * 5;
                const size = 3 + Math.random() * 4;
                ctx.beginPath();
                ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Draw score
    function drawScore() {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(score.toString(), canvas.width / 2, 70);
        
        // Display high score
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, 100);
    }

    // Draw "Get Ready" text when game is not active
    function drawGetReady() {
        if (gameStarted && !gameActive) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("GET READY", canvas.width / 2, canvas.height / 3);
            
            ctx.font = 'bold 24px Arial';
            ctx.fillText("Press & hold SPACE to fly", canvas.width / 2, canvas.height / 3 + 40);
            ctx.fillText("Release to glide gently", canvas.width / 2, canvas.height / 3 + 70);
        }
    }

    // Game UI - displays help message during gameplay
    function drawGameUI() {
        if (gameActive) {
            // Draw a helpful indicator for controls (fades out after a few seconds)
            const gameTime = Date.now() - lastPipeTime;
            if (gameTime < 5000) {  // Show for first 5 seconds of gameplay
                const opacity = 1 - (gameTime / 5000);
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'center';
                ctx.fillText("Hold SPACE to rise, release to glide", canvas.width / 2, canvas.height - 120);
            }
        }
    }

    // Game loop
    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawBackground();
        drawPipes();
        
        if (gameStarted) {
            bird.update();
            bird.hover();
        }
        
        bird.draw();
        drawThrustEffect();
        drawGround();
        drawScore();
        drawGetReady();
        drawGameUI();

        if (gameStarted) {
            updatePipes();
        }

        requestAnimationFrame(gameLoop);
    }

    // Event listeners for keyboard input
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            
            if (!spaceKeyPressed) {
                handleInput();
            }
            
            spaceKeyPressed = true;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            spaceKeyPressed = false;
        }
    });

    // For touch devices, implement continuous movement
    let touchActive = false;
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        
        if (!touchActive) {
            handleInput();
        }
        
        touchActive = true;
        spaceKeyPressed = true;
    });
    
    canvas.addEventListener('touchend', () => {
        touchActive = false;
        spaceKeyPressed = false;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (!touchActive) {
            handleInput();
        }
        
        touchActive = true;
        spaceKeyPressed = true;
    });
    
    canvas.addEventListener('mouseup', () => {
        touchActive = false;
        spaceKeyPressed = false;
    });

    function handleInput() {
        if (!gameStarted) {
            startGame();
        } else {
            bird.flap();
        }
    }

    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);

    function startGame() {
        gameIntro.style.display = 'none';
        gameOver.style.display = 'none';
        gameStarted = true;
        gameActive = false;
        bird.y = canvas.height / 2 - 50;
        bird.velocity = 0;
        bird.rotation = 0;
        pipes = [];
        score = 0;
        lastPipeTime = Date.now();
        spaceKeyPressed = false;
    }

    // Start the game loop
    gameLoop();
});