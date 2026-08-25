import { lastHistoricalBar, loadResearchLab, orderedStrategies } from "@/lib/research/data";
import { ResearchLabView } from "@/components/research/ResearchLabView";

/**
 * Research Lab.
 *
 * Read-only, historical, in-sample. The page is a server component so the
 * research payload is validated once at the boundary — a malformed metric or
 * an unevidenced state tag fails here rather than rendering as a number.
 */
export const metadata = {
  title: "Research Lab — Trading Lab",
  description:
    "Historical research experiments: metrics, robustness, execution cost stress and provenance.",
};

export default function ResearchPage() {
  const lab = loadResearchLab();
  const strategies = orderedStrategies(lab);

  return (
    <ResearchLabView
      lab={{ ...lab, strategies }}
      lastBar={lastHistoricalBar(lab.context)}
    />
  );
}
