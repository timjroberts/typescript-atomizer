declare module "assert" {
    /**
     * Tests if value is truthy.
     *
     * @param value The value that will be tested to be truthy.
     * @param message An optional message that will thrown if 'value' is not truthy.
     */
    export function assert(value: any, message?: string): void;
    /**
     * Tests if value is truthy.
     *
     * @param value The value that will be tested to be truthy.
     * @param message An optional message that will thrown if 'value' is not truthy.
     */
    export function ok(value: any, message?: string): void;

    /**
     * Tests shallow, coercive equality with the equal comparison operator (i.e., '==').
     *
     * @param actual The value to be tested.
     * @param expected The value that is expected.
     * @param message An optional message that will thrown if the actual value does
     * not match the expected value.
     */
    export function equal(actual: any, expected: any, message?: string): void;

    /**
     * Tests shallow, coercive non-equality with the not equal comparison operator (i.e., '!=').
     *
     * @param actual The value to be tested.
     * @param expected The value that is expected.
     * @param message An optional message that will thrown if the actual value does
     * not match the expected value.
     */
    export function notEqual(actual: any, expected: any, message?: string): void;

    /**
     * Tests strict equality as determined by the strict equality operator (i.e., '===').
     *
     * @param actual The value to be tested.
     * @param expected The value that is expected.
     * @param message An optional message that will thrown if the actual value does
     * not match the expected value.
     */
    export function strictEqual(actual: any, expected: any, message?: string): void;

    /**
     * Tests strict non-equality as determined by the strict not equal operator (i.e., '!==').
     *
     * @param actual The value to be tested.
     * @param expected The value that is expected.
     * @param message An optional message that will thrown if the actual value does
     * not match the expected value.
     */
    export function notStrictEqual(actual: any, expected: any, message?: string): void;
    
    export function throws(block: Function, error?: RegExp, message?: string): void;
    export function throws(block: Function, error?: (err: any) => void, message?: string): void;
}
