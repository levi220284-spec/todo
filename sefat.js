document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('task-container');
    const addBtn = document.getElementById('add-btn');
    const saveAllBtn = document.getElementById('save-all-btn');
    const clockEl = document.getElementById('current-clock');

    // 1. Live Date and Time Display at the Top
    function updateClock() {
        const now = new Date();
        const dateStr = now.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const timeStr = now.toLocaleTimeString();
        clockEl.textContent = `Current Date & Time: ${dateStr} | ${timeStr}`;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // 2. Add New Task Box Dynamically
    addBtn.addEventListener('click', () => {
        const li = document.createElement('li');
        li.className = 'list';
        li.innerHTML = `
            <textarea class="desc" placeholder="Type your text here..."></textarea>
            <div class="date-time-group">
                <input class="date" type="date">
                <input class="time" type="time">
                <span class="days-left"></span>
            </div>
        `;
        container.appendChild(li);
    });

    // 3. Calculate Days Left Relative to Today
    function calculateDaysLeft(targetDateStr) {
        if (!targetDateStr) return '';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [year, month, day] = targetDateStr.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day);

        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            return `(${diffDays} days left)`;
        } else if (diffDays === 1) {
            return `(1 day left)`;
        } else if (diffDays === 0) {
            return `(Due today)`;
        } else {
            return `(${Math.abs(diffDays)} days overdue)`;
        }
    }

    // 4. Save & Organize Tasks Chronologically
    saveAllBtn.addEventListener('click', () => {
        const rows = Array.from(container.querySelectorAll('.list'));

        // Update the (days left) text for each row
        rows.forEach(row => {
            const dateInput = row.querySelector('.date').value;
            const daysLeftSpan = row.querySelector('.days-left');
            daysLeftSpan.textContent = calculateDaysLeft(dateInput);
        });

        // Sort rows by Date & Time (Nearest / Most recent task at top)
        rows.sort((a, b) => {
            const dateA = a.querySelector('.date').value;
            const timeA = a.querySelector('.time').value || '00:00';
            const dateB = b.querySelector('.date').value;
            const timeB = b.querySelector('.time').value || '00:00';

            // Push empty dates to the bottom
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;

            const dateTimeA = new Date(`${dateA}T${timeA}`);
            const dateTimeB = new Date(`${dateB}T${timeB}`);

            return dateTimeA - dateTimeB;
        });

        // Re-append sorted elements back into container
        rows.forEach(row => container.appendChild(row));
    });
});