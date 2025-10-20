// Application State
        let currentUser = null;
        let map = null;
        let userMarker = null;
        let touristMarkers = [];

        // Toast Notification Function
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i><span>${message}</span>`;
            container.appendChild(toast);
            toast.offsetHeight;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
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
                name: "Bantigue Cove",
                lat: 11.2800,
                lng: 124.0200,
                description: "Secluded cove with turquoise waters perfect for swimming.",
                price: 2800,
                image: "img/resort/bantigue.jpg"
            },
            {
                id: 3,
                name: "Carnaza Island",
                lat: 11.4167,
                lng: 124.0333,
                description: "Remote island paradise with untouched beaches.",
                price: 3200,
                image: "img/resort/carnaza-island-cebu-boracay.jpg"
            },
            {
                id: 4,
                name: "Paypay Beach",
                lat: 11.2600,
                lng: 124.0100,
                description: "White sand beach ideal for sunset watching.",
                price: 2000,
                image: "img/resort/paypay.webp"
            },
            {
                id: 5,
                name: "Monad Shoal",
                lat: 11.3500,
                lng: 124.1300,
                description: "World-renowned dive site for thresher sharks.",
                price: 5500,
                image: "img/resort/thresher-shark.jpg"
            },
            {
                id: 6,
                name: "Daanbantayan Lighthouse",
                lat: 11.2517,
                lng: 123.9992,
                description: "Historic lighthouse with panoramic views.",
                price: 1500,
                image: "img/resort/lighthouse.jpg"
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
                title: "Bantigue Cove Experience",
                description: "Secluded cove with crystal clear waters perfect for snorkeling and relaxation",
                price: 2800,
                image: "img/resort/bantigue.jpg",
                location: "Bantigue Cove"
            },
            {
                id: 3,
                title: "Carnaza Island Adventure",
                description: "Island hopping with local guides, fresh seafood, and cultural experiences",
                price: 3200,
                image: "img/resort/carnaza-island-cebu-boracay.jpg",
                location: "Carnaza Island"
            },
            {
                id: 4,
                title: "Paypay Beach Getaway",
                description: "White sand beach perfect for relaxation, swimming, and sunset watching",
                price: 2000,
                image: "img/resort/paypay.webp",
                location: "Paypay Beach"
            },
            {
                id: 5,
                title: "Thresher Shark Diving",
                description: "World-famous diving experience with thresher sharks at Monad Shoal",
                price: 5500,
                image: "img/resort/thresher-shark.jpg",
                location: "Monad Shoal"
            },
            {
                id: 6,
                title: "Lighthouse Heritage Tour",
                description: "Historical lighthouse with panoramic views and cultural significance",
                price: 1500,
                image: "img/resort/lighthouse.jpg",
                location: "Daanbantayan Lighthouse"
            }
        ];

        function loadBookings(filteredBookings = bookings) {
            const bookingGrid = document.getElementById('bookingGrid');
            bookingGrid.innerHTML = filteredBookings.map(booking => `
                <div class="booking-card">
                    <div class="booking-image">
                        <img src="${booking.image}" alt="${booking.title}" onerror="this.src='img/placeholder.jpg';">
                    </div>
                    <div class="booking-content">
                        <div class="booking-title">${booking.title}</div>
                        <p class="booking-description">${booking.description}</p>
                        <div class="booking-price">₱${booking.price.toLocaleString()}/night</div>
                        <button class="btn btn-primary" onclick="selectBooking(${booking.id})" style="width: 100%;">
                            <i class="fas fa-calendar-check"></i> Book Now
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Initialize App
        document.addEventListener('DOMContentLoaded', function() {
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
            document.getElementById('loginModal').style.display = 'flex';
        }

        function showRegister() {
            document.getElementById('registerModal').style.display = 'flex';
        }

        function showForgotPassword() {
            closeModal('loginModal');
            document.getElementById('forgotPasswordModal').style.display = 'flex';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        async function handleLogin(e) {
            e.preventDefault();
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
                closeModal('loginModal');
                window.location.href = currentUser.role === 'admin' ? 'admin_dashboard.html' : (currentUser.role === 'tourguide' ? 'tour_guide.html' : 'user_dashboard.html');
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        async function handleForgotPassword(e) {
            e.preventDefault();
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
                closeModal('forgotPasswordModal');
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        async function handleRegister(e) {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const phone = document.getElementById('registerPhone').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                showToast('Passwords do not match!', 'error');
                return;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, phone })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Registration failed');

                showToast(data.message || 'Registration successful! Please check your email.', 'success');
                closeModal('registerModal');
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        async function handleContactForm(e) {
            e.preventDefault();
            
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
            if (currentUser) {
                authButtons.innerHTML = `
                    <span style="color: white; font-weight: 500;">Welcome, ${currentUser.name}!</span>
                    <a href="${currentUser.role === 'admin' ? 'admin_dashboard.html' : (currentUser.role === 'tourguide' ? 'tour_guide.html' : 'user_dashboard.html')}" class="btn btn-secondary">
                        <i class="fas fa-tachometer-alt"></i> Dashboard
                    </a>
                    <button class="btn btn-primary" onclick="logout()" style="border: none;">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                `;
            } else {
                authButtons.innerHTML = `
                    <a href="#" class="btn btn-secondary" onclick="showLogin()">Login</a>
                    <a href="#" class="btn btn-primary" onclick="showRegister()">Sign Up</a>
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
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
            }
        });