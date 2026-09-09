import { MeasuredCompare } from "@/components/research/MeasuredCompare";
import { loadMeasuredComparison } from "@/lib/research/measured";
export const metadata = {title: "Research Compare — Trading Lab"};
export default async function ComparePage({searchParams}: {searchParams: Promise<{asset?: string}>}) {
  const {asset} = await searchParams;
  const data = loadMeasuredComparison(asset);
  return <MeasuredCompare key={data.asset} data={data}/>;
}
