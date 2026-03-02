/**
 * Ämtchen Slot Machine - Application Logic
 * =========================================
 * Modularer JavaScript-Code für die Ämtchen-Zuweisung
 * 
 * Features:
 * - Automatische und manuelle Aufgabenzuweisung
 * - Wiederholungsvermeidung (nicht dasselbe Amt wie letzten Monat)
 * - History-Speicherung in LocalStorage
 * - PDF-Export
 * - Board-Ansicht
 */

// ============================================
// Konfiguration & Konstanten
// ============================================

/**
 * Aufgabendefinitionen mit Anzahl benötigter Personen
 * Jedes Objekt enthält:
 * - id: Eindeutige Kennung
 * - name: Anzeigename
 * - count: Anzahl Personen für diese Aufgabe
 * - icon: Material Icon Name
 */
const TASKS = [
    { id: 'chefkoch', name: 'Chefkoch / Köchin', count: 2, icon: 'restaurant' },
    { id: 'kueche', name: 'Küche Ordnung und Pausenraum', count: 1, icon: 'kitchen' },
    { id: 'recycling', name: 'Recycling (Dosen, PET, Glas, Kapseln)', count: 2, icon: 'recycling' },
    { id: 'karton', name: 'Karton', count: 1, icon: 'inventory_2' },
    { id: 'frigor', name: 'Chef de Frigor', count: 1, icon: 'ac_unit' },
    { id: 'abfall', name: 'Abfall bereit stellen', count: 1, icon: 'delete' },
    { id: 'getraenke', name: 'Getränke & Frigor auffüllen', count: 2, icon: 'local_drink' },
    { id: 'frei', name: 'Frei', count: 1, icon: 'sentiment_satisfied' }
];

/**
 * Standard-Mitarbeiterliste mit Anwesenheitsplan
 */
const DEFAULT_EMPLOYEES = [
    { name: 'Zeno', schedule: { mo: true, di: true, mi: true, do: true, fr: true } },
    { name: 'Stef', schedule: { mo: true, di: true, mi: true, do: true, fr: true } },
    { name: 'Arlinda', schedule: { mo: true, di: true, mi: true, do: true, fr: true } },
    { name: 'Ali', schedule: { mo: true, di: true, mi: true, do: true, fr: true } },
    { name: 'Chris', schedule: { mo: true, di: true, mi: true, do: true, fr: true } },
    { name: 'Chrigi', schedule: { mo: true, di: true, mi: true, do: true, fr: false } },
    { name: 'Elena', schedule: { mo: true, di: true, mi: true, do: true, fr: true } },
    { name: 'Meli', schedule: { mo: true, di: true, mi: true, do: true, fr: true } },
    { name: 'Barbara', schedule: { mo: true, di: true, mi: true, do: true, fr: true } },
    { name: 'Daniela', schedule: { mo: false, di: true, mi: false, do: true, fr: true } },
    { name: 'Michelle', schedule: { mo: true, di: true, mi: true, do: true, fr: true } }
];

// LocalStorage Keys
const STORAGE_KEYS = {
    PREVIOUS_ASSIGNMENTS: 'amtchen_previousAssignments',
    HISTORY: 'amtchen_history',
    CURRENT_ASSIGNMENTS: 'amtchen_currentAssignments',
    CURRENT_MONTH: 'amtchen_currentMonth'
};

// ============================================
// Utility Functions
// ============================================

/**
 * Fisher-Yates Shuffle - Mischt ein Array zufällig
 * @param {Array} array - Das zu mischende Array
 * @returns {Array} - Das gemischte Array
 */
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Formatiert ein Datum für die Anzeige
 * @param {Date} date - Das zu formatierende Datum
 * @returns {string} - Formatiertes Datum (z.B. "15.03.2025, 14:30")
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

/**
 * Formatiert nur das Datum ohne Zeit
 * @param {Date} date - Das zu formatierende Datum
 * @returns {string} - Formatiertes Datum (z.B. "15.03.2025")
 */
