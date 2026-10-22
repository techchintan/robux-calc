function getSubdomainOrDomain(hostname) {
    const cleanHost = hostname.split(':')[0]
    const segments = cleanHost.split('.')

    if (segments.length <= 2) {
        return cleanHost
    }

    return segments[0]
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
}

function getPageName() {
    // Return document title or filename without extension
    if (document.title && document.title.trim() !== "") {
        return document.title;
    }
    const path = window.location.pathname;
    const page = path.split("/").pop();
    if (page === "" || page === "index.html") return "Home Page";
    return page.replace(".html", "").split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

async function onPaidEventHandler(ilar_message) {
    // Revenue reporting to the roboxquiz analytics API is disabled for this site.
    return;
    // const sessionId = getCookie("session_id");
    // const { currencyCode, valueMicros } = ilar_message;
    // const actualValue = valueMicros / 1000000 || 0;

    // await fetch("https://1001.roboxquiz.com/api/analytics", {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //         Domain: window.location.hostname,
    //         SubDomain: getSubdomainOrDomain(window.location.hostname),
    //         EventName: `${getSubdomainOrDomain(window.location.hostname)}_ad_impression`,
    //         AdsPlatform: 'Google',
    //         AdsFormat: 'Display',
    //         Currency: 'USD',
    //         Value: actualValue,
    //         AdsSource: 'AdSense',
    //         GClId: getCookie('gclId') || null,
    //         AdsUnitName: getPageName(),
    //         SessionId: sessionId
    //     }),
    // });

    // console.log("ilar_message", ilar_message);
}

// adBreak/adConfig and onPaidEvent are set up below after timer logic

function generateSessionId() {
    return crypto.randomUUID();
}

function setSessionCookie() {
    const existing = document.cookie
        .split("; ")
        .find((row) => row.startsWith("session_id="));

    if (!existing) {
        const sessionId = generateSessionId();
        document.cookie = `session_id=${sessionId}; path=/; SameSite=Lax`;
    }
}

/* ---------------- AD TIMER LOGIC (Mirroring robloxquiz) ---------------- */
function getAdTimer() {
    return parseInt(localStorage.getItem("ad_timer") || "0", 10);
}

function setAdTimer(val) {
    localStorage.setItem("ad_timer", val.toString());
}

function getIsFirstAd() {
    const val = localStorage.getItem("is_first_ad");
    return val === null || val === "true";
}

function setIsFirstAd(val) {
    localStorage.setItem("is_first_ad", val.toString());
}

// Global Timer Interval
setInterval(() => {
    let currentTimer = getAdTimer();
    setAdTimer(currentTimer + 1);
}, 1000);

// Ad Setup: single authoritative declaration
window.adsbygoogle = window.adsbygoogle || [];
window.adsbygoogle.onPaidEvent = onPaidEventHandler;
var adBreak = adConfig = function (o) { adsbygoogle.push(o); };
var timer = getAdTimer();
var isFirstAd = getIsFirstAd();
// if (isFirstAd || timer >= 60) {
//     adConfig({
//         preloadAdBreaks: 'on',
//         sound: 'on',
//         onReady: () => {
//             console.log("[Ads] AdBreak Config Ready");
//             window.adBreakReady = true;
//         }
//     });
// }

/* ---------------- REWARDED AD SLOTS ROTATION ---------------- */
const REWARD_AD_SLOTS = [
    "3359080448", // RBX_reward1
    "5378739129", // RBX_reward2
    "3505103454", // RBX_reward3
    "9004842142", // RBX_reward4
    "3920036421"  // RBX_reward5
];

function getNextRewardedSlot() {
    try {
        let currentIndex = parseInt(sessionStorage.getItem("reward_slot_idx") || "0", 10);
        if (isNaN(currentIndex) || currentIndex < 0 || currentIndex >= REWARD_AD_SLOTS.length) {
            currentIndex = 0;
        }
        const slot = REWARD_AD_SLOTS[currentIndex];
        const nextIndex = (currentIndex + 1) % REWARD_AD_SLOTS.length;
        sessionStorage.setItem("reward_slot_idx", nextIndex.toString());
        console.log(`[RewardedAds] Using slot index ${currentIndex}: ${slot}`);
        return slot;
    } catch (e) {
        return REWARD_AD_SLOTS[0];
    }
}

let adLoading = false;

function initializeAds(adSlot, callback) {
    adLoading = true;
    window.adsbygoogle = window.adsbygoogle || [];
    const slotToUse = adSlot || getNextRewardedSlot();
    console.log("[AdLogic] Initializing rewarded ad with slot:", slotToUse);
    adsbygoogle.push({
        params: {
            google_ad_loaded_callback: callback,
            google_ad_slot: slotToUse,
            google_ad_format: "rewarded",
        },
    });
}

function showAdWithLogic(onAdDone) {
    try {
        const timer = getAdTimer();
        const isFirstAd = getIsFirstAd();
        console.log(`[AdLogic] Triggered. Timer: ${timer}s, First Ad: ${isFirstAd}`);

        if (isFirstAd || timer >= 60) {
            console.log(`[AdLogic] ${isFirstAd ? "First ad" : "Timer >= 60s"}. Showing Ad Break.`);
            // if (window.adBreakReady) {
            adBreak({
                type: 'preroll',
                name: 'game_transition',
                adBreakDone: (placementInfo) => {
                    console.log("[AdLogic] Ad Break done.");

                    if (placementInfo.breakStatus === 'frequencyCapped' || placementInfo.breakStatus === 'Ad not available') {
                        console.log("[AdLogic] Ad Break ad not ready or ad not serving Skipping to GPT interstitial.")
                       
                    }
                    setIsFirstAd(false);
                    setAdTimer(1);
                    setTimeout(() => {
                        onAdDone(placementInfo);
                    });
                }
            });
            // }
            // else if (rewardedAdInstance) {
            //     rewardedAdInstance.show((result) => {
            //         console.log("[AdLogic] Rewarded Ad result:", result.status);
            //         rewardedAdInstance = null;
            //         setTimeout(() => {
            //             onAdDone({ breakStatus: result.status === "viewed" ? "viewed" : "dismissed" });
            //         });
            //     });
            // }
        } else {
            console.log("[AdLogic] Timer < 60s. Showing Rewarded Ad.");
            adLoading = true;
            initializeAds(getNextRewardedSlot(), (rewardedAd) => {
                if (rewardedAd) {
                    rewardedAd.show((result) => {
                        console.log("[AdLogic] Rewarded Ad result:", result.status);
                        setTimeout(() => {
                            onAdDone({ breakStatus: result.status === "viewed" ? "viewed" : "dismissed" });
                            adLoading = false;
                        });
                    });
                } else {
                    // console.log("[RewardAdLogic] Rewarded Ad not ready, skipping.");
                    console.log("[RewardAdLogic] Rewarded ad not ready Skipping to GPT reward.")
                    adLoading = false;
                    onAdDone({ breakStatus: "notReady" });
                }
            })
        }
    } catch (error) {
        console.log("Error in showAdWithLogic : ", error);
    }
}

/* ---------------- REWARD AD LOGIC (mirrors handleDoubleCoins in robloxquiz) ---------------- */
// timer >= 60 → Ad Break type "reward" | timer < 60 → Rewarded Ad
// onAdDone receives { breakStatus: 'viewed' | 'dismissed' } on completion
function showRewardAdWithLogic(onAdDone) {
    try {
        const timer = getAdTimer();
        console.log(`[RewardAdLogic] Triggered. Timer: ${timer}s`);

        if (timer >= 60) {
            console.log("[RewardAdLogic] Timer >= 60s. Showing Ad Break type reward.");
            // 'reward' type requires: beforeReward, adViewed, adDismissed
            let rewardGranted = false;
            adBreak({
                type: 'reward',
                name: 'double_the_coin',
                beforeReward: (showAdFn) => {
                    console.log("[RewardAdLogic] beforeReward — showing ad.");
                    showAdFn();
                },
                adViewed: () => {
                    console.log("[RewardAdLogic] adViewed — reward earned.");
                    rewardGranted = true;
                },
                adDismissed: () => {
                    console.log("[RewardAdLogic] adDismissed — no reward.");
                    rewardGranted = false;
                },
                adBreakDone: (placementInfo) => {
                    console.log("[RewardAdLogic] adBreakDone:", placementInfo.breakStatus);
                    if (placementInfo.breakStatus === 'frequencyCapped' || placementInfo.breakStatus === 'Ad not available') {
                        console.log("[RewardAdLogic] Ad Break ad not ready or ad not serving Skipping to GPT interstitial.")
                       
                    }
                    setAdTimer(1);
                    setTimeout(() => {
                        onAdDone({
                            breakStatus: rewardGranted ? "viewed" : (placementInfo.breakStatus || "dismissed")
                        });
                    });
                }
            });
            // else if (rewardedAdInstance) {
            //     rewardedAdInstance.show((result) => {
            //         rewardedAdInstance = null;
            //         setTimeout(() => {
            //             onAdDone({ breakStatus: result.status === "viewed" ? "viewed" : "dismissed" });
            //         });
            //     });
            // } 
        } else {
            console.log("[RewardAdLogic] Timer < 60s. Showing Rewarded Ad.");
            initializeAds(getNextRewardedSlot(), (rewardedAd) => {
                if (rewardedAd) {
                    rewardedAd.show((result) => {
                        console.log("[AdLogic] Rewarded Ad result:", result.status);
                        setTimeout(() => {
                            onAdDone({ breakStatus: result.status === "viewed" ? "viewed" : "dismissed" });
                            adLoading = false;
                        });
                    });
                } else {
                    // console.log("[RewardAdLogic] Rewarded Ad not ready, skipping.");
                    console.log("[RewardAdLogic] Rewarded ad not ready Skipping to GPT reward.")
                    adLoading = false;
                    onAdDone({ breakStatus: "notReady" });
                }
            })
        }
    } catch (error) {
        console.log("Error in showRewardAdWithLogic : ", error);
    }
}

/* ---------------- GAME SECTION INTERSTITIAL & DISPLAY AD FALLBACK MODAL ---------------- */
let modalTimerInterval = null;

function getOrCreateAdModal() {
    let modal = document.getElementById("gameAdModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "gameAdModal";
        modal.className = "game-ad-modal-overlay";
        modal.innerHTML = `
            <div class="game-ad-modal-card">
                <div class="game-ad-modal-header">
                    <span class="game-ad-badge">Advertisement</span>
                    <button class="game-ad-close-icon" id="gameAdModalCloseIcon" aria-label="Close" style="display: none;">&times;</button>
                </div>
                <div class="game-ad-slot-wrapper" id="gameAdSlotWrapper"></div>
                <div class="game-ad-modal-footer">
                    <button class="game-ad-continue-btn" id="gameAdContinueBtn" disabled>
                        Continue in <span id="gameAdTimerCount">4</span>s
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    return modal;
}

let isGameAdTransitionActive = false;

function showGameSectionInterstitial(targetUrl) {
    if (isGameAdTransitionActive) {
        console.log("[AdLogic] Ad transition already in progress. Ignoring duplicate click.");
        return;
    }
    isGameAdTransitionActive = true;

    console.log("[AdLogic] Game section clicked. Requesting interstitial for:", targetUrl);

    let interstitialDisplayed = false;
    let interstitialFinished = false;
    let safetyTimeout = null;

    function cleanupTimeout() {
        if (safetyTimeout) {
            clearTimeout(safetyTimeout);
            safetyTimeout = null;
        }
    }

    function handleUnfilled() {
        // If an interstitial ad was already displayed or completed, NEVER show the fallback modal
        if (interstitialFinished || interstitialDisplayed) {
            console.log("[AdLogic] Interstitial was displayed/handled; skipping fallback modal.");
            return;
        }
        interstitialFinished = true;
        cleanupTimeout();
        isGameAdTransitionActive = false;
        console.log("[AdLogic] Interstitial unfilled/unavailable. Opening display ad fallback modal.");
        
    }

    function navigateSuccess() {
        if (interstitialFinished) return;
        interstitialFinished = true;
        interstitialDisplayed = true;
        cleanupTimeout();
        isGameAdTransitionActive = false;

        // Ensure display ad fallback modal is closed if it was ever active
        const modal = document.getElementById("gameAdModal");
        if (modal) {
            modal.classList.remove("active");
        }
        if (modalTimerInterval) {
            clearInterval(modalTimerInterval);
            modalTimerInterval = null;
        }

        console.log("[AdLogic] Interstitial ad viewed/dismissed. Navigating directly to:", targetUrl);
        setIsFirstAd(false);
        setAdTimer(1);
        window.location.href = targetUrl;
    }

    // Safety timeout ONLY if adBreak SDK is completely blocked or never responds
    safetyTimeout = setTimeout(() => {
        if (!interstitialDisplayed && !interstitialFinished) {
            console.log("[AdLogic] Interstitial response timeout without ad display, falling back to modal.");
            handleUnfilled();
        }
    }, 6000);

    try {
        if (typeof adBreak === "function") {
            adBreak({
                type: 'start',
                name: 'game_section_click',
                beforeAd: () => {
                    console.log("[AdLogic] Interstitial ad started on screen.");
                    interstitialDisplayed = true;
                    cleanupTimeout(); // Kill timeout immediately so fallback modal can never fire
                },
                afterAd: () => {
                    console.log("[AdLogic] Interstitial ad finished on screen.");
                    interstitialDisplayed = true;
                    cleanupTimeout();
                },
                adBreakDone: (placementInfo) => {
                    console.log("[AdLogic] Interstitial adBreakDone:", placementInfo);
                    cleanupTimeout();
                    const status = placementInfo && placementInfo.breakStatus;

                    // If user viewed or dismissed the interstitial, or if the ad was shown on screen
                    if (status === 'viewed' || status === 'dismissed' || interstitialDisplayed) {
                        navigateSuccess();
                    } else {
                        // Unfilled (frequencyCapped, other, notReady, error, etc.)
                        handleUnfilled();
                    }
                }
            });
        } else {
            console.log("[AdLogic] adBreak function unavailable.");
            handleUnfilled();
        }
    } catch (err) {
        console.error("[AdLogic] Exception in showGameSectionInterstitial:", err);
        handleUnfilled();
    }
}

window.showGameSectionInterstitial = showGameSectionInterstitial;

document.addEventListener("DOMContentLoaded", function () {
    setSessionCookie();

    const urlParams = new URLSearchParams(window.location.search);
    const gclId = urlParams.get("gclid");

    if (gclId) {
        document.cookie = `gclId=${gclId}; path=/; SameSite=Lax`;
    }

    // Intercept all link clicks to apply ad logic
    document.body.addEventListener("click", function (event) {
        if (event.defaultPrevented) return;

        const link = event.target.closest("a");
        if (link && link.getAttribute("href")) {
            const url = link.getAttribute("href");

            if (
                url.startsWith("#") ||
                url.startsWith("javascript:") ||
                url.startsWith("mailto:") ||
                url.startsWith("tel:") ||
                link.classList.contains("no-ad") // Allow skipping ads for specific links
            ) {
                return;
            }
            event.preventDefault();

            // Functionality is applied ONLY for clothes.html section
            const isClothesSection = url.includes("clothes.html");

            if (isClothesSection) {
                // Popup ad code commented out - navigate directly without showing ad
                // showGameSectionInterstitial(url);
                window.location.href = url;
            } else if (link.closest(".rewards")) {
                showRewardAdWithLogic(function (placementInfo) {
                    window.location.href = url;
                });
            } else {
                showAdWithLogic(function () {
                    window.location.href = url;
                });
            }
        }
    });
});


