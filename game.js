const GAME={

level:0,

lives:3,

score:0,

time:0,

paused:false,

ballSpeed:5,

countryIndex:0

};

let unlockedCountries =
JSON.parse(
    localStorage.getItem(
        "brickflags-unlocked"
    )
) || [0];

let canvas=
document.getElementById("gameCanvas");

let ctx=
canvas.getContext("2d");

let paddle={

x:180,
y:680,

width:120,
height:16,

speed:10

};

let ball={

x:240,
y:400,

r:10,

dx:5,
dy:-5,

color:"#65d8ff"

};

// ---------- Render ----------

let bricks = [];

let flagImage = new Image();


// ---------- Audio ----------

let currentAnthem = null;

let anthemPosition = 0;


// ---------- Game Loop ----------

let gameLoopRunning = false;

let gameSession = 0;

let levelTransition = false;

let saveLocked = false;

let lastTimeUpdate = Date.now();


// ---------- Controls ----------

let leftPressed = false;

let rightPressed = false;

let touchLeft = false;

let touchRight = false;
const G={

musicOn:true,
sfxOn:true,
vibOn:true,

musicVol:0.7,
sfxVol:0.7

};

function saveSettings(){

localStorage.setItem(
"brickflags-settings",

JSON.stringify(G)

);

}

function loadSettings(){

const saved =
localStorage.getItem(
"brickflags-settings"
);

if(saved){

Object.assign(
G,
JSON.parse(saved)
);

}

}

function updateSettingsUI(){

    const tM=document.getElementById('tog-music');

    const tS=document.getElementById('tog-sfx');

    const tV=document.getElementById('tog-vib');

    tM.textContent=G.musicOn?'ON':'OFF';
    tM.className='stog '+(G.musicOn?'ton':'toff');

    tS.textContent=G.sfxOn?'ON':'OFF';
    tS.className='stog '+(G.sfxOn?'ton':'toff');

    tV.textContent=G.vibOn?'ON':'OFF';
    tV.className='stog '+(G.vibOn?'ton':'toff');

    buildVolBar('vbar-music',G.musicOn?Math.round(G.musicVol*7):0);

    buildVolBar('vbar-sfx',G.sfxOn?Math.round(G.sfxVol*7):0);

}

function buildVolBar(id, filled){

    const el = document.getElementById(id);

    if(!el){

        return;

    }

    el.innerHTML = "";

    for(let i = 0; i < 7; i++){

        const s = document.createElement("span");

        s.className =
            "vseg " +
            (i < filled ? "vfill" : "vempty");

        s.onclick = ()=>{

            const lv = (i + 1) / 7;

            if(id === "vbar-music"){

                G.musicVol = lv;

                if(!G.musicOn){

                    G.musicOn = true;

                }

                if(currentAnthem){

                    currentAnthem.volume = G.musicVol;

                }

            }

            if(id === "vbar-sfx"){

                G.sfxVol = lv;

                if(!G.sfxOn){

                    G.sfxOn = true;

                }

            }

            updateSettingsUI();

            saveSettings();

        };

        el.appendChild(s);

    }

}

function toggleMusic(){

    G.musicOn = !G.musicOn;

    if(!G.musicOn){

        pauseAnthem();

    }

    updateSettingsUI();

    saveSettings();

}

function toggleSfx(){

    G.sfxOn=!G.sfxOn;

    updateSettingsUI();
    
    saveSettings();

}

function toggleVib(){

    G.vibOn=!G.vibOn;

    updateSettingsUI();

    saveSettings();

}

function buildFlagLevel(){

    bricks=[];

    let colors=
    COUNTRIES[
    GAME.countryIndex
    ].colors;
    flagImage.src =
COUNTRIES[
GAME.countryIndex
].flag;

    let stage =
    Math.floor(
        GAME.level / 15
    );

    let rows =
    Math.min(
        4 + stage,
        12
    );

    let cols =
    Math.min(
        6 + stage * 2,
        16
    );

    let brickWidth =
    480 / cols;

    let brickHeight =
    240 / rows;

    for(let row=0;row<rows;row++){

        for(let col=0;col<cols;col++){

            bricks.push({

x:col*brickWidth,

y:80+
row*brickHeight,

w:brickWidth-2,

h:brickHeight-2,

row:row,

col:col,

rows:rows,

cols:cols,

alive:true

});

        }

    }

    document.getElementById(
    "countryName"
    ).innerText=
    COUNTRIES[
    GAME.countryIndex
    ].country;

    playAnthem();

}

