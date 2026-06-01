const pages = [...document.querySelectorAll(".page")];
const featurePages = [...document.querySelectorAll(".feature-page")];
const revealItems = [...document.querySelectorAll("[data-reveal]")];
const serviceTargetCards = [...document.querySelectorAll(".service-target-card")];
const motionRevealItems = [
  ...new Set([...revealItems, ...serviceTargetCards, ...document.querySelectorAll(".style-soft-zone")]),
];
const homeMotionLayer = document.querySelector(".home-motion-layer");
const motionSafeQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const featureRouteIds = new Set(featurePages.map((page) => page.id));
const topRouteIds = new Set(["home", "service", "features", "style-guide", "video"]);
const defaultFeatureId = "feature-start";
const loadingIntro = document.querySelector("#loading-intro");
const videoStages = [...document.querySelectorAll(".video-stage")];
let depthFrame = null;

if (loadingIntro) {
  const removeLoadingIntro = () => {
    loadingIntro.remove();
    document.body.classList.remove("is-loading");
  };

  if (motionSafeQuery.matches) {
    window.setTimeout(removeLoadingIntro, 450);
  } else {
    window.setTimeout(removeLoadingIntro, 2500);
  }
} else {
  document.body.classList.remove("is-loading");
}

videoStages.forEach((stage) => {
  const video = stage.querySelector("video");
  if (!video) return;

  const showVideo = () => {
    stage.classList.add("has-video");
  };

  const hideVideo = () => {
    if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      stage.classList.remove("has-video");
    }
  };

  video.addEventListener("loadedmetadata", showVideo);
  video.addEventListener("canplay", showVideo);
  video.addEventListener("error", hideVideo, true);
  video.load();
});

const updateHomeDepthShift = () => {
  depthFrame = null;
  if (!homeMotionLayer) return;

  if (motionSafeQuery.matches || document.body.dataset.page !== "home") {
    homeMotionLayer.style.setProperty("--hero-depth-shift", "0px");
    return;
  }

  const shift = Math.max(-28, Math.min(0, window.scrollY * -0.055));
  homeMotionLayer.style.setProperty("--hero-depth-shift", `${shift.toFixed(2)}px`);
};

const requestHomeDepthShift = () => {
  if (depthFrame !== null) return;
  depthFrame = requestAnimationFrame(updateHomeDepthShift);
};

const markVisibleRevealItems = () => {
  motionRevealItems.forEach((item) => {
    if (item.classList.contains("is-visible")) return;

    const rect = item.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const isVisible = rect.top < window.innerHeight * 0.88 && rect.bottom > window.innerHeight * 0.08;
    if (isVisible) {
      item.classList.add("is-visible");
    }
  });
};

let revealObserver;
if ("IntersectionObserver" in window) {
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.16,
    },
  );

  motionRevealItems.forEach((item) => revealObserver.observe(item));
}

const getRoute = (hash) => {
  const id = hash.replace("#", "") || "home";

  if (featureRouteIds.has(id)) {
    return { pageId: "features", featureId: id };
  }

  if (topRouteIds.has(id)) {
    return { pageId: id, featureId: defaultFeatureId };
  }

  return { pageId: "home", featureId: defaultFeatureId };
};

const showRoute = (hash, shouldResetScroll = true) => {
  const { pageId, featureId } = getRoute(hash);

  pages.forEach((page) => {
    page.classList.toggle("is-active", page.id === pageId);
  });

  featurePages.forEach((page) => {
    page.classList.toggle("is-active", page.id === featureId);
  });

  document.querySelectorAll(".hotspots--app-top a, .hotspots--app-main a").forEach((link) => {
    link.classList.toggle("is-current", link.getAttribute("href") === `#${featureId}`);
  });

  document.body.dataset.page = pageId;

  if (shouldResetScroll) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.querySelectorAll(".capture-scroll").forEach((scroller) => {
      scroller.scrollLeft = 0;
    });
  }

  requestAnimationFrame(() => {
    markVisibleRevealItems();
    requestHomeDepthShift();
  });
};

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;

  const hash = link.getAttribute("href");
  if (!hash || hash === "#") return;

  event.preventDefault();
  history.pushState(null, "", hash);
  const isTopview = link.classList.contains("topview-hotspot") || Boolean(link.closest(".home-footer-bar"));

  showRoute(hash, !isTopview);

  if (isTopview) {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    document.querySelectorAll(".capture-scroll").forEach((scroller) => {
      scroller.scrollTo({ left: 0, behavior: "smooth" });
    });
  }
});

document.addEventListener("pointerdown", (event) => {
  const trigger = event.target.closest(".logo-hotspot, .feature-logo-hotspot, .hotspots--primary a, .hotspots--app-top a, .hotspots--app-main a");
  if (!trigger) return;

  trigger.classList.remove("is-tapped");
  void trigger.offsetWidth;
  trigger.classList.add("is-tapped");
  window.setTimeout(() => {
    trigger.classList.remove("is-tapped");
  }, 460);
});

window.addEventListener("load", () => {
  showRoute(window.location.hash);
  markVisibleRevealItems();
});

window.addEventListener("popstate", () => {
  showRoute(window.location.hash);
});

window.addEventListener(
  "scroll",
  () => {
    markVisibleRevealItems();
    requestHomeDepthShift();
  },
  { passive: true },
);

motionSafeQuery.addEventListener?.("change", requestHomeDepthShift);

serviceTargetCards.forEach((card) => {
  let clearTimer;

  const clearPressed = () => {
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => {
      card.classList.remove("is-pressed");
    }, 420);
  };

  card.addEventListener("pointerdown", () => {
    clearTimeout(clearTimer);
    card.classList.add("is-pressed");
  });

  card.addEventListener("pointerup", clearPressed);
  card.addEventListener("pointercancel", clearPressed);
  card.addEventListener("pointerleave", clearPressed);
});
