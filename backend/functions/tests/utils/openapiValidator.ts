import Ajv from "ajv";
import addFormats from "ajv-formats";

/**
 * Get schema object from a JSON pointer reference
 * Example: "#/components/schemas/User" -> spec.components.schemas.User
 */
function getSchemaFromRef(spec: any, ref: string): any {
  if (!ref.startsWith("#/")) {
    throw new Error(`Invalid schema reference: ${ref}. Must start with #/`);
  }

  const path = ref.substring(2).split("/");
  let current = spec;

  for (const key of path) {
    if (current === null || current === undefined) {
      return null;
    }
    current = current[key];
  }

  return current;
}

/**
 * Validate a response body against an OpenAPI schema reference
 * Registers all component schemas to allow Ajv to resolve $ref pointers
 *
 * @param data - The response body to validate
 * @param schemaRef - JSON pointer to schema (e.g., "#/components/schemas/User")
 * @param spec - The full OpenAPI specification object
 */
export function validateResponse(data: any, schemaRef: string, spec: any): void {
  // Create fresh Ajv instance for validation
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateSchema: false, // Prevent errors on non-standard OpenAPI keywords
    verbose: true,
  });
  addFormats(ajv);

  // Step 1: Register all component schemas to resolve internal $refs
  // This allows Ajv to resolve references like { "$ref": "#/components/schemas/TipTapDoc" }
  if (spec?.components?.schemas) {
    for (const [name, schema] of Object.entries(spec.components.schemas)) {
      try {
        // Register with the exact ID format used in $ref pointers
        ajv.addSchema(schema as any, `#/components/schemas/${name}`);
      } catch (error) {
        // Ignore errors from duplicate registrations or invalid schemas
        // This prevents crashes during test reruns
      }
    }
  }

  // Step 2: Get the specific schema we want to validate against
  const targetSchema = getSchemaFromRef(spec, schemaRef);
  if (!targetSchema) {
    throw new Error(`Schema not found in spec: ${schemaRef}`);
  }

  // Step 3: Compile and validate
  // Ajv will automatically resolve any $ref pointers using the registered schemas
  const validate = ajv.compile(targetSchema as any);
  const valid = validate(data);

  if (!valid) {
    // Enhanced error reporting for debugging
    console.error(`❌ Validation failed for ${schemaRef}`);
    console.error("Response Data:", JSON.stringify(data, null, 2));
    console.error("Validation Errors:", ajv.errorsText(validate.errors));

    // Provide detailed error information
    if (validate.errors) {
      console.error("Detailed Errors:", JSON.stringify(validate.errors, null, 2));
    }

    throw new Error(`Schema validation failed: ${ajv.errorsText(validate.errors)}`);
  }
}
