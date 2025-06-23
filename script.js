let xp = 0;
const xpDisplay = document.getElementById("xp-count");
const xpBar = document.getElementById("xp-bar");

const pauseBtn = document.getElementById("pause-btn");
const resumeBtn = document.getElementById("resume-btn");
const restartBtn = document.getElementById("restart-btn");
const bgMusic = document.getElementById("bg-music");

const ding = document.getElementById("ding");
const figure = document.getElementById("figure");
const fallingContainer = document.getElementById("falling-container");
let hasShield = false;
let fireTimeout = null;
let shieldTimeout = null;

let scrollSpeed = 10;
const viewportWidth = 1000;
const maxXP = 3000;
let groundLineY = figure.getBoundingClientRect().bottom - 50;

window.addEventListener("resize", () => {
  groundLineY = figure.getBoundingClientRect().bottom;
});

let position = 0;
let maxOffset = viewportWidth - figure.offsetWidth;
let lastDirection = null;

let gamePaused = false;
let fallingInterval;

const imageCategories = {
  general: { images: ["house.png", "phone.png", "moon.png"], xp: 60, path: "images/general/" },
  mnms: { images: ["red.png", "yellow.png", "blue.png"], xp: 30, path: "images/mnms/" },
  rare: { images: ["flowers.png", "bicycle.png"], xp: 200, path: "images/rare/" },
  evil: { images: ["gun.png", "halloween.png"], xp: -100, path: "images/evil/" },
  end: { images: ["eagle.png"], xp: "end", path: "images/end/" }
};

const weightedCategories = [
  ...Array(40).fill("general"),
  ...Array(35).fill("mnms"),
  ...Array(10).fill("rare"),
  ...Array(10).fill("evil"),
  ...Array(5).fill("end")
];

function initControls() {
  document.addEventListener("keydown", (e) => {
    if (gamePaused) return;
    if (e.key === "ArrowLeft") {
      if (lastDirection !== "left") {
        figure.classList.add("flip-horizontal");
        lastDirection = "left";
      }
      moveLeft();
    }
    if (e.key === "ArrowRight") {
      if (lastDirection !== "right") {
        figure.classList.remove("flip-horizontal");
        lastDirection = "right";
      }
      moveRight();
    }
  });

  pauseBtn.addEventListener("click", () => {
    gamePaused = true;
    bgMusic.pause();
  });

  resumeBtn.addEventListener("click", () => {
    gamePaused = false;
    bgMusic.play().catch((err) => console.warn("Music autoplay blocked:", err));
  });

  restartBtn.addEventListener("click", () => {
    window.location.reload();
  });
}

function moveLeft() {
  if (position > 0) {
    position -= scrollSpeed;
    if (position < 0) position = 0;
    updatePosition();
  }
}

function moveRight() {
  if (position < maxOffset) {
    position += scrollSpeed;
    if (position > maxOffset) position = maxOffset;
    updatePosition();
  }
}

const figureWrapper = document.getElementById("figure-wrapper");

function updatePosition() {
  figureWrapper.style.left = position + "px";
}

function moveToCenter() {
  const target = maxOffset / 2;
  const moveInterval = setInterval(() => {
    if (Math.abs(position - target) <= scrollSpeed) {
      position = target;
      updatePosition();
      clearInterval(moveInterval);
    } else {
      position += (position < target ? scrollSpeed : -scrollSpeed);
      updatePosition();
    }
  }, 20);
}

function fadeOutToWhite(element) {
  element.classList.add("fade");
  setTimeout(() => element.remove(), 4000);
}

function winnerBanner() {
  launchConfetti();
  setTimeout(() => {
    typeWriterEffect("(Be) Good! You got E.T. back home!", "winner-message", false, 80);
  }, 1000);
}

function typeWriterEffect(text, elementId, shouldBubble = false, speed = 100) {
  const container = document.getElementById(elementId);
  if (shouldBubble) bubble(container);
  container.innerHTML = "";
  container.style.opacity = 1;
  let index = 0;
  function type() {
    if (index < text.length) {
      container.innerHTML += text.charAt(index);
      index++;
      setTimeout(type, speed);
    } else if (shouldBubble) {
      container.style.opacity = 0;
      setTimeout(() => container.remove(), 1000);
    }
  }
  type();
}

function bubble(container) {
  const figureRect = figure.getBoundingClientRect();
  container.style.left = `${figureRect.left + window.scrollX + 50}px`;
  container.style.top = `${figureRect.top + window.scrollY - 60}px`;
}

function launchConfetti() {
  confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
}

function victory() {
  gamePaused = true;
  document.querySelectorAll('.falling-item').forEach(fadeOutItem);
  const dark = document.createElement("img");
  dark.src = "assets/dark-spaceship.png";
  dark.alt = "Dark Spaceship";
  dark.id = "dark-spaceship";
  document.body.appendChild(dark);
  requestAnimationFrame(() => dark.classList.add("enter"));
  setTimeout(() => {
    const light = document.createElement("img");
    light.src = "assets/light-spaceship.png";
    light.alt = "Light Spaceship";
    light.id = "reveal-img-clip";
    document.body.appendChild(light);
    requestAnimationFrame(() => light.classList.add("reveal"));
    setTimeout(() => {
      fadeOutToWhite(figure);
      setTimeout(() => {
        light.classList.remove("reveal");
        setTimeout(() => {
          dark.classList.remove("enter");
          winnerBanner();
        }, 2600);
      }, 2600);
    }, 2000);
  }, 2000);
  moveToCenter();
}

