const DEFAULT_PROCUREMENT_WEEKS = 8;
const DEFAULT_IMPLEMENTATION_WEEKS = 12;

const demoData = [
    {
        supplier: "Example Cloud Ltd",
        service: "Platform rollout support",
        contractEnd: "2025-11-12",
        procurementWeeks: 8,
        implementationWeeks: 12
    },
    {
        supplier: "NorthStar Digital",
        service: "Migration planning",
        contractEnd: "2025-08-28",
        procurementWeeks: 6,
        implementationWeeks: 10
    },
    {
        supplier: "DataBridge Systems",
        service: "Security compliance",
        contractEnd: "2025-07-15",
        procurementWeeks: 8,
        implementationWeeks: 12
    }
];

const tableBody = document.getElementById("table-body");
const alertList = document.getElementById("alert-list");
const statusLine = document.getElementById("status-line");
const dataPill = document.getElementById("data-pill");
const apiForm = document.getElementById("api-form");
const caerphillyTextarea = document.getElementById("caerphilly-data");
const applyCaerphilly = document.getElementById("apply-caerphilly");

let cachedItems = [...demoData];
let cachedLabel = "Demo data";
let cachedStatus = "Loaded demo data.";
let caerphillyOverrides = new Map();

const formatDate = (value) => {
    if (!value) {
        return "Unknown";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "Unknown";
    }
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const weeksRemaining = (value) => {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    const diffMs = date.getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7));
};

const statusForWeeks = (bufferWeeks) => {
    if (bufferWeeks === null) {
        return { label: "Unknown", className: "neutral" };
    }
    if (bufferWeeks < 0) {
        return { label: "Overdue", className: "alert" };
    }
    if (bufferWeeks <= 4) {
        return { label: "Urgent", className: "alert" };
    }
    if (bufferWeeks <= 8) {
        return { label: "Review now", className: "warn" };
    }
    return { label: "On track", className: "ok" };
};

const formatWeeks = (value) => {
    if (value === null || value === undefined) {
        return "Unknown";
    }
    return `${value} wks`;
};

const computeBuffer = (weeksLeft, procurementWeeks, implementationWeeks) => {
    if (weeksLeft === null) {
        return null;
    }
    const total = (procurementWeeks ?? DEFAULT_PROCUREMENT_WEEKS) +
        (implementationWeeks ?? DEFAULT_IMPLEMENTATION_WEEKS);
    return weeksLeft - total;
};

const renderRows = (items) => {
    tableBody.innerHTML = "";
    items.forEach((item) => {
        const weeks = weeksRemaining(item.contractEnd);
        const buffer = computeBuffer(
            weeks,
            item.procurementWeeks,
            item.implementationWeeks
        );
        const status = statusForWeeks(buffer);
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `
            <div class="cell">${item.supplier || "Unknown"}</div>
            <div class="cell">${item.service || "Unknown"}</div>
            <div class="cell">${formatDate(item.contractEnd)}</div>
            <div class="cell">${formatWeeks(item.procurementWeeks ?? DEFAULT_PROCUREMENT_WEEKS)}</div>
            <div class="cell">${formatWeeks(item.implementationWeeks ?? DEFAULT_IMPLEMENTATION_WEEKS)}</div>
            <div class="cell">${buffer === null ? "Unknown" : `${buffer} wks`}</div>
            <div class="cell"><span class="status ${status.className}">${status.label}</span></div>
        `;
        tableBody.appendChild(row);
    });
};

const renderAlerts = (items) => {
    alertList.innerHTML = "";
    const urgent = items
        .map((item) => {
            const weeks = weeksRemaining(item.contractEnd);
            return {
                ...item,
                weeks,
                buffer: computeBuffer(
                    weeks,
                    item.procurementWeeks,
                    item.implementationWeeks
                )
            };
        })
        .filter((item) => item.weeks !== null)
        .sort((a, b) => (a.buffer ?? 0) - (b.buffer ?? 0))
        .slice(0, 3);

    if (!urgent.length) {
        alertList.innerHTML = "<li>No contract end dates available yet.</li>";
        return;
    }

    urgent.forEach((item) => {
        const totalLead = (item.procurementWeeks ?? DEFAULT_PROCUREMENT_WEEKS) +
            (item.implementationWeeks ?? DEFAULT_IMPLEMENTATION_WEEKS);
        const listItem = document.createElement("li");
        listItem.textContent = `${item.supplier} ends in ${item.weeks} weeks — lead time ${totalLead} weeks, buffer ${item.buffer} weeks.`;
        alertList.appendChild(listItem);
    });
};

