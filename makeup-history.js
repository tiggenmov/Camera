// Undo/Redo system with makeup history
class MakeupHistory {
    constructor(makeupEngine, maxHistory = 50) {
        this.engine = makeupEngine;
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = maxHistory;
        this.isRecording = true;
        
        // Store initial state
        this.saveState();
    }

    saveState() {
        if (!this.isRecording) return;
        
        const state = {
            makeup: JSON.parse(JSON.stringify(this.engine.currentMakeup)),
            timestamp: Date.now()
        };
        
        // Remove future states if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        
        // Add new state
        this.history.push(state);
        this.currentIndex++;
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.currentIndex--;
        }
        
        this.updateUI();
    }

    undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.applyState(this.history[this.currentIndex]);
            return true;
        }
        return false;
    }

    redo() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            this.applyState(this.history[this.currentIndex]);
            return true;
        }
        return false;
    }

    applyState(state) {
        this.isRecording = false;
        
        // Apply makeup state
        this.engine.currentMakeup = JSON.parse(JSON.stringify(state.makeup));
        this.engine.redraw();
        
        this.isRecording = true;
        this.updateUI();
    }

    clearHistory() {
        this.history = [];
        this.currentIndex = -1;
        this.saveState();
        this.updateUI();
    }

    getHistory() {
        return this.history.map((state, index) => ({
            ...state,
            isCurrent: index === this.currentIndex
        }));
    }

    // Save a named look
    saveLook(name, description = '') {
        const look = {
            name,
            description,
            makeup: JSON.parse(JSON.stringify(this.engine.currentMakeup)),
            timestamp: Date.now(),
            preview: this.engine.canvas.toDataURL('image/jpeg', 0.5)
        };
        
        // Save to localStorage
        this.saveToStorage(name, look);
        return look;
    }

    saveToStorage(name, look) {
        const savedLooks = this.getSavedLooks();
        savedLooks[name] = look;
        
        try {
            localStorage.setItem('makeupLooks', JSON.stringify(savedLooks));
            return true;
        } catch (error) {
            console.error('Failed to save look:', error);
            return false;
        }
    }

    getSavedLooks() {
        try {
            const looks = localStorage.getItem('makeupLooks');
            return looks ? JSON.parse(looks) : {};
        } catch (error) {
            console.error('Failed to load looks:', error);
            return {};
        }
    }

    loadLook(name) {
        const looks = this.getSavedLooks();
        const look = looks[name];
        
        if (look) {
            this.isRecording = false;
            this.engine.currentMakeup = JSON.parse(JSON.stringify(look.makeup));
            this.engine.redraw();
            this.isRecording = true;
            
            this.saveState(); // Add to history
            return true;
        }
        
        return false;
    }

    deleteLook(name) {
        const looks = this.getSavedLooks();
        if (looks[name]) {
            delete looks[name];
            localStorage.setItem('makeupLooks', JSON.stringify(looks));
            return true;
        }
        return false;
    }
}

// History UI Component
class HistoryUI {
    constructor(historyManager, uiControls) {
        this.history = historyManager;
        this.uiControls = uiControls;
        this.init();
    }

    init() {
        this.createUI();
        this.bindEvents();
        this.setupKeyboardShortcuts();
    }

    createUI() {
        // Add history controls to UI
        const actionButtons = document.querySelector('.action-buttons');
        
        const historyControls = document.createElement('div');
        historyControls.className = 'history-controls';
        historyControls.innerHTML = `
            <div class="history-buttons">
                <button id="undoBtn" class="btn btn-sm" title="Undo (Ctrl+Z)">
                    <i class="fas fa-undo"></i>
                </button>
                <button id="redoBtn" class="btn btn-sm" title="Redo (Ctrl+Y)">
                    <i class="fas fa-redo"></i>
                </button>
                <button id="saveLookBtn" class="btn btn-sm" title="Save Look">
                    <i class="fas fa-save"></i>
                </button>
                <button id="loadLooksBtn" class="btn btn-sm" title="Saved Looks">
                    <i class="fas fa-folder-open"></i>
                </button>
            </div>
            <div class="history-status">
                <span id="historyCount">0/0</span>
            </div>
        `;
        
        actionButtons.insertBefore(historyControls, actionButtons.firstChild);

        // Create saved looks modal
        this.createLooksModal();
    }

    createLooksModal() {
        const modal = document.createElement('div');
        modal.id = 'savedLooksModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-palette"></i> Saved Looks</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="save-look-form">
                        <input type="text" id="lookNameInput" placeholder="Enter look name">
                        <textarea id="lookDescriptionInput" placeholder="Description (optional)"></textarea>
                        <button id="saveCurrentBtn" class="btn btn-primary">
                            <i class="fas fa-save"></i> Save Current Look
                        </button>
                    </div>
                    <div class="saved-looks-grid" id="savedLooksGrid">
                        <!-- Looks will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    bindEvents() {
        // Undo/Redo buttons
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('redoBtn').addEventListener('click', () => {
            this.redo();
        });

        // Save/Load buttons
        document.getElementById('saveLookBtn').addEventListener('click', () => {
            this.showSaveLookForm();
        });

        document.getElementById('loadLooksBtn').addEventListener('click', () => {
            this.showSavedLooks();
        });

        // Modal events
        document.querySelector('#savedLooksModal .modal-close').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('saveCurrentBtn').addEventListener('click', () => {
            this.saveCurrentLook();
        });

        // Close modal on outside click
        document.getElementById('savedLooksModal').addEventListener('click', (e) => {
            if (e.target.id === 'savedLooksModal') {
                this.hideModal();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        e.preventDefault();
                        break;
                    case 'y':
                        this.redo();
                        e.preventDefault();
                        break;
                    case 's':
                        this.showSaveLookForm();
                        e.preventDefault();
                        break;
                    case 'l':
                        this.showSavedLooks();
                        e.preventDefault();
                        break;
                }
            }
        });
    }

