import type { Decision } from "@/lib/domain/schemas";

/**
 * Whether a decision's `rationale` is machine text that the UI already shows.
 *
 * The exporter writes rationales in two registers. Some are written for a
 * person ("ema50 crossed above ema200 on rising volume"). Others are a dump
 * of the deciding state:
 *
 *   derived: ema50=69629.5097 ema200=65669.3042 | close=76978.8300 |
 *   target=long | action=open_long
 *
 * Every field in that second form is already on screen — the values as
 * labelled signal chips beneath it, the action as the coloured badge above
 * it. Rendering it as prose puts the same four numbers on the card twice, at
 * full float precision, in the widest paragraph of the row. That is the
 * single densest thing on the Overview page and it carries nothing.
 *
 * The test is deliberately conservative, because the cost of a false
 * positive is deleting a human explanation the reader needed. A rationale
 * counts as redundant only when *nothing survives* stripping it down: remove
 * an optional leading label, remove every `key=value` token whose key is
 * already accounted for, remove the separators — and if a single word of
 * prose is left, the rationale is shown. Unmatched keys keep it too, since
 * an unknown key is by definition information the chips do not carry.
 */

/** Keys carried by the card's own chrome rather than by a signal chip. */
const KEYS_SHOWN_AS_CHROME = new Set(["action"]);

/** `derived:` / `reason:` / `signals:` — a label, not content. */
const LEADING_LABEL = /^\s*[a-z_][a-z0-9_ ]*:\s*/i;

const PAIR = /([a-zA-Z_][a-zA-Z0-9_.]*)\s*=\s*("[^"]*"|'[^']*'|[^\s|,;]+)/g;

export function isRedundantRationale(
  rationale: string,
  signals: Decision["signals"]
): boolean {
  if (!rationale.trim()) return true;

  const known = new Set([
    ...signals.map((s) => s.name.toLowerCase()),
    ...KEYS_SHOWN_AS_CHROME,
  ]);

  let sawPair = false;
  let allKeysKnown = true;

  const stripped = rationale
    .replace(LEADING_LABEL, "")
    .replace(PAIR, (match, key: string) => {
      sawPair = true;
      if (!known.has(key.toLowerCase())) allKeysKnown = false;
      return "";
    });

  if (!sawPair || !allKeysKnown) return false;

  // Whatever is left must be punctuation and whitespace only. Any letter or
  // digit here is prose the chips do not reproduce.
  return !/[a-z0-9]/i.test(stripped);
}
