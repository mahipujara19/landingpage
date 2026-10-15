// ==================================================
// SHOP CONFIG — update these to match the real shop
// ==================================================
const SHOP = {
    name: "Brew Haven Coffee",
    lat: 23.0396,
    lng: 72.5113,
    // Index 0 = Sunday … 6 = Saturday. Hours are 24h; use null for a closed day.
    hours: [
        { open: 7, close: 19 },
        { open: 7, close: 19 },
        { open: 7, close: 19 },
        { open: 7, close: 19 },
        { open: 7, close: 19 },
        { open: 7, close: 19 },
        { open: 7, close: 19 }
    ]
};

const STORAGE_KEYS = {
    favorites: "brewhaven:favorites",
    menuFilter: "brewhaven:menu-filter",
    contactDraft: "brewhaven:contact-draft"
};

// localStorage can throw (private mode, blocked storage), so every access is guarded.
const storage = {
    get(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Storage unavailable — feature silently degrades.
        }
    },
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch {
            // Ignore.
        }
    }
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", () => {

    // ==================================================
    // TOAST NOTIFICATIONS
    // ==================================================
    const toast = document.getElementById("toast");
    let toastTimer;

    const showToast = message => {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
    };

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

        // Close the mobile menu with Escape
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && navLinks.classList.contains("open")) {
                navLinks.classList.remove("open");
                navToggle.classList.remove("open");
                navToggle.setAttribute("aria-expanded", "false");
                navToggle.focus();
            }
        });
    }

    // ==================================================
    // ACTIVE NAV LINK — highlights the section in view
    // ==================================================
    const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            navAnchors.forEach(link => {
                const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
                link.classList.toggle("is-current", isCurrent);
                if (isCurrent) link.setAttribute("aria-current", "true");
                else link.removeAttribute("aria-current");
            });
        });
    }, { rootMargin: "-45% 0px -50% 0px" });

    navAnchors.forEach(link => {
        const section = document.querySelector(link.getAttribute("href"));
        if (section) sectionObserver.observe(section);
    });

    // ==================================================
    // BACK TO TOP BUTTON
    // ==================================================
    const backToTop = document.getElementById("back-to-top");
    if (backToTop) {
        const toggleBackToTop = () => backToTop.classList.toggle("show", window.scrollY > 600);
        window.addEventListener("scroll", toggleBackToTop, { passive: true });
        toggleBackToTop();
        backToTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
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
    // MENU FAVORITES & FILTERS (localStorage)
    // ==================================================
    const menuCards = document.querySelectorAll(".menu-card[data-id]");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const favCount = document.getElementById("fav-count");
    const menuEmpty = document.getElementById("menu-empty");
    const favorites = new Set(storage.get(STORAGE_KEYS.favorites, []));
    let currentFilter = storage.get(STORAGE_KEYS.menuFilter, "all");

    const applyFilter = filter => {
        currentFilter = filter;
        let visible = 0;

        menuCards.forEach(card => {
            const show =
                filter === "all" ||
                card.dataset.category === filter ||
                (filter === "favorites" && favorites.has(card.dataset.id));
            card.hidden = !show;
            if (show) visible++;
        });

        filterButtons.forEach(btn => {
            const isActive = btn.dataset.filter === filter;
            btn.classList.toggle("is-active", isActive);
            btn.setAttribute("aria-pressed", isActive);
        });

        if (menuEmpty) menuEmpty.hidden = visible > 0;
        storage.set(STORAGE_KEYS.menuFilter, filter);
    };

    const renderFavorites = () => {
        menuCards.forEach(card => {
            const btn = card.querySelector(".fav-btn");
            if (!btn) return;
            const isFav = favorites.has(card.dataset.id);
            const name = card.querySelector("h3").textContent;
            btn.textContent = isFav ? "♥" : "♡";
            btn.classList.toggle("is-fav", isFav);
            btn.setAttribute("aria-pressed", isFav);
            btn.setAttribute("aria-label", `${isFav ? "Remove" : "Save"} ${name} ${isFav ? "from" : "to"} favorites`);
        });
        if (favCount) favCount.textContent = favorites.size;
    };

    menuCards.forEach(card => {
        const btn = card.querySelector(".fav-btn");
        if (!btn) return;
        btn.addEventListener("click", () => {
            const id = card.dataset.id;
            const name = card.querySelector("h3").textContent;
            if (favorites.has(id)) {
                favorites.delete(id);
                showToast(`Removed ${name} from favorites`);
            } else {
                favorites.add(id);
                showToast(`♥ Saved ${name} to favorites`);
            }
            storage.set(STORAGE_KEYS.favorites, [...favorites]);
            renderFavorites();
            if (currentFilter === "favorites") applyFilter("favorites");
        });
    });

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => applyFilter(btn.dataset.filter));
    });

    if (menuCards.length) {
        renderFavorites();
        const knownFilter = [...filterButtons].some(btn => btn.dataset.filter === currentFilter);
        applyFilter(knownFilter ? currentFilter : "all");
    }

    // ==================================================
    // ABOUT STATS COUNT-UP
    // ==================================================
    const statNumbers = document.querySelectorAll("[data-count]");
    const animateCount = el => {
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        if (prefersReducedMotion) {
            el.textContent = `${target}${suffix}`;
            return;
        }
        const duration = 1400;
        const start = performance.now();
        const tick = now => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = `${Math.round(target * eased)}${suffix}`;
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };

    const statObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCount(entry.target);
                statObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.6 });

    statNumbers.forEach(el => statObserver.observe(el));

    // ==================================================
    // OPEN / CLOSED STATUS & HOURS
    // ==================================================
    const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const formatHour = hour => {
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);
        const period = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        return `${h12}:${String(m).padStart(2, "0")} ${period}`;
    };

    const getOpenStatus = (now = new Date()) => {
        const today = SHOP.hours[now.getDay()];
        const currentHour = now.getHours() + now.getMinutes() / 60;

        if (today && currentHour >= today.open && currentHour < today.close) {
            const minutesLeft = Math.round((today.close - currentHour) * 60);
            const closingSoon = minutesLeft <= 60;
            return {
                isOpen: true,
                text: closingSoon
                    ? `Open now · closing soon (${formatHour(today.close)})`
                    : `Open now · until ${formatHour(today.close)}`
            };
        }

        if (today && currentHour < today.open) {
            return { isOpen: false, text: `Closed now · opens today at ${formatHour(today.open)}` };
        }

        // Find the next open day
        for (let offset = 1; offset <= 7; offset++) {
            const dayIndex = (now.getDay() + offset) % 7;
            const day = SHOP.hours[dayIndex];
            if (day) {
                const label = offset === 1 ? "tomorrow" : DAY_NAMES[dayIndex];
                return { isOpen: false, text: `Closed now · opens ${label} at ${formatHour(day.open)}` };
            }
        }
        return { isOpen: false, text: "Closed" };
    };

    const updateOpenStatus = () => {
        const status = getOpenStatus();

        const statusPill = document.getElementById("open-status");
        const statusText = document.getElementById("open-status-text");
        if (statusPill && statusText) {
            statusPill.classList.toggle("is-closed", !status.isOpen);
            statusText.textContent = status.text;
        }

        const heroStatus = document.getElementById("hero-status");
        const heroStatusText = document.getElementById("hero-status-text");
        if (heroStatus && heroStatusText) {
            heroStatus.classList.toggle("is-closed", !status.isOpen);
            heroStatusText.textContent = status.text;
        }
    };

    const hoursList = document.getElementById("hours-list");
    if (hoursList) {
        const todayIndex = new Date().getDay();
        // Start the week on Monday
        const order = [1, 2, 3, 4, 5, 6, 0];
        hoursList.innerHTML = "";
        order.forEach(dayIndex => {
            const day = SHOP.hours[dayIndex];
            const li = document.createElement("li");
            if (dayIndex === todayIndex) {
                li.classList.add("is-today");
                li.setAttribute("aria-current", "date");
            }
            const name = document.createElement("span");
            name.textContent = dayIndex === todayIndex ? `${DAY_NAMES[dayIndex]} (today)` : DAY_NAMES[dayIndex];
            const time = document.createElement("span");
            time.textContent = day ? `${formatHour(day.open)} – ${formatHour(day.close)}` : "Closed";
            li.append(name, time);
            hoursList.append(li);
        });
    }

    updateOpenStatus();
    setInterval(updateOpenStatus, 60 * 1000);

    // ==================================================
    // COPY ADDRESS
    // ==================================================
    const copyAddressBtn = document.getElementById("copy-address");
    const shopAddress = document.getElementById("shop-address");
    if (copyAddressBtn && shopAddress) {
        copyAddressBtn.addEventListener("click", async () => {
            const address = shopAddress.textContent.trim();
            try {
                await navigator.clipboard.writeText(address);
                showToast("📋 Address copied to clipboard");
            } catch {
                showToast(`Our address: ${address}`);
            }
        });
    }

    // ==================================================
    // GEOLOCATION — "How far am I?"
    // ==================================================
    const locateBtn = document.getElementById("locate-btn");
    const distanceResult = document.getElementById("distance-result");
    const directionsLink = document.getElementById("directions-link");

    // Haversine formula: great-circle distance between two lat/lng points in km
    const distanceInKm = (lat1, lng1, lat2, lng2) => {
        const toRad = deg => (deg * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const formatMinutes = minutes => {
        if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`;
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return m ? `${h} h ${m} min` : `${h} h`;
    };

    const describeDistance = km => {
        const walkMinutes = (km / 5) * 60;   // ~5 km/h walking pace
        const driveMinutes = (km / 30) * 60; // ~30 km/h city driving

        if (km < 0.1) return "You're right here! Come on in ☕";
        if (km < 2) {
            return `You're about ${km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`} away, roughly a ${formatMinutes(walkMinutes)} walk.`;
        }
        if (km < 100) {
            return `You're about ${km.toFixed(1)} km away, roughly a ${formatMinutes(driveMinutes)} drive.`;
        }
        return `You're about ${Math.round(km).toLocaleString()} km away. We'll keep a cup warm for your next visit!`;
    };

    const setDistanceMessage = (message, state) => {
        distanceResult.textContent = message;
        distanceResult.classList.remove("is-error", "is-success");
        if (state) distanceResult.classList.add(state);
    };

    if (locateBtn && distanceResult) {
        if (!("geolocation" in navigator)) {
            locateBtn.disabled = true;
            setDistanceMessage("Your browser doesn't support location services, but the Directions button still works.", "is-error");
        }

        locateBtn.addEventListener("click", () => {
            locateBtn.disabled = true;
            locateBtn.classList.add("is-loading");
            setDistanceMessage("Finding your location…");

            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    const km = distanceInKm(latitude, longitude, SHOP.lat, SHOP.lng);
                    setDistanceMessage(describeDistance(km), "is-success");

                    if (directionsLink) {
                        directionsLink.href =
                            `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${SHOP.lat},${SHOP.lng}`;
                    }

                    locateBtn.disabled = false;
                    locateBtn.classList.remove("is-loading");
                    locateBtn.textContent = "📡 Update distance";
                },
                error => {
                    const messages = {
                        1: "Location access was blocked. Allow it in your browser settings, or just tap Directions.",
                        2: "We couldn't detect your location right now. Please try again.",
                        3: "Finding your location took too long. Please try again."
                    };
                    setDistanceMessage(messages[error.code] || "Something went wrong getting your location.", "is-error");
                    locateBtn.disabled = false;
                    locateBtn.classList.remove("is-loading");
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
            );
        });
    }

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
        const draftNotice = document.getElementById("draft-notice");
        const draftFields = ["name", "email", "phone", "message"];

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

        // 4. DRAFT AUTOSAVE (localStorage) — nothing typed is lost on refresh
        let draftTimer;
        const saveDraft = () => {
            clearTimeout(draftTimer);
            draftTimer = setTimeout(() => {
                const draft = { topic: form.querySelector('input[name="topic"]:checked')?.value };
                draftFields.forEach(id => (draft[id] = document.getElementById(id).value));
                const hasContent = draftFields.some(id => draft[id].trim());
                if (hasContent) storage.set(STORAGE_KEYS.contactDraft, draft);
                else storage.remove(STORAGE_KEYS.contactDraft);
            }, 400);
        };

        const clearDraft = () => {
            clearTimeout(draftTimer);
            storage.remove(STORAGE_KEYS.contactDraft);
            if (draftNotice) draftNotice.hidden = true;
        };

        const restoreDraft = () => {
            const draft = storage.get(STORAGE_KEYS.contactDraft, null);
            if (!draft) return;
            draftFields.forEach(id => {
                if (typeof draft[id] === "string") document.getElementById(id).value = draft[id];
            });
            const topicRadio = [...form.querySelectorAll('input[name="topic"]')].find(r => r.value === draft.topic);
            if (topicRadio) topicRadio.checked = true;
            messageCount.textContent = messageInput.value.length;
            if (draftNotice) draftNotice.hidden = false;
        };

        form.addEventListener("input", event => {
            if (event.target.id !== "pot_of_honey") saveDraft();
        });
        form.addEventListener("change", event => {
            if (event.target.name === "topic") saveDraft();
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

        const discardDraftBtn = document.getElementById("discard-draft");
        if (discardDraftBtn) {
            discardDraftBtn.addEventListener("click", () => {
                clearDraft();
                resetForm();
                document.getElementById("name").focus();
            });
        }

        restoreDraft();

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
                clearDraft();
                resetForm();
                form.classList.add("is-submitted");
                successBox.hidden = false;
                return;
            }

            // Don't attempt to send while offline — the draft is already saved locally
            if (!navigator.onLine) {
                if (formStatus) {
                    formStatus.textContent = "You're offline. Your message is saved on this device, so you can send it once you're back online.";
                }
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

                clearDraft();
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

    // ==================================================
    // ONLINE / OFFLINE BANNER
    // ==================================================
    const offlineBanner = document.getElementById("offline-banner");
    const updateOnlineStatus = () => {
        if (offlineBanner) offlineBanner.hidden = navigator.onLine;
    };
    window.addEventListener("online", () => {
        updateOnlineStatus();
        showToast("✅ You're back online");
    });
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();

    // ==================================================
    // SERVICE WORKER — offline support & faster repeat visits
    // ==================================================
    // Service workers only run over http(s) (localhost counts), not file://
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
        navigator.serviceWorker.register("./sw.js")
            .then(registration => {
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;
                    newWorker.addEventListener("statechange", () => {
                        // A previous worker was in control, so this is an update rather than a first install
                        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                            showToast("✨ New version available. Refresh to update.");
                        }
                    });
                });
            })
            .catch(error => console.error("Service worker registration failed:", error));
    }
});