function playAnthem(startTime = 0){

    if(!G.musicOn){

    return;

}

if(currentAnthem){

    currentAnthem.pause();
    currentAnthem.currentTime = 0;

}

    currentAnthem =
    new Audio(
        COUNTRIES[
            GAME.countryIndex
        ].anthem
    );

    currentAnthem.loop = true;

    currentAnthem.volume =
    G.musicVol;

    currentAnthem.addEventListener(
        "loadedmetadata",
        ()=>{

            currentAnthem.currentTime =
            startTime;

            anthemPosition =
            startTime;

            currentAnthem.play()
            .catch(()=>{});

        },
        { once:true }
    );

    currentAnthem.onended = ()=>{

    if(

        G.musicOn &&
        !GAME.paused

    ){

        currentAnthem.currentTime = 0;

        currentAnthem.play();

    }

};

}

function stopAnthem(reset = true){

    if(!currentAnthem){

        return;

    }

    if(!reset){

        anthemPosition =
        currentAnthem.currentTime;

    }

    currentAnthem.pause();

    if(reset){

        currentAnthem.currentTime = 0;
        anthemPosition = 0;

    }

    currentAnthem = null;

}

function pauseAnthem(){

    if(!currentAnthem){

        return;

    }

    anthemPosition =
    currentAnthem.currentTime;

    currentAnthem.pause();

}

function resumeAnthem(){

    if(!G.musicOn){

        return;

    }

    if(currentAnthem){

        currentAnthem.currentTime =
        anthemPosition;

        currentAnthem.volume =
        G.musicVol;

        currentAnthem.play()
        .catch(()=>{});

        return;

    }

    playAnthem(anthemPosition);

}

const audioCtx =
new (
window.AudioContext ||
window.webkitAudioContext
)();

function restoreAnthem(){

    if(!G.musicOn){

        return;

    }

    stopAnthem();

    currentAnthem =
    new Audio(
        COUNTRIES[
            GAME.countryIndex
        ].anthem
    );

    currentAnthem.volume =
    G.musicVol;

    currentAnthem.loop = true;

    currentAnthem.addEventListener(
        "loadedmetadata",
        ()=>{

            currentAnthem.currentTime =
            anthemPosition;

            currentAnthem.play()
            .catch(()=>{});

        }
    );

}

function playSfx(type){

if(!G.sfxOn){

    return;

}

const osc =
audioCtx.createOscillator();

const gain =
audioCtx.createGain();

osc.connect(gain);
gain.connect(
    audioCtx.destination
);

gain.gain.value =
0.08 * G.sfxVol;

switch(type){

    case "bounce":

        osc.type = "square";
        osc.frequency.value = 500;

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + 0.05
        );

        osc.start();
        osc.stop(
            audioCtx.currentTime + 0.05
        );

    break;

    case "levelup":

        osc.type = "triangle";

        osc.frequency.setValueAtTime(
            400,
            audioCtx.currentTime
        );

        osc.frequency.linearRampToValueAtTime(
            900,
            audioCtx.currentTime + 0.25
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + 0.25
        );

        osc.start();
        osc.stop(
            audioCtx.currentTime + 0.25
        );

    break;

    case "gameover":

        osc.type = "sawtooth";

        osc.frequency.setValueAtTime(
            500,
            audioCtx.currentTime
        );

        osc.frequency.linearRampToValueAtTime(
            120,
            audioCtx.currentTime + 0.6
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + 0.6
        );

        osc.start();
        osc.stop(
            audioCtx.currentTime + 0.6
        );

    break;

}

}


function vibrate(ms){

    if(
        !G.vibOn ||
        !navigator.vibrate
    ){

        return;

    }

    navigator.vibrate(ms);

}

