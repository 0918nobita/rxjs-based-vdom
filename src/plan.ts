import type { Observable } from "rxjs";

export type ElementPlan = {
    type: "element";
    tag: string;
    constAttrs?: Record<string, string>;
    reactiveAttrs?: Record<string, Observable<string>>;
    eventListeners?: {
        [EventName in keyof HTMLElementEventMap]?: (
            evt: HTMLElementEventMap[EventName]
        ) => void;
    };
    children?: ComponentPlan[];
};

export type LazyPlan = {
    type: "lazy";
    plan$: Observable<TextPlan | ElementPlan>;
};

export type ConstTextPlan = {
    type: "const-text";
    content: string;
};

export type ReactiveTextPlan = {
    type: "reactive-text";
    content$: Observable<string>;
};

export type TextPlan = ConstTextPlan | ReactiveTextPlan;

export type ComponentPlan = ElementPlan | TextPlan | LazyPlan;
