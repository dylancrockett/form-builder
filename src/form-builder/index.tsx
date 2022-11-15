import { Box } from "@mui/material";
import React from "react";
import { FieldPathValue, Path, useForm, FormProvider } from "react-hook-form";
import { InferType, ObjectSchema } from "yup";
import { ComponentPropsProvider } from "./utils/ComponentPropsProvider";
import { FormInputWidgetRenderer } from "./utils/FormInputWidget";

export type Expand<T> = T extends object ? T extends infer O ? { [K in keyof O]: Expand<O[K]> } : never : T;


export function getDeafult<T extends FormSchema>(schema: T): InferType<T> {
    return schema.getDefault();
};

export type SchemaPath<TSchema extends FormSchema> = Path<InferType<TSchema>>

/** A list of types which a form input can be registered to support. */
export interface FormFieldTypeMap {
    "boolean": boolean;
    "int": number;
    "decimal": number;
    "string": string;
    "datetime": Date;
    "date": Date;
    "time": Date;
};

export type FormFieldTypes = keyof FormFieldTypeMap;

type ResolvableTypes = boolean | string | number | object | Array<any> | Date | null | undefined;

type RegisterFieldValueResolver<
    T extends any, 
    TSchema extends FormSchema,
    TFieldName extends SchemaPath<TSchema>,
> = (value: Expand<InferType<TSchema>>) => T;

type RegisterDependantFieldResolver<
    T extends any,
    TSchema extends FormSchema,
> = [
    dependants: SchemaPath<TSchema>[] | SchemaPath<TSchema>,
    resolver: (values: Expand<InferType<TSchema>>) => T,
];

export type ComputableWidgetField<
    T extends any,
    TSchema extends FormSchema,
    TFieldName extends SchemaPath<TSchema> = never,
> = (
    T | RegisterDependantFieldResolver<T, TSchema>
    | (TFieldName extends SchemaPath<TSchema> ? RegisterFieldValueResolver<T, TSchema, TFieldName> : never)
);

export type ComputableWidgetProps<
    TProps extends {},
    TSchema extends FormSchema,
    TFieldName extends SchemaPath<TSchema> = never,
> = { [K in keyof TProps]: ComputableWidgetField<TProps[K], TSchema, TFieldName>; };

//reverse ComputableWidgetProps
export type ComputedWidgetProps<
    T extends {},
> = {
    [K in keyof T]: Exclude<T[K], ((value: any) => any) | [any, any]>; 
};

interface IFormLayoutWidget {
    /** Flex properties of the element. */
    readonly flex?: number;
    /** The maximum height of the element. */
    readonly maxHeight?: number | string;
    /** The maximum width of the element. */
    readonly maxWidth?: number | string;
    /** The minimum height of the element. */
    readonly minHeight?: number | string;
    /** The minimum width of the element. */
    readonly minWidth?: number | string;
    /** If the element should be hidden */
    readonly hidden?: boolean;
    /** CSS class name to apply to the element. */
    readonly className?: string;
};

type IFormLayoutWidgetComputable<TSchema extends FormSchema> = ComputableWidgetProps<IFormLayoutWidget, TSchema>;

/** Form Layout Base Widget. */
class FormLayoutWidget<TSchema extends FormSchema> {
    /** Widget Props in Computable Form */
    readonly propsDef?: IFormLayoutWidgetComputable<TSchema>;

    constructor(propsDef: IFormLayoutWidgetComputable<TSchema>) {
        this.propsDef = propsDef;
    };
};

//returns a union of valid custom widget names which can be used for a given schema and field
export type ValidInputWidgets<
    TSchema extends FormSchema,
    TFieldName extends SchemaPath<TSchema>,
    TInputWidgetDefs extends TInputWidgetDefinitionMap = {},
> = {
    [K in keyof TInputWidgetDefs]: FormFieldTypeMap[TInputWidgetDefs[K]["type"]] extends FieldPathValue<InferType<TSchema>, TFieldName> ? K : never;
}[keyof TInputWidgetDefs];

type IFormLayoutInputComputableProps<
    TSchema extends FormSchema,
    TFieldName extends SchemaPath<TSchema>,
