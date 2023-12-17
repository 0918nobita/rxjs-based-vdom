import { type Observable, type Observer, type Subscription } from "rxjs";

type TransformPubs<Pubs> = {
    [PubName in keyof Pubs & string as `${PubName}$`]: Observer<Pubs[PubName]>;
};

type TransformSubs<Subs> = {
    [SubName in keyof Subs & string as `${SubName}$`]: Observable<
        Subs[SubName]
    >;
};

type VText = {
    type: "text";
    content: number | string | Observable<string>;
};

type VElement = {
    type: "element";
    tag: string;
    constAttrs: Record<string, string>;
    reactiveAttrs: Record<string, Observable<string>>;
    eventListeners: Partial<Record<keyof HTMLElementEventMap, EventListener>>;
    children: VNode[];
};

type VComponent = {
    type: "component";
    component: Component<unknown, unknown>;
    pubs: Record<string, Observer<unknown>>;
    subs: Record<string, Observable<unknown>>;
};

type VReactiveNode = {
    type: "reactive";
    stream: Observable<VNode>;
};

type VNode = VText | VElement | VComponent | VReactiveNode;

type VTextInstance = {
    type: "text-instance";
    el: Text;
    subscription?: Subscription;
};

type VElementInstance = {
    type: "element-instance";
    el: HTMLElement;
    subscriptions: Subscription[];
};

type VNodeInstance = VTextInstance | VElementInstance;

function renderText(vtext: VText, parent: HTMLElement): VTextInstance {
    switch (typeof vtext.content) {
        case "number": {
            const text = new Text(String(vtext.content));
            parent.appendChild(text);
            return { type: "text-instance", el: text };
        }
        case "string": {
            const text = new Text(vtext.content);
            parent.appendChild(text);
            return { type: "text-instance", el: text };
        }
        default: {
            const text = new Text();
            parent.appendChild(text);
            const subscription = vtext.content.subscribe((newContent) => {
                text.nodeValue = newContent;
            });
            return { type: "text-instance", el: text, subscription };
        }
    }
}

function renderElement(
    velement: VElement,
    parent: HTMLElement
): VElementInstance {
    const el = document.createElement(velement.tag);
    const subscriptions: Subscription[] = [];

    for (const [attr, value] of Object.entries(velement.constAttrs)) {
        el.setAttribute(attr, value);
    }

    for (const [attr, value$] of Object.entries(velement.reactiveAttrs)) {
        const subscription = value$.subscribe((newValue) => {
            el.setAttribute(attr, newValue);
        });
        subscriptions.push(subscription);
    }

    for (const [eventName, listener] of Object.entries(
        velement.eventListeners
    )) {
        el.addEventListener(eventName, listener as EventListener);
    }

    for (const child of velement.children) {
        renderVNode(child, el);
    }

    parent.appendChild(el);

    return { type: "element-instance", el, subscriptions };
}

function renderVNode(vnode: VNode, parent: HTMLElement): VNodeInstance {
    switch (vnode.type) {
        case "text":
            return renderText(vnode, parent);
        case "element":
            return renderElement(vnode, parent);
        case "component":
        default:
            throw new Error("not implemented");
    }
}

type Component<Pubs, Subs> = (
    pubs: TransformPubs<Pubs>,
    subs: TransformSubs<Subs>
) => VNode;

function renderRoot<Pubs, Subs>(
    rootComponent: Component<Pubs, Subs>,
    pubs: TransformPubs<Pubs>,
    subs: TransformSubs<Subs>,
    element: HTMLElement
) {
    const vnode = rootComponent(pubs, subs);
    renderVNode(vnode, element);
}

renderRoot(
    () => ({
        type: "element",
        tag: "div",
        constAttrs: {},
        reactiveAttrs: {},
        eventListeners: {},
        children: [
            {
                type: "text",
                content: "Hello, world!",
            },
        ],
    }),
    {},
    {},
    document.body
);
