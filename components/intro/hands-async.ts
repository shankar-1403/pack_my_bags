// Kept apart from the scene so the page can start sculpting the hands (in a worker) the moment it loads,
// while the 3D scene itself is still downloading.
import type { SculptData } from "./sculpt";

type Pose = "grip" | "loose";
export type HandJob = Record<Pose, Promise<SculptData>>;

/**
 * Sculpts both hands in a worker, the grip first (it is needed for the first portrait frame). If workers are
 * unavailable it falls back to the main thread.
 */
export function sculptHandsAsync(): HandJob {
  const waiting = {} as Record<Pose, (data: SculptData) => void>;
  const result = {
    grip: new Promise<SculptData>((resolve) => (waiting.grip = resolve)),
    loose: new Promise<SculptData>((resolve) => (waiting.loose = resolve)),
  };
  const onMainThread = () =>
    import("./hand").then(({ handData }) => {
      waiting.grip(handData("grip"));
      window.setTimeout(() => waiting.loose(handData("loose")), 400);
    });
  try {
    const worker = new Worker(new URL("./hand-worker.ts", import.meta.url), { type: "module" });
    let left = 2;
    worker.onmessage = (event: MessageEvent<{ pose: Pose; data: SculptData }>) => {
      waiting[event.data.pose](event.data.data);
      if (--left === 0) worker.terminate();
    };
    worker.onerror = () => {
      worker.terminate();
      onMainThread();
    };
    worker.postMessage("grip");
    worker.postMessage("loose");
  } catch {
    onMainThread();
  }
  return result;
}