const normalizeItems = (items, buyerFilter) => {
    const filtered = items.filter((item) => {
        if (!buyerFilter) {
            return true;
        }
        const buyer = item.buyer || item.buyerName || item.organisation || "";
        return buyer.toLowerCase().includes(buyerFilter.toLowerCase());
    });

    return filtered.map((item) => ({
        supplier: item.supplierName || item.supplier || item.supplier_name || "Unknown supplier",
        service: item.serviceName || item.service || item.serviceName || item.title || "Unknown service",
        contractEnd: item.contractEndDate || item.contract_end_date || item.contractEnd || item.endDate || null,
        procurementWeeks: item.procurementWeeks,
        implementationWeeks: item.implementationWeeks
    }));
};

const extractItems = (data) => {
    if (Array.isArray(data)) {
        return data;
    }
    if (Array.isArray(data.services)) {
        return data.services;
    }
    if (Array.isArray(data.results)) {
        return data.results;
    }
    if (Array.isArray(data.items)) {
        return data.items;
    }
    if (data.search_result && Array.isArray(data.search_result.services)) {
        return data.search_result.services;
    }
    return [];
};

const applyOverrides = (items) => items.map((item) => {
    const key = (item.supplier || "").toLowerCase();
    const override = caerphillyOverrides.get(key);
    if (!override) {
        return item;
    }
    return {
        ...item,
        contractEnd: override.contractEnd ?? item.contractEnd,
        procurementWeeks: override.procurementWeeks ?? item.procurementWeeks,
        implementationWeeks: override.implementationWeeks ?? item.implementationWeeks
    };
});

const loadData = (items, label, statusMessage) => {
    cachedItems = [...items];
    cachedLabel = label;
    cachedStatus = statusMessage;
    const withOverrides = applyOverrides(items);
    renderRows(withOverrides);
    renderAlerts(withOverrides);
    dataPill.textContent = label;
    statusLine.textContent = statusMessage;
};

const loadDemo = () => {
    loadData(demoData, "Demo data", "Loaded demo data.");
};

apiForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const apiUrl = document.getElementById("api-url").value.trim();
    const token = document.getElementById("api-token").value.trim();
    const buyerFilter = document.getElementById("buyer-filter").value.trim();

    if (!apiUrl) {
        loadDemo();
        return;
    }

    statusLine.textContent = "Loading API data...";

    try {
        const response = await fetch(apiUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const items = extractItems(data);
        const normalized = normalizeItems(items, buyerFilter);

        if (!normalized.length) {
            loadData(demoData, "Demo data", "No results found. Showing demo data.");
            return;
        }

        loadData(normalized, "Live data", "Loaded data from API.");
    } catch (error) {
        loadData(demoData, "Demo data", `API failed (${error.message}). Showing demo data.`);
    }
});

const parseCaerphillyData = (text) => {
    const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    const map = new Map();
    lines.forEach((line) => {
        const [supplier, contractEnd, procurementWeeks, implementationWeeks] = line
            .split(",")
            .map((value) => value.trim());
        if (!supplier) {
            return;
        }
        map.set(supplier.toLowerCase(), {
            supplier,
            contractEnd: contractEnd || null,
            procurementWeeks: procurementWeeks ? Number(procurementWeeks) : null,
            implementationWeeks: implementationWeeks ? Number(implementationWeeks) : null
        });
    });
    return map;
};

applyCaerphilly.addEventListener("click", () => {
    const text = caerphillyTextarea.value;
    caerphillyOverrides = parseCaerphillyData(text);
    loadData(cachedItems, cachedLabel, "Applied Caerphilly contract data.");
});

loadDemo();
