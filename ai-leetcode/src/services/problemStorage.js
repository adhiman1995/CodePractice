/**
 * problemStorage.js
 * 
 * Handles daily problem persistence in localStorage.
 * 
 * Data structure:
 * - 'codepath_daily_<YYYY-MM-DD>'  → Array of today's problems
 * - 'codepath_problem_history'     → Array of { date, problems }[] for all past days
 */

const TODAY_PREFIX = 'codepath_daily_';
const HISTORY_KEY = 'codepath_problem_history';

/** Returns today's date string, e.g. "2026-03-12" */
export function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

/** Saves today's problems to localStorage */
export function saveTodaysProblems(problems) {
    try {
        const key = `${TODAY_PREFIX}${getTodayKey()}`;
        localStorage.setItem(key, JSON.stringify(problems));
    } catch (e) {
        console.error('[problemStorage] Failed to save today\'s problems:', e);
    }
}

/** Loads today's problems from localStorage (returns [] if none saved today) */
export function loadTodaysProblems() {
    try {
        const key = `${TODAY_PREFIX}${getTodayKey()}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('[problemStorage] Failed to load today\'s problems:', e);
        return [];
    }
}

/** Returns true if there are already problems saved for today */
export function hasTodaysProblems() {
    try {
        const key = `${TODAY_PREFIX}${getTodayKey()}`;
        const saved = localStorage.getItem(key);
        return saved && JSON.parse(saved).length > 0;
    } catch (e) {
        return false;
    }
}

/** Loads the history of all past problem sets (excludes today) */
export function loadHistory() {
    try {
        const saved = localStorage.getItem(HISTORY_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('[problemStorage] Failed to load history:', e);
        return [];
    }
}

const PENDING_SYNC_KEY = 'codepath_pending_sync';

/** Returns problems waiting to be synced to the backend */
export function getPendingSync() {
    try {
        const saved = localStorage.getItem(PENDING_SYNC_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
}

/** Clears the pending sync queue */
export function clearPendingSync() {
    localStorage.removeItem(PENDING_SYNC_KEY);
}

/**
 * Archives any "previous day" problems found in localStorage into history.
 * Should be called on app startup. Keeps history clean.
 * Also queues these archived problems for backend sync.
 */
export function archivePreviousDays() {
    try {
        const today = getTodayKey();
        const history = loadHistory();
        const knownDates = new Set(history.map(h => h.date));
        const pendingSync = getPendingSync();

        // Scan localStorage for old daily problem keys
        const keysToArchive = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(TODAY_PREFIX)) {
                const date = key.replace(TODAY_PREFIX, '');
                if (date !== today && !knownDates.has(date)) {
                    keysToArchive.push({ key, date });
                }
            }
        }

        if (keysToArchive.length === 0) return;

        let addedToSync = false;
        for (const { key, date } of keysToArchive) {
            try {
                const problems = JSON.parse(localStorage.getItem(key) || '[]');
                if (problems.length > 0) {
                    history.push({ date, problems });
                    // Queue for backend sync
                    pendingSync.push(...problems);
                    addedToSync = true;
                }
                localStorage.removeItem(key); 
                // Also clear the completed list for that old day
                localStorage.removeItem(`${COMPLETED_PREFIX}${date}`);
            } catch { }
        }

        if (addedToSync) {
            localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pendingSync));
        }

        // Sort history newest first
        history.sort((a, b) => b.date.localeCompare(a.date));
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

        console.log(`[problemStorage] Archived ${keysToArchive.length} previous day(s) and queued for sync.`);
    } catch (e) {
        console.error('[problemStorage] Failed to archive previous days:', e);
    }
}

/** Clears today's problems (e.g. when user wants to regenerate) */
export function clearTodaysProblems() {
    try {
        const key = `${TODAY_PREFIX}${getTodayKey()}`;
        localStorage.removeItem(key);
        // Also clear completions for today
        localStorage.removeItem(`codepath_completed_${getTodayKey()}`);
    } catch (e) { }
}

// ────────────────────────────────────────────────────────────
// COMPLETION TRACKING
// ────────────────────────────────────────────────────────────

const COMPLETED_PREFIX = 'codepath_completed_';

/** Marks a problem as completed for today */
export function markProblemComplete(problemId) {
    try {
        const key = `${COMPLETED_PREFIX}${getTodayKey()}`;
        const completedIds = getCompletedIds();
        completedIds.add(problemId);
        localStorage.setItem(key, JSON.stringify([...completedIds]));

        // Also update the stored problem object
        const problems = loadTodaysProblems();
        const updated = problems.map(p =>
            p.id === problemId ? { ...p, isCompleted: true } : p
        );
        saveTodaysProblems(updated);
        return updated;
    } catch (e) {
        console.error('[problemStorage] Failed to mark problem complete:', e);
        return null;
    }
}

/** Gets the set of completed problem IDs for today */
export function getCompletedIds() {
    try {
        const key = `${COMPLETED_PREFIX}${getTodayKey()}`;
        const saved = localStorage.getItem(key);
        return new Set(saved ? JSON.parse(saved) : []);
    } catch (e) {
        return new Set();
    }
}

/** Returns true if all of today's problems are completed */
export function areAllProblemsComplete(dailyProblems) {
    if (!dailyProblems || dailyProblems.length === 0) return false;
    const completedIds = getCompletedIds();
    return dailyProblems.every(p => p.isCompleted || completedIds.has(p.id));
}