function formatDateShort(date) {
    return new Intl.DateTimeFormat('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

// ============================================
// Storage Manager Class
// ============================================

/**
 * Verwaltet alle LocalStorage-Operationen
 */
class StorageManager {
    /**
     * Speichert Daten im LocalStorage
     * @param {string} key - Schlüssel
     * @param {*} data - Zu speichernde Daten
     */
    static save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Fehler beim Speichern:', e);
        }
    }

    /**
     * Lädt Daten aus dem LocalStorage
     * @param {string} key - Schlüssel
     * @param {*} defaultValue - Standardwert falls nicht vorhanden
     * @returns {*} - Geladene Daten oder Standardwert
     */
    static load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Fehler beim Laden:', e);
            return defaultValue;
        }
    }

    /**
     * Löscht einen Eintrag aus dem LocalStorage
     * @param {string} key - Schlüssel
     */
    static remove(key) {
        localStorage.removeItem(key);
    }

    // Spezifische Methoden für die App
    
    static getPreviousAssignments() {
        return this.load(STORAGE_KEYS.PREVIOUS_ASSIGNMENTS, {});
    }

    static savePreviousAssignments(assignments) {
        this.save(STORAGE_KEYS.PREVIOUS_ASSIGNMENTS, assignments);
    }

    static getHistory() {
        return this.load(STORAGE_KEYS.HISTORY, []);
    }

    static saveHistory(history) {
        this.save(STORAGE_KEYS.HISTORY, history);
    }

    static addToHistory(entry) {
        const history = this.getHistory();
        history.unshift(entry); // Neueste zuerst
        this.saveHistory(history);
    }

    static clearHistory() {
        this.save(STORAGE_KEYS.HISTORY, []);
    }

    static getCurrentAssignments() {
        return this.load(STORAGE_KEYS.CURRENT_ASSIGNMENTS, []);
    }

    static saveCurrentAssignments(assignments) {
        this.save(STORAGE_KEYS.CURRENT_ASSIGNMENTS, assignments);
    }

    static getCurrentMonth() {
        return this.load(STORAGE_KEYS.CURRENT_MONTH, '');
    }

    static saveCurrentMonth(month) {
        this.save(STORAGE_KEYS.CURRENT_MONTH, month);
    }
}

// ============================================
// Assignment Engine Class
// ============================================

/**
 * Haupt-Engine für die Aufgabenzuweisung
 * Implementiert intelligente Zuweisung mit Wiederholungsvermeidung
 */
class AssignmentEngine {
    constructor() {
        this.employees = this.loadEmployees();
        this.previousAssignments = StorageManager.getPreviousAssignments();
    }

    /**
     * Lädt die Mitarbeiterliste (erweitert mit Ferien-Flag)
     * @returns {Array} - Mitarbeiterliste
     */
    loadEmployees() {
        return DEFAULT_EMPLOYEES.map(emp => ({
            ...emp,
            ferien: false,
            manualTask: null
        }));
    }

    /**
     * Aktualisiert die Mitarbeiterdaten aus der UI
     */
    updateFromUI() {
        this.employees.forEach(emp => {
            // Anwesenheit aktualisieren
            emp.schedule = {
                mo: document.getElementById(`${emp.name}-mo`)?.checked ?? true,
                di: document.getElementById(`${emp.name}-di`)?.checked ?? true,
                mi: document.getElementById(`${emp.name}-mi`)?.checked ?? true,
                do: document.getElementById(`${emp.name}-do`)?.checked ?? true,
                fr: document.getElementById(`${emp.name}-fr`)?.checked ?? true
            };
            // Ferien-Status
            emp.ferien = document.getElementById(`${emp.name}-ferien`)?.checked ?? false;
            // Manuelle Zuweisung
            const taskSelect = document.getElementById(`${emp.name}-task`);
            emp.manualTask = taskSelect?.value !== 'random' ? taskSelect?.value : null;
        });
    }

