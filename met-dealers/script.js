/* ============================
   ZWARTE KRAAI - B2B Intake Form
   Form handling & webhook submit
   ============================ */

(function() {
    'use strict';

    const WEBHOOK_URL = 'https://hook.eu2.make.com/bpagfr0l59xal8uqyyh35ya2vmxgu3fo';

    const form = document.getElementById('intakeForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const successMessage = document.getElementById('successMessage');
    const progressFill = document.getElementById('progressFill');

    // Calculate and update progress based on all inputs
    function updateProgress() {
        const allInputs = form.querySelectorAll('input, textarea');
        let filled = 0;

        allInputs.forEach(input => {
            if (input.value.trim() !== '') {
                filled++;
            }
        });

        const progress = (filled / allInputs.length) * 100;
        progressFill.style.width = progress + '%';
    }

    // Add progress listeners to all inputs
    form.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', updateProgress);
        input.addEventListener('change', updateProgress);
    });

    // Pre-fill form fields from URL parameters (optional)
    function prefillFromURL() {
        const params = new URLSearchParams(window.location.search);

        // List of fields that can be pre-filled via URL
        const prefillFields = [
            'bedrijfsnaam',
            'contactpersoon',
            'email',
            'ltv',
            'unieke_klanten_2025',
            'orders_2025'
        ];

        prefillFields.forEach(fieldName => {
            const value = params.get(fieldName);
            if (value) {
                const input = document.getElementById(fieldName);
                if (input) {
                    input.value = decodeURIComponent(value);
                }
            }
        });
    }

    // Run prefill on page load
    prefillFromURL();

    // Initial progress calculation
    updateProgress();

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Disable button and show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';

        // Collect form data
        const formData = new FormData(form);
        const data = {};

        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Handle "Overig" fields - combine select value with custom input
        if (data.crm_systeem === 'Overig' && data.crm_systeem_overig) {
            data.crm_systeem = 'Overig: ' + data.crm_systeem_overig;
        }
        if (data.boekhoudsysteem === 'Overig' && data.boekhoudsysteem_overig) {
            data.boekhoudsysteem = 'Overig: ' + data.boekhoudsysteem_overig;
        }

        // Add metadata
        data.submitted_at = new Date().toISOString();
        data.form_type = 'b2b_intake';

        try {
            // Send to webhook
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok || response.status === 200) {
                // Success
                form.style.display = 'none';
                successMessage.style.display = 'block';
                progressFill.style.width = '100%';

                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                throw new Error('Server responded with status: ' + response.status);
            }
        } catch (error) {
            console.error('Form submission error:', error);

            // Show error state
            alert('Er is iets misgegaan bij het versturen. Probeer het opnieuw of neem contact met ons op.');

            // Reset button
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    });

    // Email validation only (no required field validation needed)

    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value && !emailRegex.test(this.value)) {
                this.classList.add('error');
            }
        });
    }

})();

// Toggle "Overig" text field for CRM and Boekhoudsysteem
function toggleOtherField(type) {
    const selectId = type === 'crm' ? 'crm_systeem' : 'boekhoudsysteem';
    const inputId = type === 'crm' ? 'crm_systeem_overig' : 'boekhoudsysteem_overig';

    const select = document.getElementById(selectId);
    const input = document.getElementById(inputId);

    if (select.value === 'Overig') {
        input.style.display = 'block';
        input.focus();
    } else {
        input.style.display = 'none';
        input.value = '';
    }
}
