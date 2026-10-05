// types.ts
export interface Column {
    field: string;
    header: string;
    format?: (value: any) => string;
}