    /**
     * Erstellt eine Liste aller zu vergebenden Aufgaben-Slots
     * @returns {Array} - Array mit Task-IDs (ein Eintrag pro Slot)
     */
    buildTaskSlots() {
        const slots = [];
        TASKS.forEach(task => {
            for (let i = 0; i < task.count; i++) {
                slots.push(task.id);
            }
        });
        return slots;
    }

    /**
     * Findet den vollständigen Task anhand der ID
     * @param {string} id - Task-ID
     * @returns {Object} - Task-Objekt
     */
    getTaskById(id) {
        return TASKS.find(t => t.id === id) || TASKS.find(t => t.id === 'frei');
    }

    /**
     * Hauptmethode für die Aufgabenzuweisung
     * @returns {Array} - Array mit {name, task, taskId, icon} Objekten
     */
    assignTasks() {
        const result = [];
        const availableSlots = this.buildTaskSlots();
        const assignedTasks = new Map(); // Zählt wie oft jede Aufgabe vergeben wurde

        // Phase 1: Manuelle Zuweisungen verarbeiten
        const manualEmployees = this.employees.filter(emp => emp.manualTask && !emp.ferien);
        const randomEmployees = shuffle(this.employees.filter(emp => !emp.manualTask && !emp.ferien));
        const ferienEmployees = this.employees.filter(emp => emp.ferien);

        // Manuelle Zuweisungen zuerst
        manualEmployees.forEach(emp => {
            const task = this.getTaskById(emp.manualTask);
            const currentCount = assignedTasks.get(emp.manualTask) || 0;
            
            if (currentCount < task.count) {
                result.push({
                    name: emp.name,
                    task: task.name,
                    taskId: task.id,
                    icon: task.icon
                });
                assignedTasks.set(emp.manualTask, currentCount + 1);
                
                // Slot entfernen
                const slotIndex = availableSlots.indexOf(emp.manualTask);
                if (slotIndex > -1) availableSlots.splice(slotIndex, 1);
            } else {
                // Aufgabe bereits vollständig vergeben - zur Random-Liste hinzufügen
                randomEmployees.push(emp);
            }
        });

        // Phase 2: Zufällige Zuweisung für verbleibende Mitarbeiter
        const shuffledSlots = shuffle(availableSlots);
        let slotIndex = 0;

        randomEmployees.forEach(emp => {
            if (slotIndex < shuffledSlots.length) {
                // Versuche eine Aufgabe zu finden, die der Mitarbeiter letzten Monat nicht hatte
                let assignedSlot = null;
                const prevTask = this.previousAssignments[emp.name];

                // Zuerst: Versuche eine andere Aufgabe als letztes Mal zu finden
                for (let i = slotIndex; i < shuffledSlots.length; i++) {
                    if (shuffledSlots[i] !== prevTask) {
                        assignedSlot = shuffledSlots[i];
                        shuffledSlots.splice(i, 1);
                        break;
                    }
                }

                // Fallback: Nimm die nächste verfügbare Aufgabe
                if (!assignedSlot && shuffledSlots.length > slotIndex) {
                    assignedSlot = shuffledSlots[slotIndex];
                    shuffledSlots.splice(slotIndex, 1);
                }

                if (assignedSlot) {
                    const task = this.getTaskById(assignedSlot);
                    result.push({
                        name: emp.name,
                        task: task.name,
                        taskId: task.id,
                        icon: task.icon
                    });
                }
            } else {
                // Keine Aufgaben mehr - FREI zuweisen
                const freiTask = this.getTaskById('frei');
                result.push({
                    name: emp.name,
                    task: freiTask.name,
                    taskId: 'frei',
                    icon: freiTask.icon
                });
            }
        });

        // Phase 3: Mitarbeiter in Ferien bekommen FREI
        ferienEmployees.forEach(emp => {
            const freiTask = this.getTaskById('frei');
            result.push({
                name: emp.name,
                task: freiTask.name + ' (Ferien)',
                taskId: 'frei',
                icon: freiTask.icon
            });
        });

        // Previous Assignments aktualisieren
        result.forEach(item => {
            this.previousAssignments[item.name] = item.taskId;
        });
        StorageManager.savePreviousAssignments(this.previousAssignments);

        return result;
    }
}

