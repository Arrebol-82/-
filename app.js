// WARNING: This is a simple demo. Do NOT store highly sensitive real passwords here in real life.

const STORAGE_KEY = "account_list";
const STATUS_TIMEOUT = 2600;

let records = [];
let currentQuery = "";

let searchInput;
let suggestionsEl;
let detailPanel;
let addForm;
let softwareInput;
let accountInput;
let passwordInput;
let clearBtn;
let statusEl;
let exportBtn;
let importBtn;
let importFileInput;
let selectedRecordId = null;

// Reads saved records from localStorage into memory.
function loadRecordsFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    records = [];
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    records = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Could not parse stored data, starting fresh", err);
    records = [];
  }
}

// Writes the current records array back to localStorage.
function saveRecordsToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// Creates a new record and persists it.
function addRecord(software, account, password) {
  const now = Date.now();
  const newRecord = {
    id: now.toString(),
    software: software.trim(),
    account: account.trim(),
    password: password.trim(),
    createdAt: now,
  };

  records.push(newRecord);
  saveRecordsToStorage();
  setStatus("Added new record", "success");

  if (currentQuery && newRecord.software.toLowerCase().includes(currentQuery.toLowerCase())) {
    renderSuggestions(filterRecordsByQuery(currentQuery));
  }
}

// Removes a record by id and persists the change.
function deleteRecordById(id) {
  records = records.filter((item) => item.id !== id);
  saveRecordsToStorage();
}

// Returns records whose software name includes the query (case-insensitive).
function filterRecordsByQuery(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return records.filter((rec) => rec.software.toLowerCase().includes(q));
}

// Shows a short message in the status box.
function setStatus(message, type = "success") {
  statusEl.textContent = message;
  statusEl.className = `status show ${type}`;
  setTimeout(() => {
    statusEl.className = "status";
    statusEl.textContent = "";
  }, STATUS_TIMEOUT);
}

// Clears the suggestion dropdown.
function clearSuggestions() {
  suggestionsEl.innerHTML = "";
  suggestionsEl.classList.remove("show");
}

// Shows the default empty state in the detail panel.
function renderEmptyDetail(message = "Select a record from the suggestions to view details.") {
  detailPanel.innerHTML = "";
  const empty = document.createElement("p");
  empty.className = "muted";
  empty.textContent = message;
  detailPanel.appendChild(empty);
  selectedRecordId = null;
}

// Renders the suggestion dropdown based on a list of records.
function renderSuggestions(list) {
  suggestionsEl.innerHTML = "";

  if (!currentQuery) {
    suggestionsEl.classList.remove("show");
    return;
  }

  if (!list.length) {
    const empty = document.createElement("div");
    empty.className = "suggestion-item empty";
    empty.textContent = "No matches found";
    suggestionsEl.appendChild(empty);
    suggestionsEl.classList.add("show");
    return;
  }

  list.forEach((record) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.tabIndex = 0;

    const info = document.createElement("div");
    info.className = "suggest-info";

    const title = document.createElement("div");
    title.className = "suggest-title";
    title.textContent = record.software;

    const sub = document.createElement("div");
    sub.className = "suggest-sub";
    sub.textContent = record.account;

    info.append(title, sub);

    const actions = document.createElement("div");
    actions.className = "suggest-actions";

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      handleDeleteRecord(record.id);
    });

    actions.appendChild(delBtn);
    item.append(info, actions);
    item.addEventListener("click", () => showRecordDetail(record));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showRecordDetail(record);
      }
    });

    suggestionsEl.appendChild(item);
  });

  suggestionsEl.classList.add("show");
}

// Confirms and deletes a record, then refreshes UI pieces.
function handleDeleteRecord(id) {
  const target = records.find((item) => item.id === id);
  if (!target) return;
  const confirmed = window.confirm("Are you sure you want to delete this account?");
  if (!confirmed) return;

  deleteRecordById(id);
  setStatus("Deleted record", "success");

  if (selectedRecordId === id) {
    renderEmptyDetail();
  }

  if (currentQuery) {
    renderSuggestions(filterRecordsByQuery(currentQuery));
  } else {
    clearSuggestions();
  }
}

