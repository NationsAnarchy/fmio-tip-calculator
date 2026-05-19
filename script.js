const form = document.getElementById("tip-form");
const billInput = document.getElementById("bill");
const peopleInput = document.getElementById("people");
const customTipInput = document.getElementById("custom-tip");
const tipButtons = document.querySelectorAll(".tip-grid button");

// Validation error elements
const billErrors = {
  empty: document.getElementById("bill-error-empty"),
  negative: document.getElementById("bill-error-negative"),
  invalid: document.getElementById("bill-error-invalid"),
};
const peopleErrors = {
  empty: document.getElementById("people-error-empty"),
  negative: document.getElementById("people-error-negative"),
  invalid: document.getElementById("people-error-invalid"),
};
const tipError = document.getElementById("tip-error");
const tipErrorMax = document.getElementById("tip-error-max");

const allBillErrors = Object.values(billErrors);
const allPeopleErrors = Object.values(peopleErrors);

const resetBtn = document.getElementById("reset-btn");

let selectedTip = null;
let hasCalculated = false;

// --- Reset button state ---

function setResetDisabled(disabled) {
  resetBtn.disabled = disabled;
}

// Disable reset on page load
setResetDisabled(true);

// Re-enable reset after successful calculation
function enableReset() {
  hasCalculated = true;
  setResetDisabled(false);
}

// Disable reset when results are stale (user modifies inputs after a calculation)
function disableResetOnChange() {
  if (hasCalculated) {
    hasCalculated = false;
    setResetDisabled(true);
  }
}

// --- Validation helpers ---

function clearErrors() {
  billInput.classList.remove("error");
  peopleInput.classList.remove("error");
  allBillErrors.forEach((el) => el.classList.remove("visible"));
  allPeopleErrors.forEach((el) => el.classList.remove("visible"));
  tipError.classList.remove("visible");
  tipErrorMax.classList.remove("visible");
}

function showError(input, errors, key) {
  input.classList.add("error");
  errors[key].classList.add("visible");
}

function validateField(value, errorSet) {
  // Empty string
  if (value.trim() === "") return "empty";
  // Non-numeric
  const num = parseFloat(value);
  if (isNaN(num)) return "invalid";
  // Negative
  if (num < 0) return "negative";
  // Zero
  if (num === 0) return "empty";
  // Valid
  return null;
}

// Strip non-numeric characters (allow digits, ., ,, and -)
// Normalizes , to . and keeps only the first decimal separator
function sanitizeNumeric(value) {
  let cleaned = value.replace(/[^0-9.,\-]/g, "");
  // Convert first comma to dot, remove any subsequent commas
  const parts = cleaned.split(",");
  if (parts.length > 1) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }
  // Keep only the first dot, remove any subsequent ones
  const dotParts = cleaned.split(".");
  if (dotParts.length > 2) {
    cleaned = dotParts[0] + "." + dotParts.slice(1).join("");
  }
  return cleaned;
}

// Clear errors while the user is typing
billInput.addEventListener("input", () => {
  billInput.value = sanitizeNumeric(billInput.value);
  billInput.classList.remove("error");
  allBillErrors.forEach((el) => el.classList.remove("visible"));
  disableResetOnChange();
});

peopleInput.addEventListener("input", () => {
  peopleInput.value = sanitizeNumeric(peopleInput.value);
  peopleInput.classList.remove("error");
  allPeopleErrors.forEach((el) => el.classList.remove("visible"));
  disableResetOnChange();
});

// Submit on Enter key pressed in any form input or tip button
form.addEventListener("keydown", (e) => {
  if (
    e.key === "Enter" &&
    (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON")
  ) {
    e.preventDefault();
    form.dispatchEvent(new Event("submit", { cancelable: true }));
  }
});

// --- Tip button selection ---
tipButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tipButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    customTipInput.value = "";
    selectedTip = parseFloat(button.textContent);
    disableResetOnChange();
  });
});

// --- Custom tip input ---
customTipInput.addEventListener("input", () => {
  customTipInput.value = sanitizeNumeric(customTipInput.value);
  tipButtons.forEach((btn) => btn.classList.remove("active"));
  selectedTip = null;
  disableResetOnChange();
});

// --- Form submission ---
form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors();

  const bill = parseFloat(billInput.value);
  const people = parseInt(peopleInput.value, 10);
  const customTip = parseFloat(customTipInput.value);
  const tipPercent = customTipInput.value ? customTip : selectedTip;

  let hasError = false;

  const billIssue = validateField(billInput.value, billErrors);
  if (billIssue) {
    showError(billInput, billErrors, billIssue);
    hasError = true;
  }

  const peopleIssue = validateField(peopleInput.value, peopleErrors);
  if (peopleIssue) {
    showError(peopleInput, peopleErrors, peopleIssue);
    hasError = true;
  }

  if (customTipInput.value && customTip > 100) {
    tipErrorMax.classList.add("visible");
    hasError = true;
  } else if (isNaN(tipPercent) || tipPercent < 0) {
    tipError.classList.add("visible");
    hasError = true;
  }

  if (hasError) return;

  // Calculations
  const tipAmountPerPerson = (bill * (tipPercent / 100)) / people;
  const totalPerPerson = (bill + bill * (tipPercent / 100)) / people;

  const tipAmountDisplay = document.getElementById("tip-amount");
  const totalDisplay = document.getElementById("total-amount");

  if (tipAmountDisplay && totalDisplay) {
    tipAmountDisplay.textContent = `$${tipAmountPerPerson.toFixed(2)}`;
    totalDisplay.textContent = `$${totalPerPerson.toFixed(2)}`;
    enableReset();
  }
});

// --- Reset handler ---
resetBtn.addEventListener("click", () => {
  // Reset form inputs to their initial values
  form.reset();
  // Reset results back to $0.00
  const tipAmountDisplay = document.getElementById("tip-amount");
  const totalDisplay = document.getElementById("total-amount");
  if (tipAmountDisplay && totalDisplay) {
    tipAmountDisplay.textContent = "$0.00";
    totalDisplay.textContent = "$0.00";
  }
  // Deselect any active tip button
  tipButtons.forEach((btn) => btn.classList.remove("active"));
  selectedTip = null;
  hasCalculated = false;
  setResetDisabled(true);
});