// ============================================
// UI Controller Class
// ============================================

/**
 * Verwaltet alle UI-Interaktionen
 */
class UIController {
    constructor() {
        this.engine = new AssignmentEngine();
        this.currentAssignments = [];
        this.currentMonth = '';
    }

    /**
     * Initialisiert die Hauptseite
     */
    init() {
        this.renderEmployeeSettings();
        this.bindEvents();
        this.setDefaultMonth();
    }

    /**
     * Setzt den Standard-Monat auf den aktuellen/nächsten Monat
     */
    setDefaultMonth() {
        const now = new Date();
        const monthNames = [
            'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
            'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
        ];
        const monthInput = document.getElementById('month-name');
        if (monthInput) {
            monthInput.value = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        }
    }

    /**
     * Erstellt die Dropdown-Optionen für die Aufgabenauswahl
     * @returns {string} - HTML-String mit Options
     */
    buildTaskOptions() {
        let options = '<option value="random">🎲 Zufall</option>';
        TASKS.forEach(task => {
            const emoji = task.id === 'chefkoch' ? ' ⭐' : '';
            options += `<option value="${task.id}">${task.name}${emoji}</option>`;
        });
        return options;
    }

    /**
     * Rendert die Mitarbeiter-Einstellungen
     */
    renderEmployeeSettings() {
        const container = document.getElementById('employee-settings');
        if (!container) return;

        const taskOptions = this.buildTaskOptions();
        
        container.innerHTML = this.engine.employees.map(emp => `
            <div class="employee-row">
                <div class="employee-name">${emp.name}</div>
                <div class="employee-schedule checkbox-group">
                    <label class="checkbox-item">
                        <input type="checkbox" id="${emp.name}-mo" ${emp.schedule.mo ? 'checked' : ''}>
                        <span>Mo</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" id="${emp.name}-di" ${emp.schedule.di ? 'checked' : ''}>
                        <span>Di</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" id="${emp.name}-mi" ${emp.schedule.mi ? 'checked' : ''}>
                        <span>Mi</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" id="${emp.name}-do" ${emp.schedule.do ? 'checked' : ''}>
                        <span>Do</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" id="${emp.name}-fr" ${emp.schedule.fr ? 'checked' : ''}>
                        <span>Fr</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" id="${emp.name}-ferien">
                        <span>🏖️</span>
                    </label>
                </div>
                <div class="employee-task">
                    <select id="${emp.name}-task">
                        ${taskOptions}
                    </select>
                </div>
            </div>
        `).join('');
    }

