declare module "assert" {
    /**
     * Tests if value is truthy.
     *
     * @param value The value that will be tested to be truthy.
     * @param message An optional message that will thrown if 'value' is not truthy.
     */
    export function assert(value: any, message?: string);
    /**
     * Tests if value is truthy.
     *
     * @param value The value that will be tested to be truthy.
     * @param message An optional message that will thrown if 'value' is not truthy.
     */
    export function ok(value: any, message?: string);
}