// Creates a detail card for the selected record.
function showRecordDetail(record) {
  selectedRecordId = record.id;
  detailPanel.innerHTML = "";

  const card = document.createElement("div");
  card.className = "detail-card";

  const title = document.createElement("h3");
  title.textContent = record.software;

  const grid = document.createElement("div");
  grid.className = "detail-grid";

  addDetailRow(grid, "Software", record.software);
  addDetailRow(grid, "Account", record.account);
  addDetailRow(grid, "Password", record.password);
  addDetailRow(grid, "Added", new Date(record.createdAt).toLocaleString());

  const actions = document.createElement("div");
  actions.className = "copy-actions";

  const copyAccount = document.createElement("button");
  copyAccount.type = "button";
  copyAccount.className = "btn ghost";
  copyAccount.textContent = "Copy account";
  copyAccount.addEventListener("click", () => copyText(record.account, "Account copied"));

  const copyPassword = document.createElement("button");
  copyPassword.type = "button";
  copyPassword.className = "btn primary";
  copyPassword.textContent = "Copy password";
  copyPassword.addEventListener("click", () => copyText(record.password, "Password copied"));

  actions.append(copyAccount, copyPassword);
  card.append(title, grid, actions);
  detailPanel.appendChild(card);
}

// Helper to add a labeled row to the detail grid.
function addDetailRow(grid, label, value) {
  const labelEl = document.createElement("div");
  labelEl.className = "label";
  labelEl.textContent = label;

  const valueEl = document.createElement("div");
  valueEl.textContent = value;

  grid.append(labelEl, valueEl);
}

// Copies text to the clipboard with a basic fallback.
function copyText(text, successMessage) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => setStatus(successMessage, "success"))
      .catch(() => fallbackCopy(text, successMessage));
    return;
  }

  fallbackCopy(text, successMessage);
}

function fallbackCopy(text, successMessage) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    setStatus(successMessage, "success");
  } catch (err) {
    console.error("Copy failed", err);
    setStatus("Unable to copy", "error");
  } finally {
    document.body.removeChild(textarea);
  }
}

// Triggers a download containing all records as a JSON file.
function exportRecords() {
  const json = JSON.stringify(records, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "accounts-backup.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setStatus("Exported data to JSON", "success");
}

// Reads a chosen JSON file, validates, replaces records, and updates UI.
function importRecordsFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = reader.result;
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        alert("Import failed: JSON must be an array");
        return;
      }

      const sanitized = data
        .filter((item) => item && typeof item === "object")
        .map((item, idx) => ({
          id: item.id ? String(item.id) : `${Date.now()}-${idx}`,
          software: item.software ? String(item.software).trim() : "",
          account: item.account ? String(item.account).trim() : "",
          password: item.password ? String(item.password).trim() : "",
          createdAt: Number(item.createdAt) || Date.now(),
        }))
        .filter((item) => item.software && item.account && item.password);

      if (!sanitized.length) {
        alert("Import failed: no valid records found");
        return;
      }

      records = sanitized;
      saveRecordsToStorage();
      searchInput.value = "";
      currentQuery = "";
      clearSuggestions();
      renderEmptyDetail("Imported data. Select a record to view it.");
      setStatus("Import successful", "success");
    } catch (err) {
      console.error(err);
      alert("Import failed: " + err.message);
    }
  };

  reader.readAsText(file, "utf-8");
}

// Handles typing in the search box.
function handleSearchInputChange() {
  currentQuery = searchInput.value.trim();

  if (!currentQuery) {
    clearSuggestions();
    return;
  }

  const matches = filterRecordsByQuery(currentQuery);
  renderSuggestions(matches);
}

// Validates and inserts a new record from the form fields.
function handleFormSubmit(event) {
  event.preventDefault();

  const software = softwareInput.value.trim();
  const account = accountInput.value.trim();
  const password = passwordInput.value.trim();

  if (!software || !account || !password) {
    setStatus("Please fill in all fields", "error");
    return;
  }

  addRecord(software, account, password);
  addForm.reset();
  softwareInput.focus();
}

function handleClearForm() {
  addForm.reset();
  softwareInput.focus();
}

document.addEventListener("DOMContentLoaded", () => {
  // Cache DOM references.
  searchInput = document.getElementById("searchInput");
  suggestionsEl = document.getElementById("suggestions");
  detailPanel = document.getElementById("detailPanel");
  addForm = document.getElementById("addForm");
  softwareInput = document.getElementById("softwareInput");
  accountInput = document.getElementById("accountInput");
  passwordInput = document.getElementById("passwordInput");
  clearBtn = document.getElementById("clearBtn");
  statusEl = document.getElementById("status");
  exportBtn = document.getElementById("exportBtn");
  importBtn = document.getElementById("importBtn");
  importFileInput = document.getElementById("importFile");

  loadRecordsFromStorage();

  renderEmptyDetail();
  searchInput.addEventListener("input", handleSearchInputChange);
  addForm.addEventListener("submit", handleFormSubmit);
  clearBtn.addEventListener("click", handleClearForm);
  exportBtn.addEventListener("click", exportRecords);
  importBtn.addEventListener("click", () => importFileInput.click());
  importFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      importRecordsFromFile(file);
    }
    // Allow re-selecting the same file later.
    event.target.value = "";
  });
});
