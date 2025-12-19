let currentFilter = "All";

// ===============================
// Filter Functions
// ===============================
function setFilter(filter) {
    currentFilter = filter;
    applyFilter();
}

function applyFilter() {
    const items = document.querySelectorAll("#results li");
    items.forEach(li => {
        const status = li.dataset.status;
        if (currentFilter === "All" || status === currentFilter) {
            li.style.display = "";
        } else {
            li.style.display = "none";
        }
    });
}

// ===============================
// Counters
// ===============================
function updateCounters() {
    const items = document.querySelectorAll("#results li");
    let available = 0, taken = 0, unknown = 0;

    items.forEach(li => {
        const status = li.dataset.status;
        if (status === "Available") available++;
        else if (status === "Taken") taken++;
        else if (status === "Unknown") unknown++;
    });

    document.getElementById("availableCount").textContent = available;
    document.getElementById("takenCount").textContent = taken;
    document.getElementById("unknownCount").textContent = unknown;
}

// ===============================
// Check single name
// ===============================
async function checkName(name) {
    try {
        const res = await fetch(
            "https://hytale-backend.fly.dev/" + encodeURIComponent(name)
        );
        const data = await res.json();

        if (data.available === true) return "Available";
        if (data.available === false) return "Taken";
        return "Unknown";
    } catch {
        return "Unknown";
    }
}

// ===============================
// Main scanner with retry for Unknown
// ===============================
async function scanFromInput() {
    const raw = document.getElementById("nameInput").value;
    const list = document.getElementById("results");
    list.innerHTML = "";

    const WORDS = raw
        .split(/[\n,]+/)
        .map(w => w.trim())
        .filter(Boolean);

    for (const word of WORDS) {
        const li = document.createElement("li");
        li.textContent = `${word} — checking...`;
        list.appendChild(li);

        let result = await checkName(word);

        // Retry until result is not Unknown
        while (result === "Unknown") {
            li.textContent = `${word} — retrying...`;
            await new Promise(r => setTimeout(r, 1000)); // wait 1 sec before retry
            result = await checkName(word);
        }

        li.textContent = `${word} — ${result}`;
        li.dataset.status = result;
        li.style.color =
            result === "Available" ? "green" :
            result === "Taken" ? "red" : "orange";

        updateCounters();  // update counters live
        applyFilter();     // apply current filter

        await new Promise(r => setTimeout(r, 300)); // polite delay
    }
}
