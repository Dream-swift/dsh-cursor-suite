/**
 * Documents the first-appearance ordering the Cursor adapter must persist.
 * Run: node lib/cursor/tool-order.test.mjs
 */

/** Minimal stand-in for DSH BlockAssembler first-appearance order. */
function assemble(chunks) {
	const order = [];
	const blocks = new Map();
	for (const chunk of chunks) {
		if (chunk.type === "block-start") {
			if (!blocks.has(chunk.index)) {
				blocks.set(chunk.index, { type: chunk.blockType, parts: [] });
				order.push(chunk.index);
			}
			continue;
		}
		if (chunk.type === "text-delta" || chunk.type === "reasoning-delta") {
			if (!blocks.has(chunk.index)) {
				blocks.set(chunk.index, {
					type: chunk.type === "text-delta" ? "text" : "reasoning",
					parts: [],
				});
				order.push(chunk.index);
			}
			blocks.get(chunk.index).parts.push(chunk.text);
			continue;
		}
		if (chunk.type === "tool-call-delta" || chunk.type === "block-end") {
			continue;
		}
	}
	return order.map((index) => blocks.get(index).type);
}

function buildToolCallChunks(blockIndex, id, name, argumentsJson) {
	return [
		{ type: "block-start", index: blockIndex, blockType: "tool-call" },
		{
			type: "tool-call-delta",
			index: blockIndex,
			id,
			name,
			argumentsDelta: argumentsJson,
		},
		{
			type: "block-end",
			index: blockIndex,
			block: { type: "tool-call", id, name, arguments: argumentsJson },
		},
	];
}

/** Old behavior: emit each mcpArgs immediately → sandwich. */
function oldBurst() {
	const chunks = [];
	chunks.push(...buildToolCallChunks(2, "a", "read", "{}"));
	chunks.push({ type: "reasoning-delta", index: 1, text: "think" });
	chunks.push({ type: "text-delta", index: 0, text: "body" });
	chunks.push(...buildToolCallChunks(3, "b", "skill", "{}"));
	return assemble(chunks);
}

/** New behavior: hold tools, flush after interleaved thinking/text. */
function newBurst() {
	const held = [];
	const chunks = [];
	held.push(...buildToolCallChunks(2, "a", "read", "{}"));
	chunks.push({ type: "reasoning-delta", index: 1000, text: "[cursor] calling read\n" });
	chunks.push({ type: "reasoning-delta", index: 1, text: "think" });
	chunks.push({ type: "text-delta", index: 0, text: "body" });
	held.push(...buildToolCallChunks(3, "b", "skill", "{}"));
	chunks.push({ type: "reasoning-delta", index: 1000, text: "[cursor] calling skill\n" });
	chunks.push(...held);
	return assemble(chunks);
}

const oldOrder = oldBurst();
const newOrder = newBurst();
const oldOk = JSON.stringify(oldOrder) === JSON.stringify(["tool-call", "reasoning", "text", "tool-call"]);
const newOk = JSON.stringify(newOrder) === JSON.stringify(["reasoning", "reasoning", "text", "tool-call", "tool-call"])
	|| JSON.stringify(newOrder) === JSON.stringify(["reasoning", "text", "tool-call", "tool-call"]);

// Progress and model reasoning share "reasoning" type; both must precede tools.
const toolsAreSuffix = (() => {
	const firstTool = newOrder.indexOf("tool-call");
	return firstTool >= 0 && newOrder.slice(firstTool).every((t) => t === "tool-call");
})();
const noToolBeforeText = newOrder.indexOf("tool-call") > newOrder.indexOf("text");

if (!oldOk) {
	console.error("fixture drift: old burst order", oldOrder);
	process.exit(1);
}
if (!toolsAreSuffix || !noToolBeforeText) {
	console.error("new burst still sandwiches tools:", newOrder);
	process.exit(1);
}
console.log("ok", { oldOrder, newOrder });
