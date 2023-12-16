import type {
    CleanupFn,
    ElementInstance,
    Instance,
    LazyInstance,
    TextInstance,
} from "./instance";
import type { ComponentPlan, ElementPlan, LazyPlan, TextPlan } from "./plan";

const noop = () => {};

function renderText(textPlan: TextPlan, parent: HTMLElement): TextInstance {
    if (textPlan.type === "const-text") {
        const text = new Text(textPlan.content);
        parent.appendChild(text);
        return { type: "text", plan: textPlan, text, cleanupFn: noop };
    }

    const reactiveText = new Text();
    const subscription = textPlan.content$.subscribe((newContent) => {
        reactiveText.nodeValue = newContent;
    });

    parent.appendChild(reactiveText);

    return {
        type: "text",
        plan: textPlan,
        text: reactiveText,
        cleanupFn: () => {
            subscription.unsubscribe();
        },
    };
}

function renderElement(
    elementPlan: ElementPlan,
    parent: HTMLElement
): ElementInstance {
    const el = document.createElement(elementPlan.tag);
    const cleanupFns: CleanupFn[] = [];

    const { constAttrs, reactiveAttrs, eventListeners, children } = elementPlan;
    if (constAttrs !== undefined) {
        for (const [attr, value] of Object.entries(constAttrs)) {
            el.setAttribute(attr, value);
        }
    }

    if (reactiveAttrs !== undefined) {
        for (const [attr, value$] of Object.entries(reactiveAttrs)) {
            const subscription = value$.subscribe((newValue) => {
                el.setAttribute(attr, newValue);
            });
            cleanupFns.push(() => {
                subscription.unsubscribe();
            });
        }
    }

    if (eventListeners !== undefined) {
        for (const [eventName, listener] of Object.entries(eventListeners)) {
            el.addEventListener(
                eventName,
                listener as EventListenerOrEventListenerObject
            );
        }
    }

    if (children !== undefined) {
        for (const child of children) {
            const { cleanupFn } = render(child, el);
            cleanupFns.push(cleanupFn);
        }
    }

    parent.appendChild(el);

    return {
        type: "element",
        plan: elementPlan,
        element: el,
        cleanupFn: () => {
            for (const cleanupFn of cleanupFns) {
                cleanupFn();
            }
        },
    };
}

function renderLazily(
    reactiveElementPlan: LazyPlan,
    parent: HTMLElement
): LazyInstance {
    let rendered: TextInstance | ElementInstance | null = null;

    reactiveElementPlan.plan$.subscribe((newPlan) => {
        if (rendered === null) {
            rendered =
                newPlan.type === "const-text" ||
                newPlan.type === "reactive-text"
                    ? renderText(newPlan, parent)
                    : renderElement(newPlan, parent);
            return;
        }

        if (rendered.type === "text") {
            if (newPlan.type === "const-text") {
                if (rendered.plan.type === "const-text") {
                    rendered.text.nodeValue = newPlan.content;
                } else {
                    const cleanupFn = rendered.cleanupFn;
                    parent.removeChild(rendered.text);
                    rendered = renderText(newPlan, parent);
                    cleanupFn();
                }
                return;
            }

            if (newPlan.type === "reactive-text") {
                rendered = renderText(newPlan, parent);
                return;
            }

            const cleanupFn = rendered.cleanupFn;
            parent.removeChild(rendered.text);
            rendered = renderElement(newPlan, parent);
            cleanupFn();
            return;
        }

        if (newPlan.type === "const-text" || newPlan.type === "reactive-text") {
            const cleanupFn = rendered.cleanupFn;
            parent.removeChild(rendered.element);
            rendered = renderText(newPlan, parent);
            cleanupFn();
            return;
        }

        const cleanupFn = rendered.cleanupFn;
        parent.removeChild(rendered.element);
        rendered = renderElement(newPlan, parent);
        cleanupFn();
    });

    return {
        type: "lazyInstance",
        cleanupFn: () => {
            if (rendered === null) return;
            rendered.cleanupFn();
        },
    };
}

export function render(
    componentPlan: ComponentPlan,
    parent: HTMLElement
): Instance {
    if (
        componentPlan.type === "const-text" ||
        componentPlan.type === "reactive-text"
    ) {
        return renderText(componentPlan, parent);
    }

    if (componentPlan.type === "element") {
        return renderElement(componentPlan, parent);
    }

    return renderLazily(componentPlan, parent);
}
