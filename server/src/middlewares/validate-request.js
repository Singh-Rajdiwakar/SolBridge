export function validateRequest(schema, target = "body") {
  return (req, _res, next) => {
    try {
      req[target] = schema.parse(req[target]);
      next();
    } catch (error) {
      next(error);
    }
  };
}
