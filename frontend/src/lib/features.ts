/**
 * Feature-flagg for klientinfrastrukturen. Gjenskapt i fase 2 (legacy-filen
 * var untracked og utenfor fryse-settet); kun flagget de migrerte libene
 * faktisk bruker er tatt med. UI-flagg defineres på nytt i fase 3–4.
 */
export const EVIDA_STREAM_MODE = import.meta.env.VITE_EVIDA_STREAM_MODE === "mock" ? "mock" : "backend";
