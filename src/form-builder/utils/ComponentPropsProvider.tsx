import { FormSchema, ComputableWidgetProps } from '../index';
import { useCalculateWidgetProps } from './useCalculateWidgetProps';

export const ComponentPropsProvider = <
    TProps extends {},
    TSchema extends FormSchema,
    TComputableProps extends ComputableWidgetProps<TProps, TSchema>,
>({ propsDef, children }: { propsDef: TComputableProps, children: (props: TProps) => JSX.Element }) => {
    const props = useCalculateWidgetProps({ ...propsDef, name: '' }) as TProps;
    return children(props); 
}