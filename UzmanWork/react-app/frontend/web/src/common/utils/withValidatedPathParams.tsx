import { Navigate, useParams } from "react-router-dom";
import { z, ZodSchema } from "zod";
import { ComponentType } from "react";

export const IntParam = z.coerce.number().int();
export const OptionalIntParam = IntParam.optional();
export const StringParam = z.string();
export const OptionalStringParam = StringParam.optional();

function useValidatedPathParams<SchemaType>(
  schema: ZodSchema<SchemaType>
): SchemaType | null {
  const params = useParams();
  const result = schema.safeParse(params);

  if (!result.success) {
    console.error("Validation errors:", result.error.issues);
    return null;
  }

  return result.data;
}

export function withValidatedPathParams<PageProps, PathValidationSchemaType>(
  Component: ComponentType<PageProps & PathValidationSchemaType>,
  schema: ZodSchema<PathValidationSchemaType>
) {
  const ComponentWithValidatedPathParams = function (props: PageProps) {
    const params = useValidatedPathParams<PathValidationSchemaType>(schema);
    if (!params) {
      return <Navigate to="/404" replace />;
    }
    return <Component {...props} {...params} />;
  };

  const name = Component.displayName ?? Component.name ?? "Component";
  ComponentWithValidatedPathParams.displayName = `WithValidatedPathParams(${name})`;

  return ComponentWithValidatedPathParams;
}
