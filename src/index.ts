export class Engine {
  constructor() {}

  addBody = () => {};

  removeBody = () => {};

  update = (dt: number) => {};

  // private iterateBody = () => {};

  // private applyFluidForces = () => {};

  // private applyFrictionByAxis = () => {};

  // private processCollisions = () => {};

  // private tryAutoStepping = () => {};

  // private isBodyAsleep = () => {};
}

export * from './aabb';
// export * from './rigid-body';
export * from './sweep';
