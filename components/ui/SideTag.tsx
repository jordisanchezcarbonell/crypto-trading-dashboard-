import clsx from "clsx";

/** Long/short marker. Direction is carried by the arrow as well as the colour. */
export function SideTag({ side }: { side: "long" | "short" }) {
  const long = side === "long";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold leading-5 tracking-wide",
        long ? "border-pos/25 bg-pos/10 text-pos" : "border-neg/25 bg-neg/10 text-neg"
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {long ? <path d="M12 19V5m0 0-6 6m6-6 6 6" /> : <path d="M12 5v14m0 0 6-6m-6 6-6-6" />}
      </svg>
      {long ? "LONG" : "SHORT"}
    </span>
  );
}
