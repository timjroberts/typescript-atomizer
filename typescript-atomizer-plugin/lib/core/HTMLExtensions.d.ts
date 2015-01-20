interface DocumentExtentions extends Document
{
    registerElement<T extends HTMLElement>(name: string, declaration?: { prototype: T; extends?: string }): { new(): T; prototype: T }
}

interface ModelBasedHTMLElement<T> extends HTMLElement
{
    createdCallback(): void;
    attachedCallback(): void;
    detachedCallback(): void;
    setModel(model: T);
}

interface HTMLElement
{
    getBoundingClientRect(): ClientRect;
}

interface Node
{
    getBoundingClientRect(): ClientRect;
}
