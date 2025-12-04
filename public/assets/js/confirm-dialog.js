// Confirmation Dialog System
let confirmResolve = null;

// Show confirmation dialog
function showConfirm(message, title = 'Confirm Action', confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        confirmResolve = resolve;
        
        // Create modal if it doesn't exist
        let modal = document.getElementById('confirmModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'confirmModal';
            modal.className = 'hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                    <div class="p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-question-circle text-2xl text-purple-600 dark:text-purple-400"></i>
                            </div>
                            <h3 id="confirmTitle" class="text-xl font-bold text-gray-900 dark:text-white"></h3>
                        </div>
                        <p id="confirmMessage" class="text-gray-700 dark:text-gray-300 mb-6"></p>
                        <div class="flex gap-3">
                            <button id="confirmCancel" class="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors">
                            </button>
                            <button id="confirmOk" class="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Update content
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmOk').textContent = confirmText;
        document.getElementById('confirmCancel').textContent = cancelText;
        
        // Show modal
        modal.classList.remove('hidden');
        
        // Add event listeners
        const handleConfirm = () => {
            modal.classList.add('hidden');
            if (confirmResolve) {
                confirmResolve(true);
                confirmResolve = null;
            }
        };
        
        const handleCancel = () => {
            modal.classList.add('hidden');
            if (confirmResolve) {
                confirmResolve(false);
                confirmResolve = null;
            }
        };
        
        document.getElementById('confirmOk').onclick = handleConfirm;
        document.getElementById('confirmCancel').onclick = handleCancel;
        
        // Close on backdrop click
        modal.onclick = (e) => {
            if (e.target === modal) handleCancel();
        };
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    });
}

// Input Modal System
let inputResolve = null;

function showInputModal(title, label, defaultValue = '', isTextarea = false) {
    return new Promise((resolve) => {
        inputResolve = resolve;
        
        // Create modal if it doesn't exist
        let modal = document.getElementById('inputModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'inputModal';
            modal.className = 'hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 id="inputModalTitle" class="text-xl font-bold text-gray-900 dark:text-white"></h3>
                            <button onclick="closeInputModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl">
                                &times;
                            </button>
                        </div>
                        <label id="inputModalLabel" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"></label>
                        <input type="text" id="inputModalInput" class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 transition-all mb-4">
                        <textarea id="inputModalTextarea" rows="4" class="hidden w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 transition-all mb-4"></textarea>
                        <div class="flex gap-3">
                            <button onclick="closeInputModal()" class="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button onclick="submitInputModal()" class="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Update content
        document.getElementById('inputModalTitle').textContent = title;
        document.getElementById('inputModalLabel').textContent = label;
        
        const input = document.getElementById('inputModalInput');
        const textarea = document.getElementById('inputModalTextarea');
        
        if (isTextarea) {
            input.classList.add('hidden');
            textarea.classList.remove('hidden');
            textarea.value = defaultValue;
            setTimeout(() => textarea.focus(), 100);
        } else {
            input.classList.remove('hidden');
            textarea.classList.add('hidden');
            input.value = defaultValue;
            setTimeout(() => input.focus(), 100);
        }
        
        // Show modal
        modal.classList.remove('hidden');
        
        // Close on backdrop click
        modal.onclick = (e) => {
            if (e.target === modal) closeInputModal();
        };
        
        // Handle Enter key
        const enterHandler = (e) => {
            if (e.key === 'Enter' && !isTextarea) {
                submitInputModal();
                document.removeEventListener('keydown', enterHandler);
            } else if (e.key === 'Escape') {
                closeInputModal();
                document.removeEventListener('keydown', enterHandler);
            }
        };
        document.addEventListener('keydown', enterHandler);
    });
}

function closeInputModal() {
    const modal = document.getElementById('inputModal');
    if (modal) modal.classList.add('hidden');
    if (inputResolve) {
        inputResolve(null);
        inputResolve = null;
    }
}

function submitInputModal() {
    const input = document.getElementById('inputModalInput');
    const textarea = document.getElementById('inputModalTextarea');
    const value = input.classList.contains('hidden') ? textarea.value : input.value;
    
    const modal = document.getElementById('inputModal');
    if (modal) modal.classList.add('hidden');
    if (inputResolve) {
        inputResolve(value);
        inputResolve = null;
    }
}
