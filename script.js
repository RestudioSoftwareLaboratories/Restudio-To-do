// ========== SECURITY UTILITIES ==========

// 1. Sanitization - منع هجمات XSS
function sanitizeText(text) {
    if (text === null || text === undefined) return '';
    if (typeof text !== 'string') return String(text);
    
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '=': '&#x3D;',
        '`': '&#x60;'
    };
    return text.replace(/[&<>"'/=`]/g, function(match) {
        return map[match];
    });
}

function isValidText(text) {
    if (typeof text !== 'string') return false;
    var dangerousPatterns = [
        /javascript:/i,
        /on\w+\s*=/i,
        /<script/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /data:text\/html/i,
        /vbscript:/i
    ];
    for (var i = 0; i < dangerousPatterns.length; i++) {
        if (dangerousPatterns[i].test(text)) return false;
    }
    return true;
}

// 2. Task Validation
function validateTaskText(text) {
    if (typeof text !== 'string') return false;
    var trimmed = text.trim();
    if (trimmed.length === 0) return false;
    if (trimmed.length > 500) return false;
    if (!isValidText(trimmed)) return false;
    return true;
}

// 3. Data Validation for Loading
function validateStoredTasks(data) {
    if (!Array.isArray(data)) return false;
    for (var i = 0; i < data.length; i++) {
        var task = data[i];
        if (!task || typeof task !== 'object') return false;
        if (typeof task.id !== 'number' && typeof task.id !== 'string') return false;
        if (typeof task.text !== 'string') return false;
        if (!isValidText(task.text)) return false;
        if (typeof task.done !== 'boolean') return false;
        if (typeof task.favorite !== 'boolean') return false;
    }
    return true;
}

// ========== MAIN APPLICATION ==========