function spawnFallingItem() {
  const categoryKey = weightedCategories[Math.floor(Math.random() * weightedCategories.length)];
  const category = imageCategories[categoryKey];
  const imageName = category.images[Math.floor(Math.random() * category.images.length)];
  const xpValue = category.xp;
  const imagePath = category.path + imageName;
  const item = document.createElement("img");
  item.classList.add("falling-item");
  item.src = imagePath;
  item.alt = categoryKey;
  item.dataset.xp = xpValue;
  item.style.left = Math.random() * (1000 - 30) + "px";
  item.style.top = "0px";
  fallingContainer.appendChild(item);
  let topPos = 0;
  const fallSpeed = 2;
  const fallInterval = setInterval(() => {
    if (gamePaused) return;
    topPos += fallSpeed;
    item.style.top = topPos + "px";
    const itemRect = item.getBoundingClientRect();
    const figureRect = figure.getBoundingClientRect();
    if (
      itemRect.bottom >= figureRect.top &&
      itemRect.top <= figureRect.bottom &&
      itemRect.left <= figureRect.right &&
      itemRect.right >= figureRect.left
    ) {
      collectItem(item);
      clearInterval(fallInterval);
      return;
    }
    if (topPos >= groundLineY) {
      item.style.top = groundLineY + "px";
      clearInterval(fallInterval);
      item.classList.add("blinking-3x");
      setTimeout(() => item.remove(), 1000);
    }
  }, 20);
}

function fadeOutItem(item) {
  item.classList.add("fading");
  setTimeout(() => {
    if (item.parentNode) item.parentNode.removeChild(item);
  }, 500);
}

function collectItem(item) {
  fadeOutItem(item);
  let xpValue = item.dataset.xp;

  if (item.alt === "evil") {
    if (!hasShield) {
      onCatchEvilItem();
      xpValue = -100;
    } else {
      xpValue = 0; // Shield blocks evil item XP loss
    }
  }

  if (item.alt === "rare" && item.src.includes("bicycle.png")) {
    scrollSpeed = 30;
    const legFire = document.getElementById("leg-fire");
    legFire.style.display = "block";
    if (fireTimeout) clearTimeout(fireTimeout);
    fireTimeout = setTimeout(() => {
      scrollSpeed = 10;
      legFire.style.display = "none";
      fireTimeout = null;
    }, 10000);
  }

  if (item.alt === "rare" && item.src.includes("flowers.png")) {
    hasShield = true;
    figure.classList.add("shielded");
    if (shieldTimeout) clearTimeout(shieldTimeout);
    shieldTimeout = setTimeout(() => {
      hasShield = false;
      figure.classList.remove("shielded");
      shieldTimeout = null;
    }, 10000);
  }

  if (xpValue === "end") {
    if (hasShield) return;
    alert("E.T. was caught by the CIA! Game Over.");
    window.location.reload();
    return;
  }

  let xpChange = parseInt(xpValue, 10);
  if (hasShield) {
    if (xpChange < 0) {
      xpChange = 0;
    } else {
      xpChange *= 2;
    }
  }

  if (!isNaN(xpChange)) {
    xp = Math.min(maxXP, Math.max(0, xp + xpChange));
    xpDisplay.textContent = xp;
    const rocket = document.getElementById("rocket");
    const widthPercent = Math.min((xp / maxXP) * 100, 100);
    xpBar.style.width = widthPercent + "%";
    rocket.style.left = `calc(${widthPercent}% - 10px)`;
    if (xpChange > 0) {
      ding.currentTime = 0;
      ding.play();
      xpDisplay.classList.add("bump");
      setTimeout(() => xpDisplay.classList.remove("bump"), 300);
    }
    if (xp >= maxXP) {
      victory();
    }
  }
}

function onCatchEvilItem() {
  figure.src = 'assets/surprised-figure.png';
  const ouchBubble = document.getElementById("ouch-bubble");
  const figureRect = figure.getBoundingClientRect();
  ouchBubble.style.left = `${figureRect.left + window.scrollX + 50}px`;
  ouchBubble.style.top = `${figureRect.top + window.scrollY - 60}px`;
  ouchBubble.style.display = "block";
  setTimeout(() => {
    ouchBubble.style.display = "none";
    figure.src = 'assets/figure.png';
  }, 1000);
}

function startSpawning() {
  fallingInterval = setInterval(() => {
    if (!gamePaused && xp < maxXP) {
      spawnFallingItem();
    }
  }, 1500);
}

function main() {
  figure.src = "assets/figure.png";
  initControls();
  startSpawning();
}

typeWriterEffect("E.T. Phone Home! Fuel his way back home!", "text-bubble", true, 80);

setTimeout(main, 4000);

document.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play().catch((err) => console.warn("Autoplay prevented:", err));
  }
}, { once: true });
