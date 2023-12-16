import type { Observable } from "rxjs";

import type { ComponentPlan } from "./plan";

export type TransformProps<Props> = {
    [PropName in keyof Props & string as `${PropName}$`]: Observable<
        Props[PropName]
    >;
};

export type Component<Props> = (props: TransformProps<Props>) => ComponentPlan;
