let currentFilter = "All";

// ===============================
// Filters
// ===============================
function setFilter(filter) {
    currentFilter = filter;
    applyFilter();
}

function applyFilter() {
    document.querySelectorAll("#results li").forEach(li => {
        li.style.display =
            currentFilter === "All" || li.dataset.status === currentFilter
                ? ""
                : "none";
    });
}

// ===============================
// Counters
// ===============================
function updateCounters() {
    let available = 0, taken = 0, reserved = 0, hytale = 0;

    document.querySelectorAll("#results li").forEach(li => {
        const s = li.dataset.status;
        if (s === "Available") available++;
        else if (s === "Taken") taken++;
        else if (s === "Reserved") reserved++;
        else if (s === "ReservedByHytale") hytale++;
    });

    availableCount.textContent = available;
    takenCount.textContent = taken;
    reservedCount.textContent = reserved;
    hytaleCount.textContent = hytale;
}

// ===============================
// API Check
// ===============================
async function checkName(name) {
    try {
        const res = await fetch(
            `https://api.hytl.tools/check/${encodeURIComponent(name)}`
        );
        const data = await res.json();

        if (typeof data.status === "string") {
            const s = data.status.toLowerCase();
            if (s.includes("available")) return "Available";
            if (s.includes("reserved_hytale") || s.includes("hytale"))
                return "ReservedByHytale";
            if (s.includes("reserved")) return "Reserved";
            if (s.includes("taken")) return "Taken";
        }

        if (data.available === true) return "Available";
        if (data.available === false) return "Taken";
        if (data.reserved === true) return "Reserved";
        if (data.reservedByHytale === true) return "ReservedByHytale";

        return "Unknown";
    } catch {
        return "Unknown";
    }
}

// ===============================
// Scan Logic
// ===============================
async function scanFromInput() {
    const raw = nameInput.value;
    results.innerHTML = "";

    const names = raw
        .split(/[\n,]+/)
        .map(n => n.trim().replace(/\s+/g, "")) // remove all spaces
        .filter(Boolean);

    const validRegex = /^[a-z0-9_]{3,16}$/i; // a-z, 0-9, _ ; length 3-16

    for (const name of names) {
        const li = document.createElement("li");
        li.textContent = `${name} — checking...`;
        results.appendChild(li);

        let result;

        if (!validRegex.test(name)) {
            result = "Taken"; // invalid names are considered Taken
        } else {
            result = await checkName(name);

            // Retry until result is not Unknown
            while (result === "Unknown") {
                li.textContent = `${name} — retrying...`;
                await new Promise(r => setTimeout(r, 1000));
                result = await checkName(name);
            }
        }

        li.textContent = `${name} — ${result}`;
        li.dataset.status = result;

        li.style.color =
            result === "Available" ? "lime" :
            result === "Taken" ? "red" :
            result === "Reserved" ? "gold" :
            result === "ReservedByHytale" ? "#ff6b6b" :
            "orange";

        updateCounters();
        applyFilter();

        await new Promise(r => setTimeout(r, 300));
    }
}
