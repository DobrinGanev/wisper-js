import { isType } from './types.js';


// Decorator to define the type `signature` for the decorated class or method.
export default function signature(parameterTypes, returnType) {
  if (!Array.isArray(parameterTypes) || !parameterTypes.every(isType) ||
      (returnType && !isType(returnType))) {
    throw new TypeError('`signature` takes array of parameter types, and an optional return type.');
  }

  return (target, key, descriptor) => {
    // Methods decorators receive three parameters.
    // Class decorators receive only one.
    const func = descriptor ? descriptor.value : target;

    func.parameterTypes = parameterTypes;
    func.returnType = returnType;
  };
}
