async function verifyEmail() {
            const token = window.location.pathname.split('/').pop();
            const iconEl = document.getElementById('verificationIcon');
            const titleEl = document.getElementById('verificationTitle');
            const messageEl = document.getElementById('verificationMessage');
            const spinnerEl = document.getElementById('loadingSpinner');
            const buttonEl = document.getElementById('continueButton');

            try {
                const response = await fetch(`/api/auth/verify/${token}`);
                const data = await response.json();
                
                if (!response.ok) throw new Error(data.error || 'Verification failed');

                // Success
                spinnerEl.style.display = 'none';
                iconEl.className = 'verification-icon success';
                iconEl.innerHTML = '<i class="fas fa-check"></i>';
                titleEl.textContent = 'Email Verified Successfully!';
                messageEl.className = 'success';
                messageEl.innerHTML = `
                    <strong>Welcome aboard!</strong><br>
                    Your account is now active and ready to use.
                `;

                // Create success details box
                const detailsBox = document.createElement('div');
                detailsBox.className = 'details-box';
                detailsBox.innerHTML = `
                    <p><i class="fas fa-user"></i> <strong>Account:</strong> ${data.user?.name || 'User'}</p>
                    <p><i class="fas fa-envelope"></i> <strong>Email:</strong> ${data.user?.email || 'N/A'}</p>
                    <p><i class="fas fa-check-circle"></i> <strong>Status:</strong> Verified</p>
                `;
                messageEl.parentNode.insertBefore(detailsBox, buttonEl);

                buttonEl.style.display = 'inline-flex';
                
                // Auto redirect after 3 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);

            } catch (error) {
                // Error
                spinnerEl.style.display = 'none';
                iconEl.className = 'verification-icon error';
                iconEl.innerHTML = '<i class="fas fa-times"></i>';
                titleEl.textContent = 'Verification Failed';
                messageEl.className = 'error';
                messageEl.innerHTML = `
                    <strong>Oops! Something went wrong.</strong><br>
                    ${error.message || 'Unable to verify your email address.'}
                `;

                const detailsBox = document.createElement('div');
                detailsBox.className = 'details-box';
                detailsBox.style.borderLeftColor = '#dc2626';
                detailsBox.innerHTML = `
                    <p><i class="fas fa-exclamation-triangle"></i> The verification link may have expired or is invalid.</p>
                    <p><i class="fas fa-info-circle"></i> Please try registering again or contact support.</p>
                `;
                messageEl.parentNode.insertBefore(detailsBox, buttonEl);

                buttonEl.style.display = 'inline-flex';
            }
        }

        document.addEventListener('DOMContentLoaded', verifyEmail);