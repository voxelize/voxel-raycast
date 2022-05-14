import { AABB } from './aabb';

function leadEdgeToInt(coord: number, step: number, epsilon: number) {
  return Math.floor(coord - step * epsilon);
}

function trailEdgeToInt(coord: number, step: number, epsilon: number) {
  return Math.floor(coord + step * epsilon);
}

function sweepCore(
  getVoxel: (vx: number, vy: number, vz: number) => boolean,
  box: AABB,
  vec: number[],
  callback: (
    cumulative: number,
    axis: number,
    dir: number,
    left: number[],
  ) => boolean,
  epsilon: number = 1e-10,
) {
  let t = 0;
  let maxT = 0;
  let axis = 0;
  let cumulativeT = 0;

  const step: number[] = [];
  const trail: number[] = [];
  const leadInt: number[] = [];
  const trailInt: number[] = [];
  const normed: number[] = [];
  const tDelta: number[] = [];
  const tNext: number[] = [];

  initSweep();
  if (maxT === 0) return 0;

  axis = stepForward();

  // Loop along raycast vector
  while (t <= maxT) {
    // Sweep over leading face of AABB
    if (checkCollision(axis)) {
      const done = handleCollision(axis);
      if (done) return cumulativeT;
    }

    axis = stepForward();
  }

  // Reached the end of the vector unobstructed, finish and exit
  cumulativeT += maxT;
  box.translate(vec);

  return cumulativeT;

  // Initialize for sweeping
  function initSweep() {
    t = 0;
    maxT = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);

    if (maxT === 0) return;

    for (let i = 0; i < 3; i++) {
      const dir = vec[i] >= 0;
      step[i] = dir ? 1 : -1;

      const min = box.getMin(i);
      const max = box.getMax(i);

      trail[i] = dir ? min : max;

      // Integer values of lead/trail edges
      let lead = dir ? max : min;
      leadInt[i] = leadEdgeToInt(lead, step[i], epsilon);
      trailInt[i] = trailEdgeToInt(trail[i], step[i], epsilon);

      // Normed vector
      normed[i] = vec[i] / maxT;

      // Distance along vector required to move one voxel in each axis
      tDelta[i] = Math.abs(1 / normed[i]);

      // Location of nearest voxel boundary, in units of t
      const dist = dir ? leadInt[i] + 1 - lead : lead - leadInt[i];
      tNext[i] = tDelta[i] < Infinity ? tDelta[i] * dist : Infinity;
    }
  }

  // Check for collisions - Iterate over the leading face on the advancing axis
  function checkCollision(axis: number) {
    const stepX = step[0];
    const x0 = axis === 0 ? leadInt[0] : trailInt[0];
    const x1 = leadInt[0] + stepX;

    const stepY = step[1];
    const y0 = axis === 1 ? leadInt[1] : trailInt[1];
    const y1 = leadInt[1] + stepY;

    const stepZ = step[2];
    const z0 = axis === 2 ? leadInt[2] : trailInt[2];
    const z1 = leadInt[2] + stepZ;

    for (let x = x0; x !== x1; x += stepX) {
      for (let y = y0; y !== y1; y += stepY) {
        for (let z = z0; z !== z1; z += stepZ) {
          if (getVoxel(x, y, z)) return true;
        }
      }
    }

    return false;
  }

  // On collision, call the callback and return or setup for the next sweep
  function handleCollision(axis: number) {
    cumulativeT += t;
    const dir = step[axis];

    // Vector moved so far, and left to move
    const done = t / maxT;
    const left: [number, number, number] = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      const dv = vec[i] * done;
      box.translateAxis(i, dv);
      left[i] = vec[i] - dv;
    }

    // Set leading edge of stepped axis exactly to the voxel boundary
    if (dir > 0) {
      box.setMax(axis, Math.round(box.getMax(axis)));
    } else {
      box.setMin(axis, Math.round(box.getMin(axis)));
    }

    // Callback to let client update the "left to go" vector
    const res = callback(cumulativeT, axis, dir, left);

    // Bail out on truthy response
    if (res) return true;

    // Init for new sweep along vector
    for (let i = 0; i < 3; i++) {
      vec[i] = left[i];
    }
    initSweep();
    if (maxT === 0) return true;

    return false;
  }

  // Advance to next voxel boundary, return which axis was stepped
  function stepForward() {
    const axis =
      tNext[0] < tNext[1]
        ? tNext[0] < tNext[2]
          ? 0
          : 2
        : tNext[1] < tNext[2]
        ? 1
        : 2;

    const dt = tNext[axis] - t;
    t = tNext[axis];
    leadInt[axis] += step[axis];
    tNext[axis] += tDelta[axis];

    for (let i = 0; i < 3; i++) {
      trail[i] += dt * normed[i];
      trailInt[i] = trailEdgeToInt(trail[i], step[i], epsilon);
    }

    return axis;
  }
}

export function sweep(
  // getVoxel: (vx: number, vy: number, vz: number) => AABB[],
  getVoxel: (vx: number, vy: number, vz: number) => boolean,
  box: AABB,
  dir: number[],
  callback: (
    cumulative: number,
    axis: number,
    dir: number,
    left: number[],
  ) => boolean,
  translate: boolean = true,
  epsilon: number = 1e-10,
) {
  // Run sweep implementation
  const vec = [...dir];
  const clone = box.clone();

  const dist = sweepCore(getVoxel, clone, vec, callback, epsilon);

  // Translate box by distance needed to update base vector
  if (translate) {
    for (let i = 0; i < 3; i++) {
      const result =
        dir[i] > 0
          ? clone.getMax(i) - box.getMax(i)
          : clone.getMin(i) - box.getMin(i);
      box.translateAxis(i, result);
    }
  }

  // Return value is total distance moved (not necessarily magnitude of [end]-[start])
  return dist;
}
