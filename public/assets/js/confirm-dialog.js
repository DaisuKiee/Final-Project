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
let currentInputModal = null;

function showInputModal(title, label, defaultValue = '', isTextarea = false) {
    return new Promise((resolve) => {
        inputResolve = resolve;
        
        // Remove existing modal if any
        if (currentInputModal) {
            currentInputModal.remove();
            currentInputModal = null;
        }
        
        // Create new modal
        const modal = document.createElement('div');
        modal.id = 'inputModal';
        modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">${title}</h3>
                        <button class="modal-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl">
                            &times;
                        </button>
                    </div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">${label}</label>
                    ${isTextarea 
                        ? `<textarea class="modal-input w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 transition-all mb-4" rows="4">${defaultValue}</textarea>`
                        : `<input type="text" class="modal-input w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 transition-all mb-4" value="${defaultValue}">`
                    }
                    <div class="flex gap-3">
                        <button class="modal-cancel flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button class="modal-submit flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        currentInputModal = modal;
        
        // Get elements
        const inputElement = modal.querySelector('.modal-input');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const submitBtn = modal.querySelector('.modal-submit');
        
        // Focus input
        setTimeout(() => inputElement.focus(), 100);
        
        // Handle submit
        const handleSubmit = () => {
            const value = inputElement.value;
            modal.remove();
            currentInputModal = null;
            if (inputResolve) {
                inputResolve(value);
                inputResolve = null;
            }
            document.removeEventListener('keydown', keyHandler);
        };
        
        // Handle cancel
        const handleCancel = () => {
            modal.remove();
            currentInputModal = null;
            if (inputResolve) {
                inputResolve(null);
                inputResolve = null;
            }
            document.removeEventListener('keydown', keyHandler);
        };
        
        // Event listeners
        submitBtn.onclick = handleSubmit;
        closeBtn.onclick = handleCancel;
        cancelBtn.onclick = handleCancel;
        
        // Close on backdrop click
        modal.onclick = (e) => {
            if (e.target === modal) handleCancel();
        };
        
        // Handle keyboard
        const keyHandler = (e) => {
            if (e.key === 'Enter' && !isTextarea) {
                handleSubmit();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        };
        document.addEventListener('keydown', keyHandler);
    });
}

function closeInputModal() {
    if (currentInputModal) {
        currentInputModal.remove();
        currentInputModal = null;
    }
    if (inputResolve) {
        inputResolve(null);
        inputResolve = null;
    }
}

function submitInputModal() {
    if (currentInputModal) {
        const inputElement = currentInputModal.querySelector('.modal-input');
        const value = inputElement ? inputElement.value : '';
        currentInputModal.remove();
        currentInputModal = null;
        if (inputResolve) {
            inputResolve(value);
            inputResolve = null;
        }
    }
}