> = ComputableWidgetProps<{
    /** Input label text. */
    readonly label?: string;
    /** If the input should be disabled */
    readonly disabled?: boolean;
    /** If the input should be required. */
    readonly required?: boolean;
    /** Helper text to be shown for input. */
    readonly helperText?: string;
    /** Placeholder to be shown for input. */
    readonly placeholder?: string;
} & IFormLayoutWidget, TSchema, TFieldName>;

type IFormLayoutInputComputableWidgitProps<
    TSchema extends FormSchema,
    TFieldName extends SchemaPath<TSchema>,
    TInputWidgetDefs extends TInputWidgetDefinitionMap = {},
    TInputWidgetName extends ValidInputWidgets<TSchema, TFieldName, TInputWidgetDefs> | undefined = undefined,
> = {
    [K in keyof TInputWidgetDefs]: string;
};

export interface IFormLayoutInputProps<
    TSchema extends FormSchema,
    TFieldName extends SchemaPath<TSchema>,
    TInputWidgetDefs extends TInputWidgetDefinitionMap = {},
    TInputWidgetName extends ValidInputWidgets<TSchema, TFieldName, TInputWidgetDefs> | undefined = undefined,
> extends IFormLayoutInputComputableProps<TSchema, TFieldName> {
    /** Path to the property in the schema this input maps to. */
    readonly name: TFieldName;
    /** If the option is either select or autocomplete provide a list of values or values + labels. */ 
    readonly widget?: TInputWidgetName;
};


export class FormLayoutInput<
    TSchema extends FormSchema,
    TFieldName extends SchemaPath<TSchema>,
    TInputWidgetDefs extends TInputWidgetDefinitionMap = {},
    TInputWidgetName extends ValidInputWidgets<TSchema, TFieldName, TInputWidgetDefs> | undefined = undefined,
> {
    readonly propsDef: IFormLayoutInputProps<TSchema, TFieldName, TInputWidgetDefs, TInputWidgetName>;

    constructor(props: IFormLayoutInputProps<TSchema, TFieldName, TInputWidgetDefs, TInputWidgetName>) {
        this.propsDef = props;
    };
};

export interface IFormLayoutContainerComputableProps<TSchema extends FormSchema> extends ComputableWidgetProps<IFormLayoutWidget, TSchema> {
    readonly items?: FormLayoutWidget<TSchema>[];
};  

interface IFormLayoutContainer<TSchema extends FormSchema> extends IFormLayoutContainerComputableProps<TSchema> {
    render(props: IFormLayoutContainerComputableProps<TSchema>): JSX.Element;
};  

abstract class FormLayoutContainer<TSchema extends FormSchema> extends FormLayoutWidget<TSchema> implements IFormLayoutContainer<TSchema> {
    readonly propsDef: IFormLayoutContainerComputableProps<TSchema>;
    
    constructor(props: IFormLayoutContainerComputableProps<TSchema>) {
        super(props);
        this.propsDef = props;
    };

    abstract render(props: IFormLayoutContainerComputableProps<TSchema>): JSX.Element;
};

class FormLayoutRow<TSchema extends FormSchema> extends FormLayoutContainer<TSchema> {
    render(props: IFormLayoutContainerComputableProps<TSchema>): JSX.Element {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    flex: '1', 
                    flexDirection: 'row',
                    "& > *:not(:last-child)": {
                        marginRight: '10px',
                    }
                }}
            >{props.items?.map(x => <FormWidgetRenderer>{x}</FormWidgetRenderer>)}</Box>
        );
    };
};

class FormLayoutComponent<TSchema extends FormSchema, TProps extends {}, TComponent extends React.FC<TProps>> extends FormLayoutContainer<TSchema> {
    readonly component: TComponent; 
    
    constructor(props: ComputableWidgetProps<TProps, TSchema>, component: TComponent) {
        super(props);
        this.component = component;
    };

    render() {
        const Component = this.component
        return <ComponentPropsProvider propsDef={this.propsDef}>{(props: any) => <Component {...props}/>}</ComponentPropsProvider>;
    };
};


