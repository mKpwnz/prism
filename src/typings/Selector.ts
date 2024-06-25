export type SelectorKeyObject<T> = {
    [P in keyof T]?: true;
};
export type FilteredSelectorData<T, K extends SelectorKeyObject<T>> = {
    [P in keyof K & keyof T]: K[P] extends true ? T[P] : never;
};