function update(){

    const session = gameSession;

    if(GAME.paused){
        
        gameLoopRunning = false;
        return;

    }

    gameLoopRunning = true;
    const now = Date.now();

    if(now - lastTimeUpdate >= 1000){

        GAME.time++;

        updateTimer();

        lastTimeUpdate = now;

    }

        // mover pelota
        ball.x += ball.dx;
        ball.y += ball.dy;

    // mover paleta

    if(leftPressed){

        paddle.x -= paddle.speed;

    }

    if(rightPressed){

        paddle.x += paddle.speed;

    }

    if(touchLeft){

        paddle.x -= paddle.speed;

    }

    if(touchRight){

        paddle.x += paddle.speed;

    }

    // límites de pantalla

    if(paddle.x < 0){

        paddle.x = 0;

    }

    if(paddle.x + paddle.width > canvas.width){

        paddle.x = canvas.width - paddle.width;

    }

        // paredes izquierda y derecha
        if(ball.x - ball.r <= 0){

        ball.x = ball.r;

        ball.dx = Math.abs(ball.dx);

        playSfx("bounce");

    }

    else if(
        ball.x + ball.r >= canvas.width
    ){

        ball.x =
        canvas.width -
        ball.r;

        ball.dx =
        -Math.abs(ball.dx);

        playSfx("bounce");

    }

        // techo
        if(ball.y - ball.r <= 0){

        ball.y = ball.r;

        ball.dy =
        Math.abs(ball.dy);

        playSfx("bounce");

    }

        // colisión con la paleta
        if(

    ball.y + ball.r >= paddle.y &&
    ball.y - ball.r <= paddle.y + paddle.height &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width &&
    ball.dy > 0

){

    const hitPosition =
        (ball.x - (paddle.x + paddle.width / 2))
        / (paddle.width / 2);

    const maxAngle = Math.PI / 4;

    const angle = hitPosition * maxAngle;

    ball.dx =
        GAME.ballSpeed * Math.sin(angle);

    const minHorizontal =
        GAME.ballSpeed * 0.35;

    if(Math.abs(ball.dx) < minHorizontal){

        ball.dx =
            ball.dx < 0
            ? -minHorizontal
            : minHorizontal;

    }

    ball.dy =
        -GAME.ballSpeed * Math.cos(angle);

    playSfx("bounce");

    const currentSpeed =
        Math.sqrt(
            ball.dx * ball.dx +
            ball.dy * ball.dy
        );

    ball.dx =
        (ball.dx / currentSpeed)
        * GAME.ballSpeed;

    ball.dy =
        (ball.dy / currentSpeed)
        * GAME.ballSpeed;

}

    // colisión con ladrillos
    for(let i = 0; i < bricks.length; i++){

        const brick = bricks[i];

        if(!brick.alive){

            continue;

        }

        if(
            ball.x + ball.r > brick.x &&
            ball.x - ball.r < brick.x + brick.w &&
            ball.y + ball.r > brick.y &&
            ball.y - ball.r < brick.y + brick.h
        ){

            brick.alive = false;
            playSfx("bounce");

            GAME.score += 10;

            document.getElementById("score").textContent =
                GAME.score;

            ball.dy *= -1;

    const speed =
    Math.sqrt(
    ball.dx*ball.dx +
    ball.dy*ball.dy
    );

    ball.dx =
    (ball.dx/speed)
    *
    GAME.ballSpeed;

    ball.dy =
    (ball.dy/speed)
    *
    GAME.ballSpeed;

            break;
        }
    }

    // comprobar nivel completado
    let remainingBricks = 0;

for(const brick of bricks){

    if(brick.alive){

        remainingBricks++;

    }

}

    if(remainingBricks === 0){

        if(levelTransition){

            return;

        }

    levelTransition = true;

    GAME.paused = true;

    saveLocked = true;

    saveGame();

    document.getElementById(
        "countryUnlock"
    ).textContent =
    COUNTRIES[GAME.countryIndex].country;

    document.getElementById(
        "countryCodeUnlock"
    ).textContent =
    "Abreviatura: " +
    COUNTRIES[GAME.countryIndex].code;

    document.getElementById(
        "capitalUnlock"
    ).textContent =
    "Capital: " +
    COUNTRIES[GAME.countryIndex].capital;

    document.getElementById(
        "continentUnlock"
    ).textContent =
    "Continente: " +
    COUNTRIES[GAME.countryIndex].continent;

    document.getElementById(
    "countryProgress"
    ).textContent =
    "Nivel " +
    (GAME.countryIndex+1)
    +
    " de "
    +
    COUNTRIES.length;

    playSfx("levelup");

    vibrate(250);

    showScreen("levelComplete");

    return;

}

    // perder vida
    if(ball.y - ball.r > canvas.height){

    GAME.lives--;
    vibrate(200);

    updateLives();

    if(GAME.lives <= 0){

        gameOver();
        return;

    }

    resetBall();
    }

    render();

    if(session !== gameSession){

        return;

    }

    requestAnimationFrame(update);

}

