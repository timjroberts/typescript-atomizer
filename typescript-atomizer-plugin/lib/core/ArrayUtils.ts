/**
 * Provides a collection of Array utilities.
 */
module ArrayUtils
{
    /**
     * Returns an index in an array if an element of that array satifies the provided predicate.
     *
     * @param {Array<T>} array - The array to search an index of.
     * @param {(element: T, index?: number, array?: Array<T>) => void} predicate - The predicate to apply to each element.
     * @returns {number} The index of the first element that returns true for the predicate; Otherwise -1.
     */
    export function findIndex<T>(array: Array<T>, predicate: (element: T, index?: number, array?: Array<T>) => void): number
    {
        if (!Array.isArray(array))
            throw new TypeError("'array' is not an array");

        var length = array.length;

        for (var index = 0; index < length; index++)
        {
            var element = array[index];

            if (predicate(element, index, array))
                return index;
        }

        return -1;
    }
}

export = ArrayUtils;
