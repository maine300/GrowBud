// static/calendar.js
const calendarContainer = document.getElementById("calendar");
const monthTitle = document.getElementById("month-title");
let currentDate = new Date();

function renderCalendar(tasks = {}) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    monthTitle.innerText = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

    calendarContainer.innerHTML = ""; // Clear old days

    let dayCounter = 1;
    for (let i = 0; i < 6; i++) {
        const row = document.createElement("tr");
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement("td");

            if ((i === 0 && j < firstDay) || dayCounter > daysInMonth) {
                cell.innerHTML = "";
            } else {
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayCounter).padStart(2, "0")}`;
                const task = tasks[dateStr] || "";

                const textarea = document.createElement("textarea");
                textarea.value = task;
                textarea.placeholder = "Add task";
                textarea.dataset.date = dateStr;
                textarea.addEventListener("change", saveTask);
                cell.appendChild(document.createElement("div")).innerText = dayCounter;
                cell.appendChild(textarea);
                dayCounter++;
            }
            row.appendChild(cell);
        }
        calendarContainer.appendChild(row);
    }
}

function saveTask(e) {
    const date = e.target.dataset.date;
    const action = e.target.value;
    const plantId = document.getElementById("calendar").dataset.plantId;

    fetch(`/api/calendar/${plantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, action })
    });
}

function changeMonth(offset) {
    currentDate.setMonth(currentDate.getMonth() + offset);
    loadCalendar();
}

function loadCalendar() {
    const plantId = document.getElementById("calendar").dataset.plantId;
    fetch(`/api/calendar/${plantId}`)
        .then(res => res.json())
        .then(data => renderCalendar(data));

        
}
