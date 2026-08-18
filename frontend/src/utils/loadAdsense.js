const ADSENSE_CLIENT = "ca-pub-6914951589877961";
const SCRIPT_ID = "adsense-script";

/** Load AdSense after first paint so it does not delay FCP/LCP. */
export const loadAdsense = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(script);
};

export const scheduleAdsense = () => {
  const run = () => loadAdsense();
  if (typeof window === "undefined") return;

  const start = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(run, { timeout: 3500 });
    } else {
      window.setTimeout(run, 1800);
    }
  };

  if (document.readyState === "complete") {
    start();
    return;
  }
  window.addEventListener("load", start, { once: true });
};