    /**
     * Rendert die Zuweisungsergebnisse
     */
    renderAssignments() {
        const container = document.getElementById('assignments');
        if (!container) return;

        // Gruppiere nach Aufgaben für bessere Übersicht
        const grouped = new Map();
        this.currentAssignments.forEach(item => {
            if (!grouped.has(item.task)) {
                grouped.set(item.task, { ...item, names: [] });
            }
            grouped.get(item.task).names.push(item.name);
        });

        container.innerHTML = Array.from(grouped.values()).map(item => `
            <div class="assignment-card animate-fade-in">
                <span class="material-icons icon">${item.icon}</span>
                <div class="assignment-info">
                    <div class="assignment-task">${item.task}</div>
                    <div class="assignment-name">${item.names.join(', ')}</div>
                </div>
                
            </div>
        `).join('');

        // Zeige den Ergebnis-Bereich
        const resultSection = document.getElementById('result-section');
        if (resultSection) {
            resultSection.classList.add('visible');
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Führt die Aufgabenzuweisung durch
     */
    performAssignment() {
        const monthInput = document.getElementById('month-name');
        const month = monthInput?.value.trim();

        if (!month) {
            alert('Bitte gib den Monat ein, um die Zuweisung zu starten.');
            return;
        }

        this.currentMonth = month;
        this.engine.updateFromUI();
        this.currentAssignments = this.engine.assignTasks();

        // Speichern für Board-Ansicht
        StorageManager.saveCurrentAssignments(this.currentAssignments);
        StorageManager.saveCurrentMonth(month);

        // Zur History hinzufügen
        StorageManager.addToHistory({
            month: month,
            date: new Date().toISOString(),
            assignments: this.currentAssignments
        });

        this.renderAssignments();
    }

    /**
     * Exportiert die aktuelle Zuweisung als PDF
     */
    async exportPDF() {
        if (!this.currentAssignments.length) {
            alert('Bitte erst Ämtchen zuweisen!');
            return;
        }

        // Dynamisch jsPDF laden falls noch nicht vorhanden
        if (typeof window.jspdf === 'undefined') {
            alert('PDF-Bibliothek wird geladen...');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Titel
        doc.setFontSize(24);
        doc.setTextColor(40, 40, 40);
        doc.text('Ämtchen Zuweisung', 105, 25, { align: 'center' });

        // Monat
        doc.setFontSize(16);
        doc.setTextColor(100, 100, 100);
        doc.text(this.currentMonth, 105, 35, { align: 'center' });

        // Datum
        doc.setFontSize(10);
        doc.text(`Erstellt am: ${formatDate(new Date())}`, 105, 42, { align: 'center' });

        // Linie
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 48, 190, 48);

        // Zuweisungen
        let y = 60;
        doc.setFontSize(12);

        // Gruppiere nach Aufgaben
        const grouped = new Map();
        this.currentAssignments.forEach(item => {
            if (!grouped.has(item.task)) {
                grouped.set(item.task, []);
            }
            grouped.get(item.task).push(item.name);
        });

        grouped.forEach((names, task) => {
            doc.setTextColor(40, 40, 40);
            doc.setFont(undefined, 'bold');
            doc.text(task, 25, y);
            
            doc.setFont(undefined, 'normal');
            doc.setTextColor(80, 80, 80);
            doc.text(names.join(', '), 25, y + 6);
            
            y += 18;

            // Neue Seite falls nötig
            if (y > 270) {
                doc.addPage();
                y = 25;
            }
        });

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Schnyder Werbung - Ämtchen Slot Machine', 105, 285, { align: 'center' });

        // Download
        doc.save(`Amtchen_${this.currentMonth.replace(/\s+/g, '_')}.pdf`);
    }

    /**
     * Öffnet die Board-Ansicht
     */
    openBoard() {
        window.open('board.html', '_blank');
    }

    /**
     * Öffnet die History-Seite
     */
    openHistory() {
        window.location.href = 'history.html';
    }

    /**
     * Bindet alle Event-Listener
     */
    bindEvents() {
        // Start Button
        document.getElementById('start-btn')?.addEventListener('click', () => {
            this.performAssignment();
        });

        // PDF Export Button
        document.getElementById('pdf-btn')?.addEventListener('click', () => {
            this.exportPDF();
        });

        // Board Button
        document.getElementById('board-btn')?.addEventListener('click', () => {
            this.openBoard();
        });

        // Enter-Taste im Monatsfeld
        document.getElementById('month-name')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performAssignment();
            }
        });
    }
}

// ============================================
// History Controller Class
// ============================================

/**
 * Verwaltet die History-Seite
 */
class HistoryController {
    constructor() {
        this.history = StorageManager.getHistory();
        this.filteredHistory = [...this.history];
    }

    /**
     * Initialisiert die History-Seite
     */
    init() {
        this.renderHistory();
        this.bindEvents();
    }

