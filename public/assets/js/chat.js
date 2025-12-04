// Chat System - Telegram Style (No Auto-Refresh)
let currentChatBooking = null;
let showEmojiPicker = false;
let lastMessageId = null;

// Common emojis for quick access
const commonEmojis = ['😊', '😂', '❤️', '👍', '🙏', '😍', '🎉', '🔥', '✨', '💯', '😎', '🤔', '😢', '😅', '🥰', '👏', '🙌', '💪', '🌟', '⭐'];

// Open chat for a booking
function openChat(bookingId, partnerName, bookingRef) {
    currentChatBooking = bookingId;
    lastMessageId = null;
    document.getElementById('chatPartnerName').textContent = partnerName;
    document.getElementById('chatBookingRef').textContent = bookingRef;
    
    // Generate initials
    const initials = partnerName.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('chatPartnerInitials').textContent = initials;
    
    // Reset avatar to initials initially
    const avatarImg = document.getElementById('chatPartnerAvatar');
    const avatarInitials = document.getElementById('chatPartnerInitials');
    if (avatarImg && avatarInitials) {
        avatarImg.classList.add('hidden');
        avatarInitials.classList.remove('hidden');
    }
    
    document.getElementById('chatModal').classList.remove('hidden');
    document.getElementById('chatInput').value = '';
    document.getElementById('filePreview').classList.add('hidden');
    showEmojiPicker = false;
    document.getElementById('emojiPicker')?.classList.add('hidden');
    
    // Prevent body scroll on mobile
    if (window.innerWidth <= 768) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }
    
    loadMessages();
    handleMobileKeyboard();
}

// Close chat
function closeChatModal() {
    document.getElementById('chatModal').classList.add('hidden');
    currentChatBooking = null;
    lastMessageId = null;
    showEmojiPicker = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
}

// Manual refresh messages
function refreshMessages() {
    if (!currentChatBooking) return;
    
    const refreshBtn = document.getElementById('refreshMessagesBtn');
    if (refreshBtn) {
        refreshBtn.classList.add('rotating');
        setTimeout(() => refreshBtn.classList.remove('rotating'), 600);
    }
    
    loadMessages();
}

