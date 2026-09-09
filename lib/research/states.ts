import type { BadgeTone } from "@/components/ui/Badge";
import type { ResearchState } from "./schema";

/**
 * How a research state is spoken and coloured.
 *
 * No state maps to the `success` tone. Green is this palette's gain colour,
 * and a green pill on a research candidate would read as an endorsement the
 * evidence has not earned — the tone ramp here runs from informational to
 * cautionary, never celebratory.
 */
export const STATE_PRESENTATION: Record<
  ResearchState,
  { label: string; tone: BadgeTone; meaning: string }
> = {
  FROZEN_CANDIDATE: {
    label: "FROZEN CANDIDATE",
    tone: "accent",
    meaning:
      "Code, parameters and policy are frozen. Any change creates a new candidate and restarts its out-of-sample clock.",
  },
  TRUE_OOS_PENDING: {
    label: "TRUE OOS PENDING",
    tone: "info",
    meaning:
      "A forward out-of-sample contract is preregistered but no forward checkpoint has been evaluated. Every metric on this page is in-sample.",
  },
  KEEP_FOR_RESEARCH: {
    label: "KEEP FOR RESEARCH",
    tone: "neutral",
    meaning: "Worth further testing. Not a promotion signal.",
  },
  PARAMETER_REGION_STABLE: {
    label: "PARAMETER REGION STABLE",
    tone: "info",
    meaning:
      "Performance holds across a neighbourhood of parameters rather than at a single point.",
  },
  PARAMETER_SENSITIVE: {
    label: "PARAMETER SENSITIVE",
    tone: "warning",
    meaning:
      "Results move sharply with small parameter changes — a single peak rather than a region.",
  },
  FRICTION_SENSITIVE: {
    label: "FRICTION SENSITIVE",
    tone: "warning",
    meaning:
      "Edge degrades materially when execution costs are scaled up.",
  },
  RESULTS_PENDING: {
    label: "RESULTS PENDING",
    tone: "muted",
    meaning:
      "Specified and committed, but no experiment result exists yet. Nothing has been measured for it.",
  },
  RESULTS_NOT_EXPORTED: {
    label: "RESULTS NOT EXPORTED",
    tone: "muted",
    meaning:
      "Validated results exist in the lab but are not persisted in the repository, so this dashboard has no dataset to render. The empty panels below are a pipeline gap, not a research finding.",
  },
  REJECTED: {
    label: "REJECTED",
    tone: "danger",
    meaning: "Recorded as rejected. Kept visible so the negative result is not lost.",
  },
};
