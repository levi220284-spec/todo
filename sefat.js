document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('task-container');
    const addBtn = document.getElementById('add-btn');
    const saveAllBtn = document.getElementById('save-all-btn');
    const clockEl = document.getElementById('current-clock');

    // Key used to store tasks in the browser's localStorage.
    // Changing this string would make old saved tasks invisible
    // to the app, so leave it fixed once you're using it for real.
    const STORAGE_KEY = 'sefat_tasks';

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

    // 2. Build one task row (<li>) from a data object.
    // Used both when adding a fresh empty task and when
    // rebuilding saved tasks from localStorage on page load.
    function createTaskElement(data = { desc: '', date: '', time: '' }) {
        const li = document.createElement('li');
        li.className = 'list';
        li.innerHTML = `
            <textarea class="desc" placeholder="Type your text here...">${data.desc}</textarea>
            <div class="date-time-group">
                <input class="date" type="date" value="${data.date}">
                <input class="time" type="time" value="${data.time}">
                <span class="days-left"></span>
                <button type="button" class="delete-btn">Delete</button>
            </div>
        `;
        return li;
    }

    addBtn.addEventListener('click', () => {
        container.appendChild(createTaskElement());
        saveTasks();
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

        saveTasks();
    });

    // 5. Read every task row currently in the DOM into plain
    // data objects, so it can be turned into a string and stored.
    function getTasksFromDOM() {
        const rows = Array.from(container.querySelectorAll('.list'));
        return rows.map(row => ({
            desc: row.querySelector('.desc').value,
            date: row.querySelector('.date').value,
            time: row.querySelector('.time').value
        }));
    }

    // 6. Write the current tasks into localStorage as a JSON string.
    // localStorage only stores strings, so JSON.stringify converts
    // the array of task objects into one.
    function saveTasks() {
        const tasks = getTasksFromDOM();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    // 7. Read tasks back out of localStorage on page load.
    // JSON.parse turns the saved string back into a real array.
    // If nothing was ever saved, getItem returns null, so we
    // fall back to an empty array instead of crashing.
    function loadTasks() {
        const saved = localStorage.getItem(STORAGE_KEY);
        const tasks = saved ? JSON.parse(saved) : [];

        container.innerHTML = '';

        if (tasks.length === 0) {
            // Nothing saved yet, start with one blank task
            container.appendChild(createTaskElement());
            return;
        }

        tasks.forEach(taskData => {
            const li = createTaskElement(taskData);
            li.querySelector('.days-left').textContent =
                calculateDaysLeft(taskData.date);
            container.appendChild(li);
        });
    }

    // 8. Delete a task row. Uses event delegation: one listener on
    // the container instead of one per delete button, so newly
    // added rows work without needing their own listener attached.
    container.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            event.target.closest('.list').remove();
            saveTasks();
        }
    });

    // 9. Autosave whenever the user types in a description or
    // changes a date/time, so nothing is lost if they close the
    // app without pressing "Save & Organize".
    container.addEventListener('input', () => {
        saveTasks();
    });

    // 10. Register the service worker so the app shell (HTML, CSS,
    // JS, icons) is cached and can load with no internet connection.
    // Guarded with a feature check since older browsers/WebViews
    // may not support service workers at all.
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch((err) => {
                console.error('Service worker registration failed:', err);
            });
        });
    }

    // Load whatever was saved last, instead of always starting blank.
    loadTasks();
});
