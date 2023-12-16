import type { ElementPlan, TextPlan } from "./plan";

export type CleanupFn = () => void;

export type ElementInstance = {
    type: "element";
    plan: ElementPlan;
    element: HTMLElement;
    cleanupFn: CleanupFn;
};

export type LazyInstance = {
    type: "lazyInstance";
    cleanupFn: CleanupFn;
};

export type TextInstance = {
    type: "text";
    plan: TextPlan;
    text: Text;
    cleanupFn: CleanupFn;
};

export type Instance = ElementInstance | TextInstance | LazyInstance;