function updateLives(){

    let hearts = "";

    for(let i = 0; i < GAME.lives; i++){

        hearts += "❤️";

    }

    document.getElementById("lives").textContent =
    hearts;

}

function updateTimer(){

    const minutes =
    Math.floor(GAME.time / 60);

    const seconds =
    GAME.time % 60;

    document.getElementById(
        "timer"
    ).textContent =

    String(minutes)
    .padStart(2,"0")

    + ":"

    +

    String(seconds)
    .padStart(2,"0");

}

function resetBall(){

    ball.x =
    canvas.width / 2;

    ball.y =
    canvas.height - 120;

    const angle =
    -Math.PI / 4;

    ball.dx =
    GAME.ballSpeed *
    Math.cos(angle);

    ball.dy =
    GAME.ballSpeed *
    Math.sin(angle);

}

function render(){

ctx.clearRect(
0,0,
canvas.width,
canvas.height
);

ctx.fillStyle=
ball.color;

ctx.beginPath();

ctx.arc(
ball.x,
ball.y,
ball.r,
0,
Math.PI*2
);

ctx.fill();

ctx.fillStyle="white";

ctx.fillRect(
paddle.x,
paddle.y,
paddle.width,
paddle.height
);

bricks.forEach((b)=>{

if(!b.alive){
    
    return;

}

ctx.drawImage(

flagImage,

b.col *
(flagImage.width / b.cols),

b.row *
(flagImage.height / b.rows),

flagImage.width /
b.cols,

flagImage.height /
b.rows,

b.x,
b.y,
b.w,
b.h

);

});

}

function nextLevel(){

    levelTransition = false;

    saveLocked = false;

    GAME.countryIndex++;

    if(
    !unlockedCountries.includes(
        GAME.countryIndex
    )
    ){
    unlockedCountries.push(
        GAME.countryIndex
    );

    localStorage.setItem(
        "brickflags-unlocked",
        JSON.stringify(
            unlockedCountries
        )
    );
    }

    if(GAME.countryIndex >= COUNTRIES.length){

        gameOver();
        return;
    }

    GAME.level++;

    GAME.ballSpeed = Math.min(GAME.ballSpeed + 0.10,7);

    GAME.paused = false;

    buildFlagLevel();

    resetBall();

    saveGame();

    showScreen("game");

    gameLoopRunning = false;

    update();
    
}

function saveGame(){

    if(saveLocked){

        return;

    }

    if(levelTransition){

        return;

    }

    if(GAME.finished){

        return;

    }

    const saveData = {

game: GAME,

lastTimeUpdate,

leftPressed,
rightPressed,

touchLeft,
touchRight,

anthemPosition:
currentAnthem
?
currentAnthem.currentTime
:
anthemPosition,

flag:
COUNTRIES[
GAME.countryIndex
].flag,

bricks,

paddle,

ball,

paused: GAME.paused,

transition: levelTransition,

};

    localStorage.setItem(
        "brickflags-save",
        JSON.stringify(saveData)
    );

    updateContinueButton();

}

function continueGame(){

    let save =
    localStorage.getItem(
    "brickflags-save"
    );

    if(!save){

        return;
    
    }
    
    let data =
    JSON.parse(save);

    if(data.game.finished){

    localStorage.removeItem(
        "brickflags-save"
    );

    updateContinueButton();

    return;
    }

    Object.assign(
        GAME,
        data.game
    );

    gameSession++;

    anthemPosition =
    data.anthemPosition || 0;

    lastTimeUpdate =
    data.lastTimeUpdate;

    leftPressed =
    data.leftPressed;

    rightPressed =
    data.rightPressed;

    touchLeft =
    data.touchLeft;

    touchRight =
    data.touchRight;

    flagImage =
    new Image();

    flagImage.src =
    data.flag;

    loadCurrentFlag();

    bricks =
    data.bricks;

    Object.assign(
        paddle,
        data.paddle
    );

    Object.assign(
        ball,
        data.ball
    );

    GAME.paused = false;
    updateLives();
    gameLoopRunning = false;

    flagImage.onload = ()=>{

    showScreen("game");

    if(G.musicOn){

        playAnthem(anthemPosition);

    }

    levelTransition = false;

    if(!gameLoopRunning){

        update();

    }

}

};

function updateContinueButton(){

    const btn =
    document.getElementById(
        "continueBtn"
    );

    const save =
    localStorage.getItem(
        "brickflags-save"
    );

    if(save){

        btn.classList.remove(
            "disabled"
        );

    }
    else{

        btn.classList.add(
            "disabled"
        );

    }

}

