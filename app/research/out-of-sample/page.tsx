import { OutOfSampleCompare } from "@/components/research/OutOfSampleCompare";
import { loadOutOfSample } from "@/lib/research/oos";

export const metadata = { title: "Fuera de muestra — Trading Lab" };

export default function OutOfSamplePage() {
  return <OutOfSampleCompare data={loadOutOfSample()} />;
}
