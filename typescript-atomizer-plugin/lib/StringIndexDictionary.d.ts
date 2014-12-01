/**
 * Represents a dictionary of objects that are indexed by a string key.
 */
interface StringIndexDictionary<T> {
    /**
     * Gets or sets the object at the specified key.
     */
    [key: string]: T;
}
