/**
 * Represents a dictionary of objects that are indexed by a numeric key.
 */
interface NumberIndexDictionary<T>
{
    /**
     * Gets or sets the object at the specified key.
     */
    [key: number]: T;
}
