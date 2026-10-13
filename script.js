document.addEventListener("DOMContentLoaded", () => {
    
    // ==================================================
    // MOBILE NAVIGATION TOGGLE (Preserved from Source 4)
    // ==================================================
    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (navToggle && navLinks) {
        navToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("open");
            navToggle.classList.toggle("open", isOpen);
            navToggle.setAttribute("aria-expanded", isOpen);
        });

        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("open");
                navToggle.classList.remove("open");
                navToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    // ==================================================
    // SCROLL REVEAL TIMING ENGINE (Preserved from Source 4)
    // ==================================================
    const scrollElements = document.querySelectorAll(".reveal-on-scroll");
    const elementObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                elementObserver.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    scrollElements.forEach(el => elementObserver.observe(el));

    // ==================================================
    // CONTACT FORM VALIDATION & STORAGE SUBMIT PIPELINE
    // ==================================================
    const form = document.getElementById("contact-form");

    if (form) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const submitBtn = form.querySelector(".contact-submit");
        const successBox = document.getElementById("form-success");
        const messageInput = document.getElementById("message");
        const messageCount = document.getElementById("message-count");
        const formStatus = document.getElementById("form-status");

        // 1. INPUT CONSTRAINT BOUNDARY VALIDATION RULES
        const rules = {
            name: value => {
                if (!value) return "Please tell us your name.";
                if (value.length > 30) return "Name cannot exceed 30 characters.";
                return "";
            },
            email: value => {
                if (!value) return "We need your email to reply.";
                if (!emailRegex.test(value)) return "That email doesn't look quite right.";
                return "";
            },
            topic: () => {
                const selectedTopic = form.querySelector('input[name="topic"]:checked');
                if (!selectedTopic) return "Please select a message topic.";
                return "";
            },
            phone: value => {
                if (value) {
                    if (!/^[0-9().\s-]+$/.test(value) || value.replace(/\D/g, "").length !== 10) {
                        return "Please enter exactly 10 digits for your phone number.";
                    }
                }
                return "";
            },
            message: value => {
                if (!value) return "Please write a short message.";
                if (value.length < 10) return "A little more detail helps us (10+ characters).";
                return "";
            }
        };

        // 2. RUNNER FIELD VALIDATION CONTROLLER
        const validateField = id => {
            const errorElement = document.getElementById(`${id}-error`);
            
            if (id === 'topic') {
                const errorMessage = rules.topic();
                if (errorElement) errorElement.textContent = errorMessage;
                return !errorMessage;
            }

            const inputElement = document.getElementById(id);
            if (!inputElement) return true;

            const errorMessage = rules[id](inputElement.value.trim());

            if (errorElement) errorElement.textContent = errorMessage;
            inputElement.classList.toggle("is-invalid", Boolean(errorMessage));
            inputElement.classList.toggle("is-valid", !errorMessage);
            inputElement.setAttribute("aria-invalid", Boolean(errorMessage));
            return !errorMessage;
        };

        // 3. ATTACH REAL-TIME DYNAMIC INPUT ENGINE TRACKERS
        Object.keys(rules).forEach(id => {
            if (id === 'topic') {
                form.querySelectorAll('input[name="topic"]').forEach(radio => {
                    radio.addEventListener("change", () => validateField("topic"));
                });
                return;
            }

            const input = document.getElementById(id);
            if (!input) return;

            input.addEventListener("blur", () => {
                if (input.value.trim()) validateField(id);
            });
            input.addEventListener("input", () => {
                if (input.classList.contains("is-invalid") || input.classList.contains("is-valid")) {
                    validateField(id);
                }
            });
        });

        // Sync local character counter dashboard text layouts
        messageInput.addEventListener("input", () => {
            messageCount.textContent = messageInput.value.length;
        });

        const resetForm = () => {
            form.reset();
            messageCount.textContent = "0";
            form.querySelectorAll(".is-valid, .is-invalid").forEach(el => {
                el.classList.remove("is-valid", "is-invalid");
                el.removeAttribute("aria-invalid");
            });
            const topicError = document.getElementById("topic-error");
            if (topicError) topicError.textContent = "";
            form.querySelectorAll(".field-error").forEach(el => (el.textContent = ""));
        };

    
        // ==================================================
        // 5. MASTER SECURE TRANSMISSION INTERCEPT EVENT ROUTER (v2 Checkbox)
        // ==================================================
        form.addEventListener("submit", async (event) => {
            event.preventDefault(); 

            // Execute input fields constraint validation
            const isNameValid = validateField("name");
            const isEmailValid = validateField("email");
            const isTopicValid = validateField("topic");
            const isPhoneValid = validateField("phone");
            const isMessageValid = validateField("message");

            if (!isNameValid || !isEmailValid || !isTopicValid || !isPhoneValid || !isMessageValid) {
                const firstInvalid = form.querySelector(".is-invalid");
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            // SECURITY CONTROL: INVISIBLE HONEYPOT FILTER
            const honeyField = document.getElementById("pot_of_honey").value;
            if (honeyField !== "") {
                resetForm();
                form.classList.add("is-submitted");
                successBox.hidden = false;
                return;
            }

            submitBtn.classList.add("is-loading");
            submitBtn.disabled = true;

            try {
                const formData = new FormData(form);
                ["name", "email", "phone", "message"].forEach(id => {
                    const field = document.getElementById(id);
                    formData.set(id, field.value.trim());
                });
                const response = await fetch(form.action, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(Object.fromEntries(formData.entries()))
                });
                if (!response.ok) {
                    throw new Error(`SheetMonkey returned HTTP ${response.status}.`);
                }

                const rawName = document.getElementById("name").value.trim();
                const firstName = rawName.split(" ")[0];
                document.getElementById("success-name").textContent = firstName;

                resetForm();
                form.classList.add("is-submitted");
                successBox.hidden = false;

            } catch (error) {
                console.error("Pipeline failure:", error);
                if (formStatus) {
                    formStatus.textContent = error instanceof Error
                        ? `We couldn't submit your message: ${error.message}`
                        : "We couldn't submit your message. Please check your connection and try again.";
                }
            } finally {
                submitBtn.classList.remove("is-loading");
                submitBtn.disabled = false;
            }
        });


        document.getElementById("send-another").addEventListener("click", () => {
            successBox.hidden = true;
            form.classList.remove("is-submitted");
            if (formStatus) formStatus.textContent = "";
            document.getElementById("name").focus();
        });
    }
});