    undo() {
        const success = this.history.undo();
        if (success) {
            this.uiControls.loadCategoryControls(this.uiControls.currentCategory);
            this.showNotification('Undone', 'undo');
        }
    }

    redo() {
        const success = this.history.redo();
        if (success) {
            this.uiControls.loadCategoryControls(this.uiControls.currentCategory);
            this.showNotification('Redone', 'redo');
        }
    }

    updateUI() {
        const history = this.history.getHistory();
        const countElement = document.getElementById('historyCount');
        
        if (countElement) {
            countElement.textContent = `${this.history.currentIndex + 1}/${history.length}`;
        }

        // Update undo/redo button states
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        undoBtn.disabled = this.history.currentIndex <= 0;
        redoBtn.disabled = this.history.currentIndex >= history.length - 1;
    }

    showSaveLookForm() {
        const modal = document.getElementById('savedLooksModal');
        modal.style.display = 'block';
        
        // Focus on name input
        document.getElementById('lookNameInput').focus();
        
        // Clear previous looks grid
        document.getElementById('savedLooksGrid').innerHTML = '';
    }

    showSavedLooks() {
        const modal = document.getElementById('savedLooksModal');
        modal.style.display = 'block';
        
        // Load and display saved looks
        this.loadSavedLooks();
    }

    hideModal() {
        const modal = document.getElementById('savedLooksModal');
        modal.style.display = 'none';
        
        // Clear form
        document.getElementById('lookNameInput').value = '';
        document.getElementById('lookDescriptionInput').value = '';
    }

    saveCurrentLook() {
        const name = document.getElementById('lookNameInput').value.trim();
        const description = document.getElementById('lookDescriptionInput').value.trim();
        
        if (!name) {
            alert('Please enter a name for your look');
            return;
        }
        
        // Check if name already exists
        const existingLooks = this.history.getSavedLooks();
        if (existingLooks[name]) {
            if (!confirm(`"${name}" already exists. Overwrite?`)) {
                return;
            }
        }
        
        // Save look
        const look = this.history.saveLook(name, description);
        
        // Update UI
        this.loadSavedLooks();
        
        // Clear form
        document.getElementById('lookNameInput').value = '';
        document.getElementById('lookDescriptionInput').value = '';
        
        this.showNotification(`"${name}" saved successfully!`, 'save');
    }

    loadSavedLooks() {
        const looks = this.history.getSavedLooks();
        const grid = document.getElementById('savedLooksGrid');
        
        if (Object.keys(looks).length === 0) {
            grid.innerHTML = `
                <div class="no-looks">
                    <i class="fas fa-palette"></i>
                    <p>No saved looks yet. Save your first look!</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        Object.entries(looks).forEach(([name, look]) => {
            const date = new Date(look.timestamp).toLocaleDateString();
            
            html += `
                <div class="saved-look-card">
                    <div class="look-preview">
                        <img src="${look.preview}" alt="${name}">
                    </div>
                    <div class="look-info">
                        <h4>${name}</h4>
                        <p class="look-date">${date}</p>
                        ${look.description ? `<p class="look-desc">${look.description}</p>` : ''}
                    </div>
                    <div class="look-actions">
                        <button class="btn-load" data-name="${name}" title="Load Look">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn-delete" data-name="${name}" title="Delete Look">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        grid.innerHTML = html;
        
        // Bind action buttons
        grid.querySelectorAll('.btn-load').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const name = e.target.closest('.btn-load').dataset.name;
                this.loadLook(name);
            });
        });
        
        grid.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const name = e.target.closest('.btn-delete').dataset.name;
                this.deleteLook(name);
            });
        });
    }

    loadLook(name) {
        const success = this.history.loadLook(name);
        if (success) {
            this.uiControls.loadCategoryControls(this.uiControls.currentCategory);
            this.hideModal();
            this.showNotification(`"${name}" loaded!`, 'success');
        }
    }

    deleteLook(name) {
        if (confirm(`Delete "${name}"?`)) {
            const success = this.history.deleteLook(name);
            if (success) {
                this.loadSavedLooks();
                this.showNotification(`"${name}" deleted`, 'delete');
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `history-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            undo: 'undo',
            redo: 'redo',
            save: 'save',
            delete: 'trash',
            success: 'check-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Observer to automatically save history when makeup changes
class MakeupChangeObserver {
    constructor(makeupEngine, historyManager) {
        this.engine = makeupEngine;
        this.history = historyManager;
        this.lastState = null;
        this.debounceTimer = null;
        
        this.init();
    }

    init() {
        // Proxy the engine's updateMakeup method
        const originalUpdate = this.engine.updateMakeup.bind(this.engine);
        
        this.engine.updateMakeup = (category, property, value) => {
            originalUpdate(category, property, value);
            this.onMakeupChange(category, property, value);
        };
        
        // Also monitor redraw calls
        const originalRedraw = this.engine.redraw.bind(this.engine);
        this.engine.redraw = () => {
            originalRedraw();
            this.checkForChanges();
        };
    }

    onMakeupChange(category, property, value) {
        // Debounce to avoid too many history entries
        clearTimeout(this.debounceTimer);
        
        this.debounceTimer = setTimeout(() => {
            this.saveChange();
        }, 500);
    }

    checkForChanges() {
        const currentState = JSON.stringify(this.engine.currentMakeup);
        
        if (this.lastState !== currentState) {
            this.saveChange();
            this.lastState = currentState;
        }
    }

    saveChange() {
        this.history.saveState();
    }
}