(function() {
    'use strict';
    
    // --- Data ---
    var tasks = [];
    var currentTab = 'all';

    // --- DOM Elements ---
    var taskList = document.getElementById('taskList');
    var taskInput = document.getElementById('taskInput');
    var addBtn = document.getElementById('addBtn');
    var taskCount = document.getElementById('taskCount');
    var clearBtn = document.getElementById('clearBtn');
    var errorMsg = document.getElementById('errorMsg');
    var tabs = document.querySelectorAll('.tab');
    var allCount = document.getElementById('allCount');
    var favCount = document.getElementById('favCount');
    var hasUnsavedChanges = false;

    // --- Unsaved Changes ---
    function markAsChanged() {
        hasUnsavedChanges = true;
    }

    function clearUnsaved() {
        hasUnsavedChanges = false;
    }

    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });

    // --- Load Data ---
    function loadData() {
        try {
            var storedTasks = localStorage.getItem('quickTodos');
            if (storedTasks) {
                var parsed = JSON.parse(storedTasks);
                if (validateStoredTasks(parsed)) {
                    tasks = parsed;
                } else {
                    console.warn('Invalid data format, resetting.');
                    tasks = [];
                }
            }
        } catch (e) {
            console.warn('Failed to load data.', e);
            tasks = [];
        }
        clearUnsaved();
    }

    function saveTasks() {
        try {
            localStorage.setItem('quickTodos', JSON.stringify(tasks));
            clearUnsaved();
        } catch (e) {
            console.warn('Failed to save tasks.', e);
        }
    }

    // --- Filter Tasks ---
    function getFilteredTasks() {
        var filtered = tasks.slice();
        if (currentTab === 'favorites') {
            filtered = filtered.filter(function(t) { return t.favorite; });
        }
        return filtered;
    }

    // --- Create Checkbox ---
    function createCheckbox(task, onChange) {
        var wrapper = document.createElement('div');
        wrapper.className = 'checkbox-wrapper-12';
        
        var cbx = document.createElement('div');
        cbx.className = 'cbx';
        
        var input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = task.done;
        input.addEventListener('change', function(e) {
            e.stopPropagation();
            onChange();
        });
        
        var label = document.createElement('label');
        
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '15');
        svg.setAttribute('height', '14');
        svg.setAttribute('viewBox', '0 0 15 14');
        svg.setAttribute('fill', 'none');
        
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M2 8.36364L6.23077 12L13 2');
        
        svg.appendChild(path);
        cbx.appendChild(input);
        cbx.appendChild(label);
        cbx.appendChild(svg);
        wrapper.appendChild(cbx);
        
        return wrapper;
    }

    // --- Render ---
    function render() {
        taskList.innerHTML = '';
        var filteredTasks = getFilteredTasks();

        var totalUndone = 0;
        for (var i = 0; i < tasks.length; i++) {
            if (!tasks[i].done) totalUndone++;
        }
        var totalFav = 0;
        for (var j = 0; j < tasks.length; j++) {
            if (tasks[j].favorite) totalFav++;
        }
        allCount.textContent = tasks.length;
        favCount.textContent = totalFav;
        taskCount.innerHTML = '<i class="ti ti-list-numbers"></i> ' + totalUndone + ' of ' + tasks.length;

        if (filteredTasks.length === 0) {
            var emptyLi = document.createElement('li');
            emptyLi.className = 'empty-state';
            
            var emptyImage, emptyTitle, emptySubtext;
            if (currentTab === 'favorites') {
                emptyImage = 'https://i.postimg.cc/R0pJPzgC/heart.png';
                emptyTitle = 'No favorite tasks';
                emptySubtext = 'Click the star to add favorites';
            } else {
                emptyImage = 'https://i.postimg.cc/dtCPWmVs/task.png';
                emptyTitle = 'No tasks yet';
                emptySubtext = 'Add a new task to get started';
            }
            
            emptyLi.innerHTML = '<div class="empty-state-content"><img src="' + emptyImage + '" alt="No tasks" class="empty-image" /><div><div class="empty-text">' + emptyTitle + '</div><div class="empty-subtext">' + emptySubtext + '</div></div></div>';
            taskList.appendChild(emptyLi);
            return;
        }

        for (var k = 0; k < filteredTasks.length; k++) {
            var task = filteredTasks[k];
            var li = document.createElement('li');

            var taskContent = document.createElement('div');
            taskContent.className = 'task-content';
            
            var checkbox = createCheckbox(task, function() {
                task.done = !task.done;
                saveTasks();
                render();
            });
            
            var taskInfo = document.createElement('div');
            taskInfo.className = 'task-info';
            
            var taskText = document.createElement('div');
            taskText.className = 'task-text' + (task.done ? ' done' : '');
            taskText.textContent = task.text;
            
            taskInfo.appendChild(taskText);
            
            taskContent.addEventListener('click', function(t) {
                return function(e) {
                    if (e.target.tagName !== 'INPUT' && !e.target.closest('.fav-btn') && !e.target.closest('.delete-btn')) {
                        t.done = !t.done;
                        saveTasks();
                        render();
                    }
                };
            }(task));
            
            taskContent.appendChild(checkbox);
            taskContent.appendChild(taskInfo);

            var taskActions = document.createElement('div');
            taskActions.className = 'task-actions';
            
            var favBtn = document.createElement('button');
            favBtn.className = 'fav-btn' + (task.favorite ? ' active' : '');
            favBtn.innerHTML = '<i class="ti ti-star"></i>';
            favBtn.title = task.favorite ? 'Remove from favorites' : 'Add to favorites';
            favBtn.addEventListener('click', function(t) {
                return function(e) {
                    e.stopPropagation();
                    t.favorite = !t.favorite;
                    saveTasks();
                    render();
                };
            }(task));
            
            var delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.type = 'button';
            delBtn.innerHTML = '<i class="ti ti-x"></i>';
            delBtn.title = 'Delete';
            delBtn.addEventListener('click', function(t) {
                return function(e) {
                    e.stopPropagation();
                    tasks = tasks.filter(function(item) { return item.id !== t.id; });
                    saveTasks();
                    render();
                };
            }(task));
            
            taskActions.appendChild(favBtn);
            taskActions.appendChild(delBtn);

            li.appendChild(taskContent);
            li.appendChild(taskActions);
            taskList.appendChild(li);
        }
    }

    // --- Add Task ---
    function addTask() {
        var rawText = taskInput.value;
        var sanitizedText = sanitizeText(rawText);
        
        if (!validateTaskText(sanitizedText)) {
            errorMsg.classList.add('show');
            taskInput.focus();
            taskInput.style.borderColor = '#a53a3a';
            setTimeout(function() {
                errorMsg.classList.remove('show');
                taskInput.style.borderColor = '#3a3a3a';
            }, 2000);
            return;
        }

        errorMsg.classList.remove('show');
        taskInput.style.borderColor = '#3a3a3a';

        var newTask = {
            id: Date.now(),
            text: sanitizedText.trim(),
            done: false,
            favorite: false
        };
        tasks.push(newTask);
        saveTasks();
        markAsChanged();
        render();
        taskInput.value = '';
        taskInput.focus();
    }

    // --- Clear All ---
    function clearAll() {
        var filteredTasks = getFilteredTasks();
        if (filteredTasks.length === 0) return;
        
        var confirmMsg = 'Delete all tasks?';
        if (currentTab === 'favorites') confirmMsg = 'Delete all favorite tasks?';
        
        if (confirm(confirmMsg)) {
            if (currentTab === 'favorites') {
                tasks = tasks.filter(function(t) { return !t.favorite; });
            } else {
                tasks = [];
            }
            saveTasks();
            markAsChanged();
            render();
            taskInput.focus();
        }
    }

    // --- Tab Change ---
    for (var t = 0; t < tabs.length; t++) {
        tabs[t].addEventListener('click', function() {
            for (var i = 0; i < tabs.length; i++) {
                tabs[i].classList.remove('active');
            }
            this.classList.add('active');
            currentTab = this.dataset.tab;
            render();
        });
    }

    // --- Keyboard Shortcuts ---
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl+Z - Undo (not implemented)
            // Ctrl+Y - Redo (not implemented)
            
            // Escape - Clear error
            if (e.key === 'Escape') {
                errorMsg.classList.remove('show');
                taskInput.style.borderColor = '#3a3a3a';
                taskInput.blur();
                return;
            }
            
            // Ctrl+A - Focus input
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                taskInput.focus();
                taskInput.select();
                return;
            }
        });
    }

    // --- Events ---
    taskInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTask();
        }
    });

    taskInput.addEventListener('input', function() {
        errorMsg.classList.remove('show');
        taskInput.style.borderColor = '#3a3a3a';
    });

    addBtn.addEventListener('click', function(e) {
        e.preventDefault();
        addTask();
    });

    clearBtn.addEventListener('click', clearAll);

    // --- Init ---
    loadData();
    render();
    taskInput.focus();
    setupKeyboardShortcuts();
    console.log('Restudio To Do initialized successfully');

})();