function newGame(){

    localStorage.removeItem(
        "brickflags-save"
    );

    updateContinueButton();

    GAME.level = 0;
    GAME.score = 0;
    GAME.time = 0;
    updateTimer();
    lastTimeUpdate =
    Date.now();
    GAME.lives = 3;
    GAME.countryIndex = 0;
    GAME.ballSpeed = 5;
    GAME.paused = false;
    GAME.finished = false;
    levelTransition = false;

    gameSession++;

    updateLives();

    document.getElementById("score").textContent = "0";

    paddle.x =
    (canvas.width - paddle.width) / 2;

    paddle.y = 680;

    leftPressed = false;
    rightPressed = false;

    touchLeft = false;
    touchRight = false;

    gameLoopRunning = false;

    bricks = [];

    buildFlagLevel();

    resetBall();

    showScreen("game");

    playAnthem();

    update();
}

function gameOver(){

    GAME.paused = true;

    playSfx("gameover");

    vibrate(600);

    gameLoopRunning = false;

    stopAnthem();

    localStorage.removeItem(
        "brickflags-save"
    );

    GAME.finished = true;

    updateContinueButton();

    showScreen(
        "gameOver"
    );

    document.getElementById(
    "finalScore"
).textContent =
"PUNTAJE: " + GAME.score;

document.getElementById(
    "playerName"
).value = "";

}

function showScreen(id){

document
.querySelectorAll(".screen")
.forEach(s=>
s.classList.remove("active")
);

document
.getElementById(id)
.classList.add("active");

}

document.addEventListener("keydown", (e)=>{

    if(e.key === "ArrowLeft"){
        leftPressed = true;
    }

    if(e.key === "ArrowRight"){
        rightPressed = true;
    }

});

document.addEventListener("keyup", (e)=>{

    if(e.key === "ArrowLeft"){
        leftPressed = false;
    }

    if(e.key === "ArrowRight"){
        rightPressed = false;
    }

});

function moveLeft(){

    touchLeft = true;

}

function moveRight(){

    touchRight = true;

}

function stopMove(){

    touchLeft = false;
    touchRight = false;

}

function openFlags(){

    stopAnthem();

    let list =
    document.getElementById(
        "flagList"
    );

    
    if(!list){

    console.error(
        "No existe flagList"
    );

    return;
}

list.innerHTML = "";

document.getElementById(
"flagProgress"
).textContent =

unlockedCountries.length +
" / " +
COUNTRIES.length +
" desbloqueadas";

    COUNTRIES.forEach(

    (country,index)=>{

        let unlocked =
        unlockedCountries.includes(
            index
        );

        let item =
        document.createElement(
            "button"
        );

        if(unlocked){

            item.innerHTML =

`
<img src="${country.flag}">

<div>

<strong>
${country.code}
</strong>

${country.country}

<br>

<small>
${country.capital}
</small>

</div>
`;

            item.onclick = ()=>{

                openCountryDetail(
                    index
                );

                selectedCountry = index;

            };

        }
        else{

            item.innerHTML =

`
<div class="locked">
🔒
${country.code}

</div>
`;

        }

        list.appendChild(
            item
        );

    });

    showScreen("flags");

}

function openCountryDetail(index){

    let country =
    COUNTRIES[index];

    document.getElementById(
        "detailFlag"
    ).src =
    country.flag;

    document.getElementById(
        "detailCountry"
    ).textContent =
    country.country;

    document.getElementById(
    "detailCode"
    ).textContent =
    "Abreviatura: " +
    country.code;

    document.getElementById(
        "detailCapital"
    ).textContent =
    "Capital: " +
    country.capital;

    document.getElementById(
        "detailContinent"
    ).textContent =
    "Continente: " +
    country.continent;

    selectedCountry = index;

stopAnthem();

    showScreen(
        "flagDetail"
    );

}

function backToFlags(){

    stopAnthem();

    openFlags();

}

function openInstructions(){

    showScreen("instructions");

}

function showMenu(){

    GAME.paused = true;

    pauseAnthem();

    if(
        document.getElementById("game")
        .classList.contains("active")
    ){
        saveGame();
    }

    updateContinueButton();

    showScreen("menu");

}

function pauseGame(){

    GAME.paused = true;

    pauseAnthem();

    document.getElementById(
        "pauseScreen"
    ).style.display = "flex";

}

