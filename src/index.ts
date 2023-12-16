import { BehaviorSubject, map } from "rxjs";

import { render } from "./render";
import { ComponentPlan } from "./plan";

const count$ = new BehaviorSubject(0);

const componentPlan: ComponentPlan = {
    type: "element",
    tag: "div",
    children: [
        {
            type: "element",
            tag: "button",
            constAttrs: { type: "button" },
            eventListeners: {
                click: () => {
                    count$.next(count$.value + 1);
                },
            },
            children: [{ type: "const-text", content: "+1" }],
        },
        { type: "const-text", content: " " },
        {
            type: "reactive-text",
            content$: count$.pipe(map((count) => `Count is: ${count}`)),
        },
    ],
};

render(componentPlan, document.body);
