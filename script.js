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

// Track which fields the user has interacted with
let billTouched = false;
let peopleTouched = false;
let tipTouched = false;

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

// --- Auto-calculation ---

function tryCalculate() {
  clearErrors();

  const billValue = billInput.value;
  const peopleValue = peopleInput.value;
  const customTipValue = customTipInput.value;
  const billNum = parseFloat(billValue);
  const peopleNum = parseInt(peopleValue, 10);
  const customTipNum = parseFloat(customTipValue);
  const tipPercent = customTipValue ? customTipNum : selectedTip;

  let hasError = false;

  // Validate bill
  if (billTouched) {
    const billIssue = validateField(billValue, billErrors);
    if (billIssue) {
      showError(billInput, billErrors, billIssue);
      hasError = true;
    }
  } else if (billValue.trim() !== "" && !isNaN(billNum) && billNum !== 0) {
    // Bill has content that appears valid but field not yet "touched" — no-op
  } else if (billValue.trim() !== "" && isNaN(billNum)) {
    // Bill has content but is invalid — treat as internal error
    hasError = true;
  }

  // Validate people
  if (peopleTouched) {
    const peopleIssue = validateField(peopleValue, peopleErrors);
    if (peopleIssue) {
      showError(peopleInput, peopleErrors, peopleIssue);
      hasError = true;
    }
  } else if (peopleValue.trim() !== "" && !isNaN(peopleNum) && peopleNum !== 0) {
    // People has content that appears valid — no-op
  } else if (peopleValue.trim() !== "" && isNaN(peopleNum)) {
    hasError = true;
  }

  // Validate tip
  if (tipTouched) {
    if (customTipValue && customTipNum > 100) {
      tipErrorMax.classList.add("visible");
      hasError = true;
    } else if (isNaN(tipPercent) || tipPercent < 0) {
      tipError.classList.add("visible");
      hasError = true;
    }
  } else if (customTipValue !== "" && customTipNum > 100) {
    hasError = true;
  } else if (customTipValue !== "" && isNaN(customTipNum)) {
    hasError = true;
  }

  if (hasError) {
    // Reset results if there are errors
    document.getElementById("tip-amount").textContent = "$0.00";
    document.getElementById("total-amount").textContent = "$0.00";
    setResetDisabled(true);
    hasCalculated = false;
    return;
  }

  // Only calculate if all three required values are present and valid
  if (!billValue.trim() || !peopleValue.trim()) return;
  if (billNum <= 0 || peopleNum <= 0) return;
  if (isNaN(tipPercent) || tipPercent < 0) return;

  // All valid — calculate
  const tipAmountPerPerson = (billNum * (tipPercent / 100)) / peopleNum;
  const totalPerPerson = (billNum + billNum * (tipPercent / 100)) / peopleNum;

  document.getElementById("tip-amount").textContent = `$${tipAmountPerPerson.toFixed(2)}`;
  document.getElementById("total-amount").textContent = `$${totalPerPerson.toFixed(2)}`;
  enableReset();
}

// --- Input event listeners ---

billInput.addEventListener("input", () => {
  billInput.value = sanitizeNumeric(billInput.value);
  billInput.classList.remove("error");
  allBillErrors.forEach((el) => el.classList.remove("visible"));
  disableResetOnChange();
  tryCalculate();
});

billInput.addEventListener("blur", () => {
  billTouched = true;
  tryCalculate();
});

peopleInput.addEventListener("input", () => {
  peopleInput.value = sanitizeNumeric(peopleInput.value);
  peopleInput.classList.remove("error");
  allPeopleErrors.forEach((el) => el.classList.remove("visible"));
  disableResetOnChange();
  tryCalculate();
});

peopleInput.addEventListener("blur", () => {
  peopleTouched = true;
  tryCalculate();
});

customTipInput.addEventListener("input", () => {
  customTipInput.value = sanitizeNumeric(customTipInput.value);
  tipButtons.forEach((btn) => btn.classList.remove("active"));
  selectedTip = null;
  disableResetOnChange();
  tryCalculate();
});

customTipInput.addEventListener("blur", () => {
  tipTouched = true;
  tryCalculate();
});

// --- Tip button selection ---
tipButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tipButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    customTipInput.value = "";
    selectedTip = parseFloat(button.textContent);
    tipTouched = true;
    disableResetOnChange();
    tryCalculate();
  });
});

// --- Form submission (fallback for enter key on form) ---
form.addEventListener("submit", (event) => {
  event.preventDefault();
  // Mark all fields as touched so errors show
  billTouched = true;
  peopleTouched = true;
  tipTouched = true;
  tryCalculate();
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
  billTouched = false;
  peopleTouched = false;
  tipTouched = false;
  setResetDisabled(true);
});