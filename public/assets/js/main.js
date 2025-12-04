// Application State
        let currentUser = null;
        let map = null;
        let userMarker = null;
        let touristMarkers = [];

        // Theme Management
        function initTheme() {
            const savedTheme = localStorage.getItem('theme') || 'light';
            // Add no-transition class to prevent animation on page load
            document.documentElement.classList.add('no-transition');
            
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            updateThemeIcon(savedTheme);
            
            // Remove no-transition class after a brief delay
            setTimeout(() => {
                document.documentElement.classList.remove('no-transition');
            }, 100);
        }

        function toggleTheme(event) {
            const isDark = document.documentElement.classList.contains('dark');
            const newTheme = isDark ? 'light' : 'dark';
            
            // Get button position for ripple effect
            const button = event?.target?.closest('button') || document.querySelector('[onclick*="toggleTheme"]');
            const rect = button?.getBoundingClientRect() || { left: window.innerWidth / 2, top: 50 };
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            // Create ripple overlay
            const overlay = document.createElement('div');
            overlay.className = 'fixed pointer-events-none z-[9999] theme-ripple';
            overlay.style.left = x + 'px';
            overlay.style.top = y + 'px';
            overlay.style.width = '100px';
            overlay.style.height = '100px';
            overlay.style.marginLeft = '-50px';
            overlay.style.marginTop = '-50px';
            overlay.style.borderRadius = '50%';
            overlay.style.background = newTheme === 'dark' 
                ? 'rgba(15, 23, 42, 0.95)'
                : 'rgba(255, 255, 255, 0.95)';
            
            document.body.appendChild(overlay);
            
            // Create full-screen fade overlay
            const fadeOverlay = document.createElement('div');
            fadeOverlay.className = 'fixed inset-0 pointer-events-none z-[9998]';
            fadeOverlay.style.background = newTheme === 'dark' 
                ? 'linear-gradient(135deg, rgba(88, 28, 135, 0.3), rgba(15, 23, 42, 0.5))'
                : 'linear-gradient(135deg, rgba(249, 168, 212, 0.2), rgba(255, 255, 255, 0.4))';
            fadeOverlay.style.opacity = '0';
            fadeOverlay.style.transition = 'opacity 0.5s ease-in-out';
            document.body.appendChild(fadeOverlay);
            
            // Trigger fade animation
            requestAnimationFrame(() => {
                fadeOverlay.style.opacity = '1';
            });
            
            // Switch theme during animation
            setTimeout(() => {
                if (newTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                
                localStorage.setItem('theme', newTheme);
                updateThemeIcon(newTheme);
            }, 250);
            
            // Clean up overlays
            setTimeout(() => {
                fadeOverlay.style.opacity = '0';
            }, 400);
            
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
                if (document.body.contains(fadeOverlay)) {
                    document.body.removeChild(fadeOverlay);
                }
                showToast(`Switched to ${newTheme} mode`, 'success');
            }, 900);
        }

        function updateThemeIcon(theme) {
            const themeIcon = document.getElementById('themeIcon');
            if (themeIcon) {
                themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }

        // Toast Notification Function
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            
            const bgColors = {
                success: 'bg-gradient-to-r from-green-500 to-emerald-600',
                error: 'bg-gradient-to-r from-red-500 to-rose-600',
                info: 'bg-gradient-to-r from-purple-500 to-purple-700'
            };
            
            const icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                info: 'fa-info-circle'
            };
            
            toast.className = `${bgColors[type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 transform transition-all duration-300 translate-x-full`;
            toast.innerHTML = `<i class="fas ${icons[type]} text-xl"></i><span class="font-semibold">${message}</span>`;
            container.appendChild(toast);
            
            setTimeout(() => toast.classList.remove('translate-x-full'), 100);
            
            setTimeout(() => {
                toast.classList.add('translate-x-full');
                setTimeout(() => {
                    if (container.contains(toast)) {
                        container.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        }

        // Tourist Spots with Coordinates
        const touristSpots = [
            {
                id: 1,
                name: "Malapascua Island",
                lat: 11.3333,
                lng: 124.1167,
                description: "Famous for thresher shark diving and pristine white sand beaches.",
                price: 4500,
                image: "img/resort/malapascua.jpg"
            },
            {
                id: 2,
                name: "Kandaya Resort",
                lat: 11.2698,
                lng: 124.00426,
                description: "Luxury beachfront resort with world-class amenities and stunning ocean views.",
                price: 8500,
                image: "img/resort/kandaya.jpg"
            },
            {
                id: 3,
                name: "Bantigue Cove",
                lat: 11.2800,
                lng: 124.0200,
                description: "Secluded cove with turquoise waters perfect for swimming and snorkeling.",
                price: 2800,
                image: "img/resort/bantigue.jpg"
            },
            {
                id: 4,
                name: "Carnaza Island",
                lat: 11.4167,
                lng: 124.0333,
                description: "Remote island paradise with untouched beaches and crystal-clear waters.",
                price: 3200,
                image: "img/resort/carnaza-island-cebu-boracay.jpg"
            },
            {
                id: 5,
                name: "Paypay Beach",
                lat: 11.2152,
                lng: 123.9762,
                description: "White sand beach ideal for sunset watching and beach activities.",
                price: 2000,
                image: "img/resort/paypay.webp"
            },
            {
                id: 6,
                name: "Monad Shoal",
                lat: 11.3500,
                lng: 124.1300,
                description: "World-renowned dive site for thresher sharks and manta rays.",
                price: 5500,
                image: "img/resort/thresher-shark.jpg"
            },
            {
                id: 7,
                name: "Daanbantayan Lighthouse",
                lat: 11.2517,
                lng: 123.9992,
                description: "Historic lighthouse with panoramic views of the coastline.",
                price: 1500,
                image: "img/resort/lighthouse.jpg"
            },
            {
                id: 8,
                name: "Gato Island",
                lat: 11.3200,
                lng: 124.1100,
                description: "Marine sanctuary famous for sea snakes, turtles, and vibrant coral reefs.",
                price: 3800,
                image: "img/resort/gato-island.jpg"
            },
            {
                id: 9,
                name: "Tapilon Point",
                lat: 11.2700,
                lng: 124.0300,
                description: "Scenic diving spot with diverse marine life and underwater caves.",
                price: 4200,
                image: "img/resort/tapilon.jpg"
            },
            {
                id: 10,
                name: "Calangaman Island",
                lat: 11.0833,
                lng: 124.0833,
                description: "Stunning sandbar island with crystal-clear waters, perfect for day trips.",
                price: 3500,
                image: "img/resort/calangaman.jpg"
            },
            {
                id: 11,
                name: "Maripipi Island",
                lat: 11.3800,
                lng: 124.0500,
                description: "Tranquil island getaway with pristine beaches and local culture.",
                price: 2500,
                image: "img/resort/maripipi.jpg"
            },
            {
                id: 12,
                name: "Chocolate Island",
                lat: 11.3100,
                lng: 124.1050,
                description: "Small island near Malapascua, perfect for snorkeling and diving.",
                price: 3000,
                image: "img/resort/chocolate.jpg"
            },
            {
                id: 13,
                name: "Daanbantayan Public Beach",
                lat: 11.2500,
                lng: 124.0000,
                description: "Local beach with affordable amenities and authentic Filipino atmosphere.",
                price: 800,
                image: "img/resort/public-beach.jpg"
            },
            {
                id: 14,
                name: "Tinago Beach",
                lat: 11.2450,
                lng: 123.9980,
                description: "Hidden gem beach with calm waters and natural rock formations.",
                price: 1800,
                image: "img/resort/tinago.webp"
            }
        ];

        // Bookings
        const bookings = [
            {
                id: 1,
                title: "Malapascua Island Resort",
                description: "Luxury beachfront accommodation with diving packages and pristine white sand beaches",
                price: 4500,
                image: "img/resort/malapascua.jpg",
                location: "Malapascua Island"
            },
            {
                id: 2,
                title: "Kandaya Resort Luxury Stay",
                description: "5-star beachfront resort with infinity pools, spa, fine dining, and world-class service",
                price: 8500,
                image: "img/resort/kandaya.jpg",
                location: "Kandaya Resort"
            },
            {
                id: 3,
                title: "Bantigue Cove Experience",
                description: "Secluded cove with crystal clear waters perfect for snorkeling and relaxation",
                price: 2800,
                image: "img/resort/bantigue.jpg",
                location: "Bantigue Cove"
            },
            {
                id: 4,
                title: "Carnaza Island Adventure",
                description: "Island hopping with local guides, fresh seafood, and cultural experiences",
                price: 3200,
                image: "img/resort/carnaza-island-cebu-boracay.jpg",
                location: "Carnaza Island"
            },
            {
                id: 5,
                title: "Paypay Beach Getaway",
                description: "White sand beach perfect for relaxation, swimming, and sunset watching",
                price: 2000,
                image: "img/resort/paypay.webp",
                location: "Paypay Beach"
            },
            {
                id: 6,
                title: "Thresher Shark Diving",
                description: "World-famous diving experience with thresher sharks at Monad Shoal",
                price: 5500,
                image: "img/resort/thresher-shark.jpg",
                location: "Monad Shoal"
            },
            {
                id: 7,
                title: "Lighthouse Heritage Tour",
                description: "Historical lighthouse with panoramic views and cultural significance",
                price: 1500,
                image: "img/resort/lighthouse.jpg",
                location: "Daanbantayan Lighthouse"
            },
            {
                id: 8,
                title: "Gato Island Marine Sanctuary",
                description: "Snorkeling and diving adventure with sea snakes, turtles, and vibrant coral gardens",
                price: 3800,
                image: "img/resort/gato-island.jpg",
                location: "Gato Island"
            },
            {
                id: 9,
                title: "Tapilon Point Diving",
                description: "Explore underwater caves and diverse marine life at this scenic diving spot",
                price: 4200,
                image: "img/resort/tapilon.jpg",
                location: "Tapilon Point"
            },
            {
                id: 10,
                title: "Calangaman Island Day Trip",
                description: "Visit the stunning sandbar island with crystal-clear waters and white sand beaches",
                price: 3500,
                image: "img/resort/calangaman.jpg",
                location: "Calangaman Island"
            },
            {
                id: 11,
                title: "Maripipi Island Escape",
                description: "Peaceful island retreat with pristine beaches and authentic local culture",
                price: 2500,
                image: "img/resort/maripipi.jpg",
                location: "Maripipi Island"
            },
            {
                id: 12,
                title: "Chocolate Island Snorkeling",
                description: "Small island adventure near Malapascua, perfect for snorkeling enthusiasts",
                price: 3000,
                image: "img/resort/chocolate.jpg",
                location: "Chocolate Island"
            },
            {
                id: 13,
                title: "Daanbantayan Public Beach",
                description: "Budget-friendly beach experience with local amenities and authentic atmosphere",
                price: 800,
                image: "img/resort/public-beach.jpg",
                location: "Daanbantayan Public Beach"
            },
            {
                id: 14,
                title: "Tinago Beach Discovery",
                description: "Hidden beach paradise with calm waters and unique natural rock formations",
                price: 1800,
                image: "img/resort/tinago.webp",
                location: "Tinago Beach"
            }
        ];

        function loadBookings(filteredBookings = bookings) {
            const bookingGrid = document.getElementById('bookingGrid');
            bookingGrid.innerHTML = filteredBookings.map(booking => `
                <div class="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700">
                    <div class="relative h-56 bg-gradient-to-br from-purple-400 to-purple-600 overflow-hidden">
                        <img src="${booking.image}" alt="${booking.title}" class="w-full h-full object-cover" onerror="this.src='img/placeholder.jpg';">
                        <div class="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            ₱${booking.price.toLocaleString()}
                        </div>
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">${booking.title}</h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">${booking.description}</p>
                        <div class="flex items-center justify-between">
                            <span class="text-2xl font-bold text-purple-600 dark:text-purple-400">₱${booking.price.toLocaleString()}<span class="text-sm text-gray-500 dark:text-gray-400">/night</span></span>
                            <button onclick="selectBooking(${booking.id})" class="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2">
                                <i class="fas fa-calendar-check"></i> Book
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Fetch Platform Statistics
        async function fetchStats() {
            try {
                console.log('Fetching stats from /api/stats...');
                const response = await fetch('/api/stats');
                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Stats data received:', data);
                
                if (data.success && data.stats) {
                    const stats = data.stats;
                    
                    // Animate counter for tourist spots
                    animateCounter('statTouristSpots', stats.touristSpots, '+');
                    
                    // Animate counter for total tourists
                    animateCounter('statTotalTourists', stats.totalTourists, '+');
                    
                    // Display average rating
                    const ratingEl = document.getElementById('statAverageRating');
                    if (ratingEl) ratingEl.textContent = stats.averageRating;
                    
                    // Animate counter for total guides
                    animateCounter('statTotalGuides', stats.totalGuides, '+');
                } else {
                    console.warn('Stats data not in expected format:', data);
                    setDefaultStats();
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
                setDefaultStats();
            }
        }

        // Set default stats values
        function setDefaultStats() {
            const statTouristSpots = document.getElementById('statTouristSpots');
            const statTotalTourists = document.getElementById('statTotalTourists');
            const statAverageRating = document.getElementById('statAverageRating');
            const statTotalGuides = document.getElementById('statTotalGuides');
            
            if (statTouristSpots) statTouristSpots.textContent = '15+';
            if (statTotalTourists) statTotalTourists.textContent = '500+';
            if (statAverageRating) statAverageRating.textContent = '4.9';
            if (statTotalGuides) statTotalGuides.textContent = '20+';
        }

        // Animate counter with number increment
        function animateCounter(elementId, targetValue, suffix = '') {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            const duration = 2000; // 2 seconds
            const steps = 60;
            const increment = targetValue / steps;
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= targetValue) {
                    element.textContent = targetValue + suffix;
                    clearInterval(timer);
                } else {
                    element.textContent = Math.floor(current) + suffix;
                }
            }, duration / steps);
        }

        // Initialize App
        document.addEventListener('DOMContentLoaded', function() {
            initTheme();
            fetchStats();
            
            const checkinDate = document.getElementById('checkin');
            const checkoutDate = document.getElementById('checkout');
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (checkinDate) checkinDate.valueAsDate = today;
            if (checkoutDate) checkoutDate.valueAsDate = tomorrow;

            currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
            updateAuthButtons();
            loadBookings();
            initLeafletMap();
        });

        // Initialize Leaflet Map
        function initLeafletMap() {
            try {
                const daanbantayanCenter = [11.2517, 123.9992];
                map = L.map('map').setView(daanbantayanCenter, 11);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 18
                }).addTo(map);

                const touristIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 5px 15px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                        <span style="transform: rotate(45deg); font-size: 20px;">📍</span>
                    </div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                    popupAnchor: [0, -40]
                });

                touristSpots.forEach(spot => {
                    const marker = L.marker([spot.lat, spot.lng], { icon: touristIcon }).addTo(map);
                    const popupContent = `
                        <div style="padding: 0;">
                            <img src="${spot.image}" alt="${spot.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 10px 10px 0 0;" onerror="this.src='img/placeholder.jpg';">
                            <div style="padding: 1rem;">
                                <div style="font-size: 1.2rem; font-weight: bold; color: #667eea; margin-bottom: 0.5rem;">${spot.name}</div>
                                <div style="font-size: 0.9rem; color: #666; margin-bottom: 0.8rem; line-height: 1.4;">${spot.description}</div>
                                <div style="font-size: 1.3rem; font-weight: bold; color: #11998e; margin-bottom: 0.8rem;">₱${spot.price.toLocaleString()}/night</div>
                                <button onclick="selectBooking(${spot.id})" style="width: 100%; padding: 0.6rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Book Now</button>
                            </div>
                        </div>
                    `;
                    marker.bindPopup(popupContent, { maxWidth: 280 });
                    touristMarkers.push(marker);
                });
            } catch (error) {
                console.error('Map init error:', error);
            }
        }

        // Get User Location
        function getUserLocation() {
            if (!navigator.geolocation) {
                showToast('Geolocation is not supported by your browser', 'error');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;

                    if (userMarker) map.removeLayer(userMarker);

                    const userIcon = L.divIcon({
                        className: 'user-location-icon',
                        html: `<div style="background: #4285f4; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });

                    userMarker = L.marker([userLat, userLng], { icon: userIcon })
                        .addTo(map)
                        .bindPopup('<strong>You are here!</strong>')
                        .openPopup();

                    map.setView([userLat, userLng], 13);

                    L.circle([userLat, userLng], {
                        radius: position.coords.accuracy,
                        color: '#4285f4',
                        fillColor: '#4285f4',
                        fillOpacity: 0.1,
                        weight: 1
                    }).addTo(map);

                    showToast('Location found!', 'success');
                },
                function(error) {
                    let errorMessage = 'Unable to retrieve your location. ';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage += 'Please allow location access.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage += 'Location information unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMessage += 'Request timed out.';
                            break;
                    }
                    showToast(errorMessage, 'error');
                }
            );
        }

        // Reset Map View
        function resetMapView() {
            const daanbantayanCenter = [11.2517, 123.9992];
            map.setView(daanbantayanCenter, 11);
            if (userMarker) {
                map.removeLayer(userMarker);
                userMarker = null;
            }
        }

        // Authentication Functions
        function showLogin() {
            document.getElementById('loginModal').classList.remove('hidden');
        }

        function showRegister() {
            document.getElementById('registerModal').classList.remove('hidden');
        }

        function showForgotPassword() {
            closeModal('loginModal');
            document.getElementById('forgotPasswordModal').classList.remove('hidden');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.add('hidden');
        }

        async function handleLogin(e) {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            setButtonLoading(submitBtn, true);

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Login failed');
                
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('token', data.token);
                showToast('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    showPageLoading();
                    window.location.href = currentUser.role === 'admin' ? 'admin_dashboard.html' : (currentUser.role === 'tourguide' ? 'tour_guide.html' : 'user_dashboard.html');
                }, 1000);
            } catch (error) {
                setButtonLoading(submitBtn, false);
                showToast(error.message, 'error');
            }
        }

        async function handleForgotPassword(e) {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            setButtonLoading(submitBtn, true);

            const email = document.getElementById('forgotEmail').value;

            try {
                const response = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Failed to send reset link');
                showToast(data.message, 'success');
                setTimeout(() => {
                    closeModal('forgotPasswordModal');
                    setButtonLoading(submitBtn, false);
                }, 1500);
            } catch (error) {
                setButtonLoading(submitBtn, false);
                showToast(error.message, 'error');
            }
        }

        async function handleRegister(e) {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const phone = document.getElementById('registerPhone').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                showToast('Passwords do not match!', 'error');
                submitBtn.classList.add('shake');
                setTimeout(() => submitBtn.classList.remove('shake'), 500);
                return;
            }

            setButtonLoading(submitBtn, true);

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, phone })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Registration failed');

                showToast(data.message || 'Registration successful! Please check your email.', 'success');
                setTimeout(() => {
                    closeModal('registerModal');
                    setButtonLoading(submitBtn, false);
                }, 1500);
            } catch (error) {
                setButtonLoading(submitBtn, false);
                showToast(error.message, 'error');
            }
        }

        async function handleContactForm(e) {
            e.preventDefault();
            
            const sendBtn = document.getElementById('sendMessageBtn');
            setButtonLoading(sendBtn, true);
            
            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            const subject = document.getElementById('contactSubject').value;
            const message = document.getElementById('contactMessage').value;

            try {
                const response = await fetch('/api/contact/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, subject, message })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to send message');
                }

                showToast(data.message || 'Message sent successfully!', 'success');
                e.target.reset();
            } catch (error) {
                showToast(error.message || 'Failed to send message. Please try again.', 'error');
            } finally {
                setButtonLoading(sendBtn, false);
            }
        }

        function logout() {
            currentUser = null;
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            updateAuthButtons();
            showToast('Logged out successfully', 'success');
        }

        function updateAuthButtons() {
            const authButtons = document.getElementById('authButtons');
            const isDark = document.documentElement.classList.contains('dark');
            const themeIcon = isDark ? 'fa-sun' : 'fa-moon';
            
            if (currentUser) {
                authButtons.innerHTML = `
                    <button onclick="toggleTheme(event)" class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-300 hover:rotate-180">
                        <i class="fas ${themeIcon}" id="themeIcon"></i>
                    </button>
                    <span class="hidden md:block text-white font-semibold">Welcome, ${currentUser.name}!</span>
                    <a href="${currentUser.role === 'admin' ? 'admin_dashboard.html' : (currentUser.role === 'tourguide' ? 'tour_guide.html' : 'user_dashboard.html')}" class="hidden sm:flex items-center gap-2 px-4 py-2 text-white border-2 border-white/30 rounded-lg hover:bg-white/20 transition-all duration-200">
                        <i class="fas fa-tachometer-alt"></i> Dashboard
                    </a>
                    <button onclick="logout()" class="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                `;
            } else {
                authButtons.innerHTML = `
                    <button onclick="toggleTheme(event)" class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-300 hover:rotate-180">
                        <i class="fas ${themeIcon}" id="themeIcon"></i>
                    </button>
                    <button onclick="showLogin()" class="hidden sm:block px-4 py-2 text-white border-2 border-white/30 rounded-lg hover:bg-white/20 transition-all duration-200">
                        Login
                    </button>
                    <button onclick="showRegister()" class="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200">
                        Sign Up
                    </button>
                `;
            }
        }

        // Booking Functions
        function searchBookings() {
            const destination = document.getElementById('destination').value.toLowerCase();
            const filteredBookings = bookings.filter(booking => 
                !destination || booking.location.toLowerCase().includes(destination)
            );
            loadBookings(filteredBookings);
            document.getElementById('bookingsSection').scrollIntoView({ behavior: 'smooth' });
        }

        function selectBooking(bookingId) {
            if (!currentUser) {
                showToast('Please login to make a booking', 'error');
                showLogin();
                return;
            }
            const selectedBooking = bookings.find(b => b.id === bookingId);
            localStorage.setItem('selectedBooking', JSON.stringify(selectedBooking));
            window.location.href = 'booking.html';
        }

        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Navbar scroll effect
        window.addEventListener('scroll', function() {
            const navbar = document.getElementById('navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Close modals when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target.id === 'loginModal' || e.target.id === 'registerModal' || e.target.id === 'forgotPasswordModal') {
                e.target.classList.add('hidden');
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('[id$="Modal"]').forEach(modal => modal.classList.add('hidden'));
            }
        });