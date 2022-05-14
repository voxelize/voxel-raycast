import { AABB } from './aabb';

// massive thanks to https://github.com/andyhall/voxel-physics-engine/blob/master/src/rigidBody.js

class RigidBody {
  public airDrag: number;
  public fluidDrag: number;

  public resting = [0, 0, 0];
  public velocity = [0, 0, 0];
  public inFluid = false;
  public ratioInFluid = 0;
  public forces = [0, 0, 0];
  public impulses = [0, 0, 0];
  public sleepFrameCount = 10 | 0;

  constructor(
    public aabb: AABB,
    public readonly mass: number,
    public readonly friction: number,
    public readonly restitution: number,
    public readonly gravityMultiplier: number,
    public autoStep: boolean,
    public onCollide?: (impacts?: number[]) => void,
    public onStep?: () => void,
  ) {
    this.airDrag = -1;
    this.fluidDrag = -1;
  }

  setPosition = (p: number[]) => {
    this.aabb.setPosition(p);
    this.markActive();
  };

  getPosition = () => {
    return [this.aabb.minX, this.aabb.minY, this.aabb.minZ];
  };

  applyForce = (f: number[]) => {
    this.forces[0] += f[0];
    this.forces[1] += f[1];
    this.forces[2] += f[2];
    this.markActive();
  };

  applyImpulse = (i: number[]) => {
    this.impulses[0] += i[0];
    this.impulses[1] += i[1];
    this.impulses[2] += i[2];
    this.markActive();
  };

  markActive = () => {
    this.sleepFrameCount = 10 | 0;
  };

  get atRestX() {
    return this.resting[0];
  }

  get atRestY() {
    return this.resting[1];
  }

  get atRestZ() {
    return this.resting[2];
  }
}

export { RigidBody };