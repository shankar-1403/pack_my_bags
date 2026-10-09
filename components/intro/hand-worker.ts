// Sculpts the traveller's hands off the main thread: polygonising them takes about a second on a phone,
// which would otherwise freeze the page while the intro starts.
import { handData } from "./hand";

addEventListener("message", (event: MessageEvent<"grip" | "loose">) => {
  const data = handData(event.data);
  postMessage({ pose: event.data, data }, { transfer: [data.position.buffer, data.normal.buffer, data.color.buffer, data.index.buffer] });
});
