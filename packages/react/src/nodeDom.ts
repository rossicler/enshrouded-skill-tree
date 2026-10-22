import type { MouseEvent } from "react";

// Finding the tree's nodes in the DOM: each node's element carries `data-node-id`.

export const nodeElementOf = (target: EventTarget | null): Element | null =>
  target instanceof Element ? target.closest("[data-node-id]") : null;

export const nodeIdOf = (target: EventTarget | null): string | null =>
  nodeElementOf(target)?.getAttribute("data-node-id") ?? null;

// The pointer moved within one node. Compares elements, since another tree on
// the page has nodes with the same ids.
export const withinNode = (e: MouseEvent) => nodeElementOf(e.relatedTarget) === nodeElementOf(e.target);

export const cssString = (value: string) => value.replace(/["\\]/g, "\\$&");
