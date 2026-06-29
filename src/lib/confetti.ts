import confetti from "canvas-confetti";

export function burst() {
  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#22d3ee", "#6366f1", "#f472b6", "#facc15", "#34d399"],
  });
}

export function bigCelebrate() {
  const end = Date.now() + 900;
  const colors = ["#22d3ee", "#6366f1", "#f472b6", "#facc15"];
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
