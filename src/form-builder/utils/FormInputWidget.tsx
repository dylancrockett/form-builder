import { TextField } from '@mui/material';
import { memo } from 'react';
import { FormSchema, SchemaPath, FormLayoutInput, ValidInputWidgets, TInputWidgetDefinitionMap } from '../index';
import { useCalculateWidgetProps } from './useCalculateWidgetProps';
import { useFormInput } from './useFormWidget';

export const FormInputWidgetRenderer = memo(<
    TSchema extends FormSchema,
    TFieldName extends SchemaPath<TSchema>,
    TInputWidgetDefs extends TInputWidgetDefinitionMap = {},
    TInputWidgetName extends ValidInputWidgets<TSchema, TFieldName, TInputWidgetDefs> | undefined = undefined,
>({ widget: { propsDef } }: { widget: FormLayoutInput<TSchema, TFieldName, TInputWidgetDefs, TInputWidgetName> }) => {
    const bind = useFormInput(propsDef.name)
    const props = useCalculateWidgetProps(propsDef);

    console.log(propsDef.name)
    console.log(props)

    return <TextField key={propsDef.name} {...{...bind, ...props}}/>;
});