// Load messages
async function loadMessages() {
    if (!currentChatBooking) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/chat/messages/${currentChatBooking}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load messages');
        }
        
        const messages = await response.json();
        renderMessages(messages);
        markMessagesAsRead();
        
        // Update chat header with actual user info from messages
        if (messages.length > 0) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const firstOtherMessage = messages.find(msg => {
                const senderId = msg.senderId?._id || msg.senderId;
                return senderId && senderId.toString() !== currentUser._id.toString();
            });
            
            if (firstOtherMessage && firstOtherMessage.senderId) {
                const otherUser = firstOtherMessage.senderId;
                
                // Update name if available
                if (otherUser.name) {
                    document.getElementById('chatPartnerName').textContent = otherUser.name;
                    
                    // Update initials
                    const initials = otherUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
                    document.getElementById('chatPartnerInitials').textContent = initials;
                }
                
                // Update profile picture if available
                if (otherUser.profilePicture) {
                    const avatarImg = document.getElementById('chatPartnerAvatar');
                    const avatarInitials = document.getElementById('chatPartnerInitials');
                    if (avatarImg && avatarInitials) {
                        avatarImg.src = otherUser.profilePicture;
                        avatarImg.classList.remove('hidden');
                        avatarInitials.classList.add('hidden');
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Render messages
function renderMessages(messages) {
    const container = document.getElementById('chatMessages');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const currentUserId = currentUser._id;
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center empty-chat-state">
                    <div class="empty-chat-icon-telegram">
                        <i class="fas fa-paper-plane"></i>
                    </div>
                    <h3 class="text-gray-400 text-base font-medium mb-2">No messages here yet...</h3>
                    <p class="text-gray-600 text-sm">Send a message to start the conversation</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(msg => {
        // Get the actual sender ID - handle both populated and unpopulated data
        let senderId;
        
        if (typeof msg.senderId === 'string') {
            // If senderId is a string (ID only)
            senderId = msg.senderId;
        } else if (msg.senderId && msg.senderId._id) {
            // If senderId is populated object
            senderId = msg.senderId._id;
        } else {
            // Fallback
            senderId = null;
        }
        
        // Determine if message is from current user
        const isCurrentUser = senderId && currentUserId && 
                             senderId.toString() === currentUserId.toString();
        
        const time = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Get sender info for display
        let senderName = 'Unknown';
        let initials = '?';
        let profilePicture = null;
        
        if (isCurrentUser) {
            senderName = currentUser.name;
            initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            profilePicture = currentUser.profilePicture;
        } else if (msg.senderId && msg.senderId.name) {
            senderName = msg.senderId.name;
            initials = msg.senderId.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            profilePicture = msg.senderId.profilePicture;
        } else {
            // If no sender info, use generic
            senderName = 'User';
            initials = 'U';
        }
        
        // Render based on message type
        let messageContent = '';
        if (msg.messageType === 'image' && msg.attachment) {
            messageContent = `
                <div class="cursor-pointer" onclick="openImageModal('${msg.attachment.url}')">
                    <img src="${msg.attachment.url}" alt="Image" class="max-w-full rounded-lg max-h-64 object-cover">
                    ${msg.message && msg.message !== '📷 Image' ? `<p class="text-sm mt-2">${escapeHtml(msg.message)}</p>` : ''}
                </div>
            `;
        } else if (msg.messageType === 'file' && msg.attachment) {
            const fileIcon = getFileIcon(msg.attachment.mimetype);
            const fileSize = formatFileSize(msg.attachment.size);
            messageContent = `
                <a href="${msg.attachment.url}" download="${msg.attachment.originalName}" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div class="text-3xl">${fileIcon}</div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">${escapeHtml(msg.attachment.originalName)}</p>
                        <p class="text-xs opacity-75">${fileSize}</p>
                    </div>
                    <i class="fas fa-download"></i>
                </a>
            `;
        } else {
            messageContent = `<p class="break-words whitespace-pre-wrap">${escapeHtml(msg.message)}</p>`;
        }
        
        // RENDER LOGIC: Current user RIGHT (no avatar), Others LEFT (with avatar)
        if (isCurrentUser) {
            // YOUR MESSAGES - RIGHT SIDE, NO AVATAR
            return `
                <div class="flex justify-end mb-3 animate-message-in">
                    <div class="flex flex-col items-end max-w-[75%] sm:max-w-[65%]">
                        <div class="message-bubble message-sent">
                            ${messageContent}
                            <div class="flex items-center justify-end gap-1 mt-1">
                                <span class="text-[11px] opacity-80">${time}</span>
                                <i class="fas fa-check text-[11px] opacity-80"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // THEIR MESSAGES - LEFT SIDE, WITH AVATAR (profile picture or initials)
            const avatarContent = profilePicture 
                ? `<img src="${profilePicture}" alt="${senderName}" class="w-full h-full object-cover rounded-full">`
                : initials;
            
            return `
                <div class="flex gap-2 mb-3 animate-message-in items-start">
                    <!-- Avatar on the left -->
                    <div class="avatar-container flex-shrink-0">
                        ${avatarContent}
                    </div>
                    
                    <!-- Message content -->
                    <div class="flex flex-col items-start max-w-[75%] sm:max-w-[65%]">
                        <div class="message-bubble message-received">
                            ${messageContent}
                            <span class="text-[11px] opacity-60 mt-1 block">${time}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');
    
    // Scroll to bottom smoothly
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// Send message
async function sendMessage(event) {
    event.preventDefault();
    
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!message && !file) return;
    if (!currentChatBooking) return;
    
    try {
        const token = localStorage.getItem('token');
        
        if (file) {
            // Send file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bookingId', currentChatBooking);
            if (message) formData.append('message', message);
            
            const response = await fetch('/api/chat/send-file', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send file');
            }
            
            // Clear file input and preview
            fileInput.value = '';
            document.getElementById('filePreview').classList.add('hidden');
        } else {
            // Send text message
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bookingId: currentChatBooking,
                    message: message
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send message');
            }
        }
        
        input.value = '';
        // Reload messages after sending
        setTimeout(() => loadMessages(), 500);
    } catch (error) {
        console.error('Error sending message:', error);
        showToast(error.message || 'Failed to send message', 'error');
    }
}

// Toggle emoji picker
function toggleEmojiPicker() {
    showEmojiPicker = !showEmojiPicker;
    const picker = document.getElementById('emojiPicker');
    if (showEmojiPicker) {
        picker.classList.remove('hidden');
    } else {
        picker.classList.add('hidden');
    }
}

// Insert emoji
function insertEmoji(emoji) {
    const input = document.getElementById('chatInput');
    input.value += emoji;
    input.focus();
}

// Trigger file input
function triggerFileInput() {
    document.getElementById('fileInput').click();
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const preview = document.getElementById('filePreview');
    const previewContent = document.getElementById('filePreviewContent');
    
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContent.innerHTML = `
                <img src="${e.target.result}" class="max-h-20 rounded">
                <span class="text-sm">${file.name}</span>
                <button onclick="clearFileSelection()" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-times"></i>
                </button>
            `;
        };
        reader.readAsDataURL(file);
    } else {
        const icon = getFileIcon(file.type);
        previewContent.innerHTML = `
            <span class="text-2xl">${icon}</span>
            <span class="text-sm">${file.name}</span>
            <button onclick="clearFileSelection()" class="text-red-500 hover:text-red-700">
                <i class="fas fa-times"></i>
            </button>
        `;
    }
    
    preview.classList.remove('hidden');
}

// Clear file selection
function clearFileSelection() {
    document.getElementById('fileInput').value = '';
    document.getElementById('filePreview').classList.add('hidden');
}

// Get file icon based on mimetype
function getFileIcon(mimetype) {
    if (mimetype.includes('pdf')) return '📄';
    if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
    if (mimetype.includes('zip') || mimetype.includes('compressed')) return '📦';
    if (mimetype.includes('text')) return '📃';
    return '📎';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Open image in modal
function openImageModal(url) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4';
    modal.onclick = function() { modal.remove(); };
    modal.innerHTML = `
        <img src="${url}" class="max-w-full max-h-full object-contain">
        <button onclick="this.parentElement.remove()" class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300">
            <i class="fas fa-times"></i>
        </button>
    `;
    document.body.appendChild(modal);
}

// No auto-polling - Telegram style manual refresh

// Mark messages as read
async function markMessagesAsRead() {
    if (!currentChatBooking) return;
    
    try {
        const token = localStorage.getItem('token');
        await fetch(`/api/chat/mark-read/${currentChatBooking}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        updateUnreadCount();
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// Update unread count
async function updateUnreadCount() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/chat/unread-count', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        const badge = document.getElementById('chatUnreadBadge');
        
        if (badge) {
            if (data.count > 0) {
                badge.textContent = data.count > 99 ? '99+' : data.count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Error updating unread count:', error);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle mobile keyboard
function handleMobileKeyboard() {
    if (window.innerWidth <= 640) {
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.getElementById('chatMessages');
        
        // Scroll to bottom when keyboard opens
        chatInput.addEventListener('focus', () => {
            setTimeout(() => {
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }, 300);
        });
        
        // Handle iOS keyboard
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            chatInput.addEventListener('focus', () => {
                setTimeout(() => {
                    window.scrollTo(0, 0);
                    document.body.scrollTop = 0;
                }, 0);
            });
        }
    }
}

// Initialize chat on page load
document.addEventListener('DOMContentLoaded', () => {
    // Update unread count only once on load
    updateUnreadCount();
    
    // Close chat on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentChatBooking) {
            closeChatModal();
        }
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        if (currentChatBooking) {
            setTimeout(() => {
                const chatMessages = document.getElementById('chatMessages');
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }, 300);
        }
    });
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (currentChatBooking) {
                const chatMessages = document.getElementById('chatMessages');
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }
        }, 250);
    });
    
    // Add swipe down to close on mobile
    let touchStartY = 0;
    let touchEndY = 0;
    
    const chatModal = document.getElementById('chatModal');
    if (chatModal) {
        const chatContainer = chatModal.querySelector('div');
        
        chatContainer?.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        chatContainer?.addEventListener('touchmove', (e) => {
            touchEndY = e.touches[0].clientY;
        }, { passive: true });
        
        chatContainer?.addEventListener('touchend', () => {
            // Swipe down to close (only from top of chat)
            if (touchStartY < 100 && touchEndY - touchStartY > 100) {
                if (currentChatBooking) {
                    closeChatModal();
                }
            }
        });
    }
});


// View guide information
async function viewGuideInfo() {
    if (!currentChatBooking) return;
    
    const modal = document.getElementById('guideInfoModal');
    const content = document.getElementById('guideInfoContent');
    
    // Show modal with loading state
    modal.classList.remove('hidden');
    content.innerHTML = `
        <div class="text-center py-8">
            <i class="fas fa-spinner fa-spin text-4xl text-purple-600"></i>
            <p class="mt-2 text-gray-600 dark:text-gray-400">Loading guide information...</p>
        </div>
    `;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/chat/guide-info/${currentChatBooking}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to load guide information');
        }
        
        const guideInfo = await response.json();
        
        // Display guide information
        content.innerHTML = `
            <div class="space-y-6">
                <!-- Name -->
                <div class="flex items-start gap-3">
                    <div class="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        ${guideInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${escapeHtml(guideInfo.name)}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Professional Tour Guide</p>
                    </div>
                </div>

                <!-- Contact Information -->
                <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                    <h4 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <i class="fas fa-address-card text-purple-600"></i>
                        Contact Information
                    </h4>
                    ${guideInfo.email ? `
                        <div class="flex items-center gap-3 text-sm">
                            <i class="fas fa-envelope text-gray-500 w-5"></i>
                            <a href="mailto:${guideInfo.email}" class="text-purple-600 hover:text-purple-700 dark:text-purple-400">${escapeHtml(guideInfo.email)}</a>
                        </div>
                    ` : ''}
                    ${guideInfo.phone ? `
                        <div class="flex items-center gap-3 text-sm">
                            <i class="fas fa-phone text-gray-500 w-5"></i>
                            <a href="tel:${guideInfo.phone}" class="text-purple-600 hover:text-purple-700 dark:text-purple-400">${escapeHtml(guideInfo.phone)}</a>
                        </div>
                    ` : ''}
                    ${guideInfo.address ? `
                        <div class="flex items-start gap-3 text-sm">
                            <i class="fas fa-map-marker-alt text-gray-500 w-5 mt-1"></i>
                            <span class="text-gray-700 dark:text-gray-300">${escapeHtml(guideInfo.address)}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Experience -->
                ${guideInfo.experience ? `
                    <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                            <i class="fas fa-briefcase text-purple-600"></i>
                            Experience
                        </h4>
                        <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${escapeHtml(guideInfo.experience)}</p>
                    </div>
                ` : ''}

                <!-- Languages -->
                ${guideInfo.languages ? `
                    <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                            <i class="fas fa-language text-purple-600"></i>
                            Languages
                        </h4>
                        <p class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(guideInfo.languages)}</p>
                    </div>
                ` : ''}

                <!-- Certifications -->
                ${guideInfo.certifications ? `
                    <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                            <i class="fas fa-certificate text-purple-600"></i>
                            Certifications
                        </h4>
                        <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${escapeHtml(guideInfo.certifications)}</p>
                    </div>
                ` : ''}

                <!-- Availability -->
                ${guideInfo.availability ? `
                    <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                            <i class="fas fa-calendar-check text-purple-600"></i>
                            Availability
                        </h4>
                        <p class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(guideInfo.availability)}</p>
                    </div>
                ` : ''}

                <!-- Action Buttons -->
                <div class="flex gap-3 pt-4">
                    ${guideInfo.phone ? `
                        <a href="tel:${guideInfo.phone}" class="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-center">
                            <i class="fas fa-phone mr-2"></i>Call Guide
                        </a>
                    ` : ''}
                    ${guideInfo.email ? `
                        <a href="mailto:${guideInfo.email}" class="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-center">
                            <i class="fas fa-envelope mr-2"></i>Email Guide
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading guide info:', error);
        content.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-circle text-4xl text-red-500"></i>
                <p class="mt-2 text-gray-600 dark:text-gray-400">${error.message}</p>
                <button onclick="closeGuideInfoModal()" class="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
                    Close
                </button>
            </div>
        `;
    }
}

// Close guide info modal
function closeGuideInfoModal() {
    document.getElementById('guideInfoModal').classList.add('hidden');
}