class FormLayoutCol<TSchema extends FormSchema> extends FormLayoutContainer<TSchema> {
    render(props: IFormLayoutContainerComputableProps<TSchema>) {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    "& > *:not(:last-child)": {
                        marginBottom: '10px',
                    },
                }}
            >{props.items?.map(x => <FormWidgetRenderer>{x}</FormWidgetRenderer>)}</Box>
        );
    };
};

type FormWidgetReactNodeProps = { children?: React.ReactNode; };
type FormWidgetReactNode<TProps extends object = {}, TPropsWithNode extends TProps & FormWidgetReactNodeProps = TProps & FormWidgetReactNodeProps> = { 
    key: React.Key | null;
    type: 'form-container-node' | 'form-input-node'; 
    props: TPropsWithNode; 
    widget: (props: TProps) => FormLayoutWidget<any> | FormLayoutInput<any, any>;
};

export type FormLayoutBuilder<
    TSchema extends FormSchema,
    Props extends IFormLayoutWidgetComputable<TSchema>, 
    PropsWithNodeProps extends Props & FormWidgetReactNodeProps = Props & FormWidgetReactNodeProps,
> = (props: PropsWithNodeProps) => FormWidgetReactNode<PropsWithNodeProps>;

export type FormLayoutContainerBuilder<TSchema extends FormSchema> = FormLayoutBuilder<TSchema, IFormLayoutWidgetComputable<TSchema>>;


export type FormLayoutInputBuilder<
    TSchema extends FormSchema,
    TInputWidgetDefs extends TInputWidgetDefinitionMap,
> = <
    TFieldName extends SchemaPath<TSchema>,
    TInputWidgetName extends ValidInputWidgets<TSchema, TFieldName, TInputWidgetDefs> | undefined = undefined,
>(props: IFormLayoutInputProps<TSchema, TFieldName, TInputWidgetDefs, TInputWidgetName>) => FormWidgetReactNode<IFormLayoutInputProps<TSchema, TFieldName, TInputWidgetDefs> & FormWidgetReactNodeProps>;

// export type FormLayoutInputBuilder<
//     TSchema extends ObjSchema,
//     TInputWidgetDefs extends TWidgetDefinitionMap,
// > = <TField extends FieldPath<InferType<TSchema>> = FieldPath<InferType<TSchema>>>(props: IFormLayoutInput<TSchema, TField, TInputWidgetDefs>) => FormLayoutInput<TSchema, TField, TInputWidgetDefs>;

export type FormLayoutDefinitionBuilder<
    TSchema extends FormSchema,
    TInputWidgetDefs extends TInputWidgetDefinitionMap,    
    TContainerWidgetDefs extends TContainerWidgetDefinitionMap,
> = (widgets: {
    Row: FormLayoutContainerBuilder<TSchema>;
    Col: FormLayoutContainerBuilder<TSchema>;
    Input: FormLayoutInputBuilder<TSchema, TInputWidgetDefs>;
} & TContainerWidgetDefs) => FormLayoutWidget<TSchema> | JSX.Element;

//export type FormLayoutDefinition<TSchema extends ObjSchema> = FormLayoutRow<TSchema> | FormLayoutCol<TSchema>;

export interface FormDefinition<TSchema extends FormSchema> {
    readonly schema: TSchema;
    readonly layout: FormLayoutWidget<TSchema>;
};

export type FormSchema = ObjectSchema<any, any, any, any>;

interface TWidgetDefinition<TData extends FormFieldTypes = FormFieldTypes> {
    readonly type: TData;
    readonly render: () => React.ReactNode;
};

export type TInputWidgetDefinitionMap = {
    [K in string]: TWidgetDefinition;
};


//type TContainerWidgetDefinitionProps = React.PropsWithChildren<{}> & IFormLayoutWidget<TSchema>;
type TContainerWidgetDefinition<T extends React.PropsWithChildren<{}> = React.PropsWithChildren<{}>> = (props: T) => JSX.Element;

type TContainerWidgetDefinitionMap = {
    [K in string]: TContainerWidgetDefinition;
}

export interface ICreateFormProps<
    TSchema extends FormSchema,
    TInputWidgetDefs extends TInputWidgetDefinitionMap,
    TContainerWidgetDefs extends TContainerWidgetDefinitionMap,
