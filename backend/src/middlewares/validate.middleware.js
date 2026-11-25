
const validate = (schema) => {
  return (req, res, next) => {
    // Support both schema formats:
    // 1. Schemas that validate req.body directly
    // 2. Schemas that validate { body, params, query }

    const input = {
      body: req.body,
      params: req.params,
      query: req.query,
    };

    const result = schema.safeParse(input);

    let validatedData;

    if (result.success) {
      // Schema expects { body, params, query }
      validatedData = result.data.body;
    } else {
      // Try the original format for backward compatibility
      const bodyResult = schema.safeParse(req.body);

      if (!bodyResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: bodyResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      validatedData = bodyResult.data;
    }

    // Replace request body with validated data
    req.body = validatedData;

    next();
  };
};

export default validate;