    /**
     * Filtert die History nach Suchbegriff
     * @param {string} query - Suchbegriff
     */
    filterHistory(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredHistory = [...this.history];
        } else {
            this.filteredHistory = this.history.filter(entry => {
                // Suche im Monat
                if (entry.month.toLowerCase().includes(searchTerm)) return true;
                
                // Suche in Namen und Aufgaben
                return entry.assignments.some(a => 
                    a.name.toLowerCase().includes(searchTerm) ||
                    a.task.toLowerCase().includes(searchTerm)
                );
            });
        }
        
        this.renderHistory();
    }

    /**
     * Rendert die History-Liste
     */
    renderHistory() {
        const container = document.getElementById('history-list');
        if (!container) return;

        if (this.filteredHistory.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons icon">history</span>
                    <h3>Keine Einträge gefunden</h3>
                    <p>${this.history.length === 0 ? 'Es wurden noch keine Zuweisungen durchgeführt.' : 'Keine Treffer für diese Suche.'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredHistory.map(entry => `
            <div class="history-item animate-fade-in">
                <div class="history-header">
                    <span class="history-month">${entry.month}</span>
                    <span class="history-date">${formatDate(new Date(entry.date))}</span>
                </div>
                <div class="history-assignments">
                    ${entry.assignments.map(a => `
                        <div class="history-assignment">
                            <span class="history-assignment-name">${a.name}</span>
                            <span class="history-assignment-task">${a.task}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Löscht die gesamte History
     */
    clearHistory() {
        if (confirm('Möchtest du wirklich die gesamte History löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            StorageManager.clearHistory();
            this.history = [];
            this.filteredHistory = [];
            this.renderHistory();
        }
    }

    /**
     * Bindet die Event-Listener
     */
    bindEvents() {
        // Suchfeld
        document.getElementById('history-search')?.addEventListener('input', (e) => {
            this.filterHistory(e.target.value);
        });

        // Clear Button
        document.getElementById('clear-history-btn')?.addEventListener('click', () => {
            this.clearHistory();
        });
    }
}

// ============================================
// Board Controller Class
// ============================================

/**
 * Verwaltet die Board-Ansicht
 */
class BoardController {
    constructor() {
        this.assignments = StorageManager.getCurrentAssignments();
        this.month = StorageManager.getCurrentMonth();
    }

    /**
     * Initialisiert die Board-Seite
     */
    init() {
        this.renderBoard();
    }

    /**
     * Rendert das Board
     */
    renderBoard() {
        // Monat setzen
        const monthEl = document.getElementById('board-month');
        if (monthEl) {
            monthEl.textContent = this.month || 'Kein Monat ausgewählt';
        }

        // Grid rendern
        const grid = document.getElementById('assignment-grid');
        if (!grid) return;

        if (this.assignments.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <span class="material-icons icon">assignment</span>
                    <h3>Keine Zuweisungen vorhanden</h3>
                    <p>Bitte zuerst auf der Hauptseite Ämtchen zuweisen.</p>
                </div>
            `;
            return;
        }

        // Gruppiere nach Aufgaben für bessere Übersicht
        const grouped = new Map();
        this.assignments.forEach(item => {
            if (!grouped.has(item.task)) {
                grouped.set(item.task, { ...item, names: [] });
            }
            grouped.get(item.task).names.push(item.name);
        });

        grid.innerHTML = Array.from(grouped.values()).map(item => `
            <div class="board-card">
                <span class="material-icons icon">${item.icon}</span>
                <div class="task">${item.task}</div>
                <div class="name">${item.names.join(', ')}</div>
            </div>
        `).join('');
    }
}

// ============================================
// Initialization
// ============================================

/**
 * Initialisiert die richtige Controller-Klasse basierend auf der aktuellen Seite
 */
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    if (path.includes('history.html')) {
        new HistoryController().init();
    } else if (path.includes('board.html')) {
        new BoardController().init();
    } else {
        // Hauptseite (index.html)
        new UIController().init();
    }
});