> {
    /** Form Schema created with Yup */
    readonly schema: TSchema; 
    /** Form layout definition. */
    readonly layout: FormLayoutDefinitionBuilder<TSchema, TInputWidgetDefs, TContainerWidgetDefs>;
    /** Input Widget Definitions. */
    readonly inputWidgets: TInputWidgetDefs;
    /** Container Widget Definitions. */
    readonly layoutWidgets?: TContainerWidgetDefs;
};

export function createForm<
    TSchema extends FormSchema, 
    TInputWidgetDefs extends TInputWidgetDefinitionMap,
    TContainerWidgetDefs extends TContainerWidgetDefinitionMap,
>({ schema, layout, inputWidgets, layoutWidgets }: ICreateFormProps<TSchema, TInputWidgetDefs, TContainerWidgetDefs>): FormDefinition<TSchema> & { readonly inputWidgets: TInputWidgetDefs } {
    //layout builders
    const Row: FormLayoutContainerBuilder<TSchema> = (props) => ({
        key: null, type: 'form-container-node', props,
        widget: (props) => new FormLayoutRow(props),
    });

    const Col: FormLayoutContainerBuilder<TSchema> = (props) => ({
        key: null, type: 'form-container-node', props,
        widget: (props) => new FormLayoutCol(props),
    });

    const Input: FormLayoutInputBuilder<TSchema, TInputWidgetDefs> = (props) => ({
        key: null, type: 'form-input-node', props: (props as any),
        widget: (props) => new FormLayoutInput(props as any),
    });
    
    const layoutWidgetBuilders = (layoutWidgets ?? []).map(layoutWidget => (props: any) => ({
       key: null, type: 'form-container-node', props: (props as any),
       widget: (props: any) => new FormLayoutComponent(props as any, layoutWidget) 
    }));

    //layout generation result
    const layoutGenResult = layout({ Row, Col, Input, ...layoutWidgetBuilders } as any);

    return {
        schema,
        layout: layoutGenResult instanceof FormLayoutWidget ? layoutGenResult : convertJSXtoWidgetTree(layoutGenResult),
        inputWidgets,
    };
};

class JSXToWidgetError extends Error {}

//convert a React JSX tree to a widget tree
export const convertJSXtoWidgetTree = (node: React.ReactElement<FormWidgetReactNode, any>): FormLayoutWidget<any> => {
    //get the FormWidgetReactNode
    const widgetNode = node.type(node.props);

    //form layout widget
    if (widgetNode.type === 'form-container-node') {
        //get JSX node's children
        const mixedChildren: React.ReactElement<FormWidgetReactNode, any> | React.ReactElement<FormWidgetReactNode, any>[] = widgetNode.props.children ?? [];
        const children = Array.isArray(mixedChildren) ? mixedChildren : [mixedChildren]; 

        //convert each JSX child to a widget
        const widgetChildren = children.map(x => convertJSXtoWidgetTree(x));

        //create the container widget
        return widgetNode.widget({ ...widgetNode.props, items: [...widgetChildren, ...(widgetNode.props.items ?? [])] });
    } 
    //form input widget
    else if (widgetNode.type === 'form-input-node') {
        //return the field widget
        return widgetNode.widget(widgetNode.props);
    } 
    //generic react element
    else {
        
    }
    
    //throw and error if the JSX passed is not parseable
    throw new JSXToWidgetError();
};

export const FormWidgetRenderer = ({ children: widget }: { children: FormLayoutWidget<any> }) => {
    if (widget instanceof FormLayoutContainer) {
        return widget.render(widget.propsDef);
    } else if (widget instanceof FormLayoutInput) {
        return <FormInputWidgetRenderer widget={widget}/>
    }

    return null;
};

export const FormRenderer = ({ definition }: { definition: FormDefinition<any>}) => {
    const state = useForm({
        mode: 'all',
        defaultValues: definition.schema.getDefault(),
    });

    return <FormProvider {...state}><FormWidgetRenderer>{definition.layout}</FormWidgetRenderer></FormProvider>;
};