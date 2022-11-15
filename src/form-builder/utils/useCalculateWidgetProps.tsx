import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { IFormLayoutInputProps, TInputWidgetDefinitionMap, ValidInputWidgets, FormSchema, SchemaPath, ComputedWidgetProps } from "../index";

type PropsDefUpdateMap = {
    [K in string]: ([string, (values: any) => any])[];
};

//watch changes in form state
export function useCalculateWidgetProps<
    TSchema extends FormSchema,
    TFieldName extends SchemaPath<TSchema>,
    TInputWidgetDefs extends TInputWidgetDefinitionMap = {},
    TInputWidgetName extends ValidInputWidgets<TSchema, TFieldName, TInputWidgetDefs> | undefined = undefined,
    TPropsDef = IFormLayoutInputProps<TSchema, TFieldName, TInputWidgetDefs, TInputWidgetName>,
    TProps = ComputedWidgetProps<TPropsDef>,
>(propsDef: TPropsDef): TProps {
    //get watch from form context
    const { watch, getValues } = useFormContext();

    // widget's computed props
    const [computedProps, setComputedProps] = useState<TProps>((() => {
        const currentValues = getValues();
        let props: any = {};
        
        for (const key in propsDef) {
            const prop = propsDef[key as keyof TPropsDef];

            if (typeof prop === "function") {
                props[key] = prop(currentValues);
            } else if (Array.isArray(prop) && typeof prop[0] === "string" && typeof prop[1] === "function") {
                props[key] = prop[1](currentValues);
            } else if (Array.isArray(prop) && (Array.isArray(prop[0]) && typeof prop[0][0] === "string") && typeof prop[1] === "function") {
                props[key] = prop[1](currentValues)
            } else {
                props[key] = propsDef[key]; 
            }
        }

        return props;
    })() as any);

    //ref to computedProps
    const computedPropsRef = useRef(computedProps);
    computedPropsRef.current = computedProps;

    //compute a easily accessible map of field -> props to be computed
    const updateMap = useMemo(() => {
        const map: PropsDefUpdateMap = {};

        const register = (field: string, propKey: string, compute: (values: any) => any) => {
            console.log(map[field]);
            map[field] = [...(map[field] ?? []), ([propKey, compute])];
            console.log(map[field]);
        };

        for (const key in propsDef) {
            const prop = propsDef[key as keyof TPropsDef];

            if (typeof prop === "function") {
                register((propsDef as any).name as unknown as string, key, prop as any);
            } else if (Array.isArray(prop) && typeof prop[0] === "string" && typeof prop[1] === "function") {
                register(prop[0], key, prop[1] as any);
            } else if (Array.isArray(prop) && (Array.isArray(prop[0]) && typeof prop[0][0] === "string") && typeof prop[1] === "function") {
                for (const fieldName of prop[0]) register(fieldName, key, prop[1] as any);
            }
        }

        return map;
    }, [propsDef]);

    //ref to updateMap
    const updateMapRef = useRef(updateMap);
    updateMapRef.current = updateMap;

    //register to with form watch
    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            //check if the field updated has registered props to be computed
            if (name && updateMapRef.current[name] !== undefined) {
                //compute props given current form values
                const currentValues = getValues();
                const computed = updateMapRef.current[name].map(([prop, compute]): [string, any] => [prop, compute(currentValues)]);

                setComputedProps(props => {
                    //check if any of the props changed values
                    const hasChanged = computed.some(([prop, value]) => {
                        return props[prop as keyof TProps] !== value;
                    });

                    //dont update props since there was no change
                    if (!hasChanged) return props;
                    
                    //update props
                    return {
                        ...props,
                        ...(computed.reduce((x, [prop, value]) => ({ ...x, [prop]: value }), {})),
                    };
                });
            };
        });

        return () => subscription.unsubscribe();
    }, []);

    return computedProps;
};