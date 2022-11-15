import { useController, useFormContext } from 'react-hook-form';
import { InferType } from 'yup';
import { FormSchema, SchemaPath } from '..';

/** A list of types which a form input can be registered to support. */
export interface FormFieldTypeMap {
    "boolean": boolean;
    "int": number;
    "decimal": number;
    "string": string;
    "date": Date;
};

export type FormFieldTypes = keyof FormFieldTypeMap;

export interface UseFormInputProps<TField extends FormFieldTypes> {
    /** The datatype supported by the input being registered. */
    type: TField;
    /** The field which this input will be bound to. */
    field: string;
};

export function useFormInput<
    TSchema extends FormSchema,
    TFieldName extends SchemaPath<TSchema>,
>(name: TFieldName) {
    const { control } = useFormContext<InferType<TSchema>>();
    const { field } = useController({ name, control, defaultValue: '' as any });
    return field;
};