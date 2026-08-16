/**
 * --------------------------------------------------------------------------
 * Chassis CSS dom/event-handler.ts
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */
/**
 * Types
 */
type ChassisEvent = Event & Record<string, any>;
type EventCallable = (this: any, event: ChassisEvent) => any;
declare function trigger(element: EventTarget, event: string, args?: Record<string, unknown>): ChassisEvent;
declare function trigger(element: EventTarget | null, event: string, args?: Record<string, unknown>): ChassisEvent | null;
declare const EventHandler: {
    on(element: EventTarget | null, event: string, handler?: string | EventCallable, delegationFunction?: EventCallable): void;
    one(element: EventTarget | null, event: string, handler?: string | EventCallable, delegationFunction?: EventCallable): void;
    off(element: EventTarget | null, originalTypeEvent: string, handler?: string | EventCallable, delegationFunction?: EventCallable): void;
    trigger: typeof trigger;
};
export default EventHandler;
export type { ChassisEvent, EventCallable };
//# sourceMappingURL=event-handler.d.ts.map