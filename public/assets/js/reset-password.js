const urlParams = new URLSearchParams(window.location.search);
        document.getElementById('resetToken').value = urlParams.get('token');

        function togglePassword() {
            const passwordInput = document.getElementById('newPassword');
            const toggleIcon = document.querySelector('.password-toggle');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.classList.remove('fa-eye');
                toggleIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                toggleIcon.classList.remove('fa-eye-slash');
                toggleIcon.classList.add('fa-eye');
            }
        }

        function checkPasswordStrength() {
            const password = document.getElementById('newPassword').value;
            const strengthBar = document.getElementById('passwordStrengthBar');
            const strengthContainer = document.getElementById('passwordStrength');
            
            let strength = 0;
            const requirements = {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /[0-9]/.test(password)
            };

            if (password.length > 0) {
                strengthContainer.style.display = 'block';
            } else {
                strengthContainer.style.display = 'none';
            }

            Object.keys(requirements).forEach(req => {
                const element = document.getElementById(`req-${req}`);
                if (requirements[req]) {
                    strength += 25;
                    element.classList.add('met');
                    element.querySelector('i').className = 'fas fa-check-circle';
                } else {
                    element.classList.remove('met');
                    element.querySelector('i').className = 'far fa-circle';
                }
            });

            strengthBar.style.width = strength + '%';
            
            if (strength <= 25) {
                strengthBar.style.background = 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)';
            } else if (strength <= 50) {
                strengthBar.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
            } else if (strength <= 75) {
                strengthBar.style.background = 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)';
            } else {
                strengthBar.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
            }

            return strength === 100;
        }

        function showAlert(message, type) {
            const alertBox = document.getElementById('alertBox');
            const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
            alertBox.innerHTML = `
                <div class="alert alert-${type}">
                    <i class="fas fa-${icon}"></i>
                    <span>${message}</span>
                </div>
            `;
        }

        async function handleResetPassword(e) {
            e.preventDefault();
            
            const token = document.getElementById('resetToken').value;
            const newPassword = document.getElementById('newPassword').value;

            if (!checkPasswordStrength()) {
                showAlert('Please meet all password requirements', 'error');
                return;
            }

            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting Password...';

            try {
                const response = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to reset password');
                }

                showAlert(data.message || 'Password reset successfully!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'index.html#login';
                }, 2000);
                
            } catch (error) {
                showAlert(error.message, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }

        // Check if token exists
        if (!urlParams.get('token')) {
            showAlert('Invalid or missing reset token. Please request a new password reset link.', 'error');
            document.getElementById('submitBtn').disabled = true;
        }