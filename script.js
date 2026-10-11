// PATHRAKSHAK demo: browser-only interactions, no real emergency dispatch.
const STORAGE_KEY = "pathrakshak-demo-reports-v1";

const sampleReports = [
  { id: "DEMO-103", title: "Vehicle collision", location: "Ring Road", time: "10:42 AM", priority: "High", support: "Medical support", icon: "⚑", type: "Road accident", people: "3 or more people", details: "Sample incident for demonstration.", sample: true },
  { id: "DEMO-102", title: "Vehicle breakdown", location: "North Avenue", time: "10:18 AM", priority: "Medium", support: "Roadside support", icon: "⌁", type: "Vehicle breakdown", people: "No known injuries", details: "Sample incident for demonstration.", sample: true },
  { id: "DEMO-101", title: "Road hazard", location: "Market Crossing", time: "09:55 AM", priority: "Low", support: "Traffic support", icon: "△", type: "Road hazard", people: "No known injuries", details: "Sample incident for demonstration.", sample: true }
];

const form = document.querySelector("#incidentForm");
const incidentList = document.querySelector("#incidentList");
const formMessage = document.querySelector("#formMessage");
const toast = document.querySelector("#toast");
let toastTimer;

function getSavedReports() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn("Saved demo reports could not be read.", error);
    return [];
  }
}

function saveReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    showToast("This browser could not save the demo report.");
  }
}

function getAllReports() {
  return [...getSavedReports(), ...sampleReports];
}

function estimatePriority(people, support) {
  // Simple transparent demo rule, not a medical or AI assessment.
  if (people === "4" || people === "3") return "High";
  if (people === "2" || support === "Medical" || support === "Police") return "Medium";
  return "Low";
}

function priorityClass(priority) {
  return `priority-${priority.toLowerCase()}`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function renderReports() {
  const reports = getAllReports();
  incidentList.innerHTML = reports.map(report => `
    <article class="incident-row">
      <span class="incident-symbol ${report.priority === "High" ? "orange-bg" : report.priority === "Medium" ? "blue-bg" : "green-bg"}">${report.icon || "⚑"}</span>
      <div class="incident-info">
        <strong>${escapeHTML(report.title)}</strong>
        <small>${escapeHTML(report.location)} · ${escapeHTML(report.time)}</small>
        <div class="incident-meta">
          <span class="priority ${priorityClass(report.priority)}">${escapeHTML(report.priority)} priority</span>
          <span>${escapeHTML(report.support)}</span>
        </div>
      </div>
      <span class="row-arrow" aria-hidden="true">↗</span>
    </article>`).join("");

  const highCount = reports.filter(report => report.priority === "High").length;
  const supportCount = reports.filter(report => report.support !== "Roadside support").length;
  document.querySelector("#totalReports").textContent = String(reports.length).padStart(2, "0");
  document.querySelector("#highReports").textContent = String(highCount).padStart(2, "0");
  document.querySelector("#supportReports").textContent = String(supportCount).padStart(2, "0");
  document.querySelector("#panelCount").textContent = `${reports.length} reports`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function showFormMessage(message, isError = false) {
  formMessage.hidden = false;
  formMessage.classList.toggle("error", isError);
  formMessage.textContent = message;
}

function scrollToReport() {
  document.querySelector("#report").scrollIntoView({ behavior: "smooth" });
  document.querySelector("#incidentType").focus({ preventScroll: true });
}

document.querySelectorAll("[data-scroll-report]").forEach(button => {
  button.addEventListener("click", scrollToReport);
});

document.querySelector("#menuToggle").addEventListener("click", () => {
  const nav = document.querySelector("#navLinks");
  const isOpen = nav.classList.toggle("open");
  document.querySelector("#menuToggle").setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll("#navLinks a").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelector("#navLinks").classList.remove("open");
    document.querySelector("#menuToggle").setAttribute("aria-expanded", "false");
  });
});

document.querySelector("#locateButton").addEventListener("click", () => {
  const locationInput = document.querySelector("#location");
  const locationHelp = document.querySelector("#locationHelp");

  if (!navigator.geolocation) {
    locationHelp.textContent = "Location is not available in this browser. Please type a landmark.";
    return;
  }

  locationHelp.textContent = "Waiting for browser location permission…";
  navigator.geolocation.getCurrentPosition(
    position => {
      const latitude = position.coords.latitude.toFixed(4);
      const longitude = position.coords.longitude.toFixed(4);
      locationInput.value = `Coordinates: ${latitude}, ${longitude}`;
      locationHelp.textContent = "Coordinates added in this browser. They are not sent to any service.";
    },
    () => {
      locationHelp.textContent = "Location permission was not granted. You can type a nearby landmark instead.";
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
  );
});

form.addEventListener("submit", event => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const type = formData.get("incidentType");
  const people = formData.get("severity");
  const supportValue = formData.get("support");
  const location = String(formData.get("location")).trim();
  const details = String(formData.get("details")).trim();

  if (!location || !details) {
    showFormMessage("Please complete the required fields.", true);
    return;
  }

  const priority = estimatePriority(people, supportValue);
  const supportLabels = {
    Medical: "Medical support",
    Police: "Traffic support",
    Roadside: "Roadside support",
    Unsure: "Support to be reviewed"
  };
  const report = {
    id: `DEMO-${Date.now()}`,
    title: type,
    type,
    location,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    priority,
    support: supportLabels[supportValue],
    icon: type === "Vehicle breakdown" ? "⌁" : type === "Road hazard" ? "△" : "⚑",
    people: document.querySelector("#severity").selectedOptions[0].textContent,
    details,
    sample: false
  };

  const reports = getSavedReports();
  reports.unshift(report);
  saveReports(reports);
  renderReports();
  form.reset();
  showFormMessage(`Demo report ${report.id} created. Estimated priority: ${priority}. It appears in the dashboard below. No emergency service was contacted.`);
  showToast("Demo report added to the dashboard.");
  document.querySelector("#dashboard").scrollIntoView({ behavior: "smooth" });
});

document.querySelector("#resetButton").addEventListener("click", () => {
  const shouldReset = window.confirm("Remove the demo reports created in this browser and restore the sample dashboard?");
  if (!shouldReset) return;
  localStorage.removeItem(STORAGE_KEY);
  renderReports();
  form.reset();
  formMessage.hidden = true;
  showToast("Demo dashboard reset.");
});

renderReports();
