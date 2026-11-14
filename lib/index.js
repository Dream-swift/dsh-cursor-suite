/**
 * dsh-cursor-suite — host assembly for two plugins that always ship together.
 *
 *   `./cursor/`  the Cursor-subscription provider: PKCE login, the Cursor Agent
 *                protocol, model discovery, and the Cursor provider route.
 *   `./vision/`  the `read_image` bridge: when the active route cannot inspect
 *                an image itself, the call is routed to a vision subagent.
 *
 * Both halves are copied verbatim from their own packages, so `lib/cursor` and
 * `lib/vision` stay byte-identical to the releases they came from and can be
 * refreshed by copying that release's `lib/` over the directory. Nothing here
 * rewrites either side's internals; this file only decides the order they mount
 * in and which config object each one receives.
 *
 * ORDER MATTERS. The Cursor adapter registers first, because the vision bridge
 * probes the route table on every read to decide whether the route it is
 * running under can see pixels at all.
 */
import * as cursor from "./cursor/index.js";
import * as vision from "./vision/index.js";

/**
 * Re-exported from the Cursor half on purpose.
 *
 * DSH derives a plugin's settings section from its own Config, and the Cursor
 * panel addresses that section by the row id in `cordis.patch.yml`
 * (`cursor-suite`). Shipping the Cursor schema here keeps the panel's
 * namespace, its editable fields, and its describe/update keys in agreement.
 * The vision half keeps its state in `~/.dsh/read-image-bridge.json`, so it
 * needs no schema fields.
 */
export { Config } from "./cursor/index.js";

/** Loader diagnostics name; matches the profile row id in `cordis.patch.yml`. */
export const name = "cursor-suite";

/** Union of both halves' service requirements, provider dependencies first. */
export const inject = Object.freeze([
	"llm",
	"credentials",
	"connection",
	"tools",
	"fs",
	"workingDirectory",
]);

/**
 * Mount both halves on one context.
 *
 * Each half keeps its own error handling: a failure inside the vision bridge is
 * caught by that plugin and logged, instead of taking the provider down with it.
 *
 * @param ctx - the host plugin context.
 * @param config - loader configuration; the Cursor fields are validated by the
 *   re-exported Config, and the vision half resolves its route from its own
 *   settings file first, falling back to defaults.
 */
export function apply(ctx, config = {}) {
	const cfg = config ?? {};
	cursor.apply(ctx, cfg);
	vision.apply(ctx, cfg);
}
