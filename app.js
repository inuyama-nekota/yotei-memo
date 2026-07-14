const STORAGE_KEY = "yotei-memo-items-v2-1";

const listEl = document.getElementById("scheduleList");
const emptyState = document.getElementById("emptyState");
const backdrop = document.getElementById("modalBackdrop");
const form = document.getElementById("scheduleForm");
const placeInput = document.getElementById("place");
const dateInput = document.getElementById("date");
const dateWeekday = document.getElementById("dateWeekday");
const hourSelect = document.getElementById("hour");
const minuteSelect = document.getElementById("minute");
const memoInput = document.getElementById("memo");
const toast = document.getElementById("toast");

let items = loadItems();

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toLocalDateValue(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function updateDateWeekday() {
  if (!dateInput.value) {
    dateWeekday.textContent = "";
    return;
  }

  const date = new Date(`${dateInput.value}T00:00:00`);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  dateWeekday.textContent = `（${weekdays[date.getDay()]}）`;
}

function setDefaultDateTime() {
  const now = new Date();
  const roundedMinutes = Math.ceil(now.getMinutes() / 5) * 5;
  if (roundedMinutes === 60) {
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
  } else {
    now.setMinutes(roundedMinutes);
  }

  dateInput.value = toLocalDateValue(now);
  updateDateWeekday();
  hourSelect.value = String(now.getHours());
  minuteSelect.value = String(now.getMinutes());
}

function buildTimeOptions() {
  hourSelect.innerHTML = "";
  minuteSelect.innerHTML = "";

  for (let hour = 0; hour < 24; hour += 1) {
    const option = document.createElement("option");
    option.value = String(hour);
    option.textContent = `${hour}`;
    hourSelect.append(option);
  }

  for (let minute = 0; minute < 60; minute += 5) {
    const option = document.createElement("option");
    option.value = String(minute);
    option.textContent = pad2(minute);
    minuteSelect.append(option);
  }
}

function loadItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (error) {
    console.warn("予定を端末に保存できませんでした。", error);
    return false;
  }
}

function itemTimestamp(item) {
  return new Date(`${item.date}T${pad2(item.hour)}:${pad2(item.minute)}:00`).getTime();
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function dayDiffFromToday(dateValue) {
  const target = new Date(`${dateValue}T00:00:00`);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - startOfToday().getTime();
  return Math.floor(diffMs / 86400000);
}

function getScheduleStatus(item) {
  if (itemTimestamp(item) < Date.now()) return "status-past";

  const diffDays = dayDiffFromToday(item.date);

  if (diffDays >= 0 && diffDays <= 3) return "status-near";
  if (diffDays >= 4 && diffDays <= 7) return "status-soon";
  return "status-future";
}

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
}

function formatTime(hour, minute) {
  return `${hour}時${pad2(minute)}分〜`;
}

function makeInfoBox(label, value, extraClass = "") {
  const div = document.createElement("div");
  div.className = `info-box ${extraClass}`.trim();

  if (label) {
    const labelSpan = document.createElement("span");
    labelSpan.className = "info-label";
    labelSpan.textContent = `${label}：`;
    div.append(labelSpan);
  }

  const valueSpan = document.createElement("span");
  valueSpan.textContent = value || "";
  div.append(valueSpan);

  return div;
}

function render() {
  listEl.innerHTML = "";

  items.sort((a, b) => {
    const aStatus = getScheduleStatus(a) === "status-past";
    const bStatus = getScheduleStatus(b) === "status-past";

    if (aStatus !== bStatus) {
      return aStatus ? 1 : -1;
    }

    if (aStatus && bStatus) {
      return itemTimestamp(b) - itemTimestamp(a);
    }

    return itemTimestamp(a) - itemTimestamp(b);
  });
  saveItems();

  emptyState.hidden = items.length > 0;

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = `schedule-card ${getScheduleStatus(item)}`.trim();

    const main = document.createElement("div");
    main.className = "schedule-main";

    const top = document.createElement("div");
    top.className = "schedule-top";

    const place = makeInfoBox("場所", item.place);
    const date = makeInfoBox("", formatDate(item.date));
    const time = makeInfoBox("", formatTime(item.hour, item.minute));
    top.append(place, date, time);

    const memo = makeInfoBox("メモ", item.memo, "memo");

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `${item.place}の予定を削除`);
    deleteButton.addEventListener("click", () => deleteItem(item.id));

    main.append(top, memo);
    card.append(main, deleteButton);
    listEl.append(card);
  });
}

function deleteItem(id) {
  const target = items.find((item) => item.id === id);
  if (!target) return;

  const ok = window.confirm(`「${target.place}」の予定を削除しますか？`);
  if (!ok) return;

  items = items.filter((item) => item.id !== id);
  saveItems();
  render();
  showToast("予定を削除しました");
}

function openModal() {
  form.reset();
  setDefaultDateTime();
  backdrop.hidden = false;
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  window.setTimeout(() => placeInput.focus(), 50);
}

function closeModal() {
  backdrop.hidden = true;
  backdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

document.getElementById("openCreate").addEventListener("click", openModal);
document.getElementById("cancelCreate").addEventListener("click", closeModal);
dateInput.addEventListener("change", updateDateWeekday);
dateInput.addEventListener("input", updateDateWeekday);

backdrop.addEventListener("click", (event) => {
  if (event.target === backdrop) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !backdrop.hidden) closeModal();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const item = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    place: placeInput.value.trim(),
    date: dateInput.value,
    hour: Number(hourSelect.value),
    minute: Number(minuteSelect.value),
    memo: memoInput.value.trim(),
    createdAt: Date.now()
  };

  items.push(item);
  saveItems();
  render();
  closeModal();
  showToast("予定を保存しました");
});

buildTimeOptions();
setDefaultDateTime();
render();

window.setInterval(render, 60_000);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) render();
});

window.addEventListener("pageshow", render);

const query = new URLSearchParams(location.search);
if (query.get("action") === "new") {
  window.setTimeout(openModal, 150);
}

const isWebServer = location.protocol === "http:" || location.protocol === "https:";

if (isWebServer && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("オフライン機能を開始できませんでした。", error);
    });
  });
}
