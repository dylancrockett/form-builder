import { useForm } from "react-hook-form";
import { InferType } from "yup";
import { FormSchema } from "..";

export interface IForm<
    TSchema extends FormSchema,
> {
    schema: TSchema;
};

export function Form<
    TSchema extends FormSchema,
>({ schema }: IForm<TSchema>) {
    //use form hook
    const form = useForm<InferType<TSchema>>({
        defaultValues: schema.getDefault(),
    });
    25565  
};