function resumeGame(){

    GAME.paused = false;

    document.getElementById(
        "pauseScreen"
    ).style.display = "none";

    resumeAnthem();

    if(!gameLoopRunning){

    update();

}

}

function backToMenu(){

    GAME.paused = true;

    saveGame();

    document.getElementById(
        "pauseScreen"
    ).style.display = "none";

    showMenu();

}

function exitGame(){

    GAME.paused = true;

    saveLocked = true;

    saveGame();

    saveLocked = false;

    window.close();

}

let selectedCountry = null;

function playCountryAnthem(){

    if(selectedCountry === null){

        return;

    }

    if(!G.musicOn){

        return;

    }

    stopAnthem();

    currentAnthem =
    new Audio(
        COUNTRIES[
            selectedCountry
        ].anthem
    );

    currentAnthem.volume =
    G.musicVol;

    currentAnthem.play()
    .catch(()=>{});

}

function playSelectedCountry(){

    if(selectedCountry === null){
    
        return;
    
    }

    localStorage.removeItem(
        "brickflags-save"
    );

    GAME.level =
    selectedCountry;

    GAME.countryIndex =
    selectedCountry;

    GAME.score = 0;

    GAME.time = 0;
    updateTimer();

    lastTimeUpdate =
    Date.now();

    GAME.lives = 3;

    GAME.ballSpeed = Math.min(5 + (selectedCountry * 0.10),7);

    GAME.paused = false;

    GAME.finished = false;

    levelTransition = false;

    gameSession++;

    updateLives();

    document.getElementById(
        "score"
    ).textContent = "0";

    paddle.x =
    (canvas.width - paddle.width)/2;

    paddle.y = 680;

    leftPressed = false;
    rightPressed = false;

    touchLeft = false;
    touchRight = false;

    bricks = [];

    buildFlagLevel();

    resetBall();

    showScreen("game");

    playAnthem();

    gameLoopRunning = false;

    if(!gameLoopRunning){

    update();

}

}

function openScores(){

    const scores =

    JSON.parse(

        localStorage.getItem(
            "brickflags-scores"
        )

    ) || [];

    const ranking =

    document.getElementById(
        "ranking"
    );

    ranking.innerHTML = "";

    scores.forEach(

    (item,index)=>{

        let medal = "";

        if(index === 0){

            medal = "🥇";

        }
        else if(index === 1){

            medal = "🥈";

        }
        else if(index === 2){

            medal = "🥉";

        }

        const totalTime = item.time ?? 0;

        const minutes =

        Math.floor(totalTime / 60);

        const seconds =

        String(totalTime % 60).padStart(2,"0");

        ranking.innerHTML += `

<div class="scoreRow">

<div class="scorePos">

${medal} #${index+1}

</div>

<div class="scoreName">

${item.name}

</div>

<div class="scoreTime">

⏳ ${minutes}:${seconds}

</div>

<div class="scoreScore">

⭐ ${item.score}

</div>

</div>

`;

    });

    showScreen("scores");

}

function saveScore(){
    let playerName =
    document.getElementById(
        "playerName"
    ).value.trim();

    if(playerName === ""){

        playerName = "AAA";
    }
    let scores =
    JSON.parse(
        localStorage.getItem(
            "brickflags-scores"
        )
    ) || [];
    scores.push({
        name: playerName.toUpperCase(),
        score: GAME.score,
        time: GAME.time,
        level: GAME.level
    });
    scores.sort(
        (a,b)=>
        b.score - a.score
    );
    scores = scores.slice(0,10);
    localStorage.setItem(
        "brickflags-scores",
        JSON.stringify(scores)
    );
    openScores();
}

window.onload = ()=>{

    console.log(
        "GAME LOADED"
    );

    loadSettings();

    updateContinueButton();

    updateSettingsUI();

};

window.addEventListener(

"beforeunload",

()=>{

    if(

        GAME.paused &&
        !levelTransition &&
        !GAME.finished

    )
    
    if(

        document
        .getElementById("game")
        .classList.contains("active")

    ){

        saveGame();

    }

});

console.log(
"Funciones cargadas:",
typeof newGame,
typeof continueGame,
typeof openFlags,
typeof openInstructions,
typeof openScores
);

function loadCurrentFlag(){

    flagImage =
    new Image();

    flagImage.src =
    COUNTRIES[
        GAME.countryIndex
    ].flag;

}
