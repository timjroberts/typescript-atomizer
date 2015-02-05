/**
 * A library for creating powerful and flexible finite state machines.
 */
declare module Machina {
    /**
     * Defines a state and the events that it will react to.
     */
    export interface IFsmState {
        /**
         * Defines an action that will execute when the finite state machine is in the given state.
         */
        [index: string]: (...args: any[]) => void;

        /**
         * Defines an action that will execute when the finite state machine transitions into the given state.
         */
        _onEnter?: () => void;

        /**
         * Defines an action that will execute when the finite state machine transitions out of the given state.
         */
        _onExit?: () => void;
    }

    /**
     * A collection of states.
     */
    export interface IFsmStates {
        /**
         * Defines a state.
         */
        [index: string]: IFsmState;
    }

    /**
     * Defines a state machine in terms of its states and events.
     */
    export interface IFsmInitializationOptions {
        /**
         * Sets the initial state of the finite state machine.
         */
        initialState?: string;

        /**
         * Defines the states and the events that they will will react to.
         */
        states: IFsmStates;
    }

    /**
     * A finite state machine.
     */
    export class Fsm {
        /**
         * Builds a new finite state machine.
         *
         * @param options Defines the state machine in terms of its states and events.
         */
        constructor(options: IFsmInitializationOptions);

        /**
         * Gets the current state.
         */
        state: string;

        /**
         * Triggers an event in the finite state machine.
         *
         * @param eventName The name of the event to trigger.
         */
        handle(eventName: string, ...args: any[]): void;

        deferUntilTransition(stateName?: string): void;

        deferUntilNextHandler(): void;

        /**
         * Transitions the finite state machine to a new state.
         *
         * @param newState The state to transition to.
         */
        transition(newState: string): void;

        on(eventName: string, callback: () => void);

        off(eventName: string, callback: () => void);
    }
}

declare module "machina" {
    export = Machina;
}
