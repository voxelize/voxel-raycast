import { AABB } from '@voxelize/voxel-aabb';

export function raycastAABB(
  origin: number[],
  normal: number[],
  aabb: AABB,
  maxDistance: number = Infinity,
): number {
  const [nx, ny, nz] = normal;

  const t1 = (aabb.minX - origin[0]) / nx;
  const t2 = (aabb.maxX - origin[0]) / nx;
  const t3 = (aabb.minY - origin[1]) / ny;
  const t4 = (aabb.maxY - origin[1]) / ny;
  const t5 = (aabb.minZ - origin[2]) / nz;
  const t6 = (aabb.maxZ - origin[2]) / nz;

  const tMin = Math.max(
    Math.max(Math.min(t1, t2), Math.min(t3, t4)),
    Math.min(t5, t6),
  );
  const tMax = Math.min(
    Math.min(Math.max(t1, t2), Math.max(t3, t4)),
    Math.max(t5, t6),
  );

  // if tMax < 0, ray (line) is intersecting AABB, but whole AABB is behind us
  if (tMax < 0) {
    return -1;
  }

  // if tMin > tMax, ray doesn't intersect AABB
  if (tMin > tMax) {
    return -1;
  }

  if (tMin < 0) {
    if (tMax > maxDistance) {
      return -1;
    }

    return tMax;
  }

  if (tMin > maxDistance) {
    return -1;
  }

  return tMin;
}

export function raycast(
  getVoxel: (vx: number, vy: number, vz: number) => AABB[],
  origin: number[],
  direction: number[],
  maxDistance: number,
): { point: number[]; normal: number[]; voxel: number[] } | null {
  let dx = +direction[0];
  let dy = +direction[1];
  let dz = +direction[2];
  const ds = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (ds === 0) {
    throw new Error("Can't raycast along a zero vector");
  }

  dx /= ds;
  dy /= ds;
  dz /= ds;

  const [px, py, pz] = origin;

  let t = 0.0;
  let ix = Math.floor(px) | 0;
  let iy = Math.floor(py) | 0;
  let iz = Math.floor(pz) | 0;

  const stepX = dx > 0 ? 1 : -1;
  const stepY = dy > 0 ? 1 : -1;
  const stepZ = dz > 0 ? 1 : -1;

  const txDelta = Math.abs(1 / dx);
  const tyDelta = Math.abs(1 / dy);
  const tzDelta = Math.abs(1 / dz);

  const xDist = stepX > 0 ? ix + 1 - px : px - ix;
  const yDist = stepY > 0 ? iy + 1 - py : py - iy;
  const zDist = stepZ > 0 ? iz + 1 - pz : pz - iz;

  let txMax = txDelta < Infinity ? txDelta * xDist : Infinity;
  let tyMax = tyDelta < Infinity ? tyDelta * yDist : Infinity;
  let tzMax = tzDelta < Infinity ? tzDelta * zDist : Infinity;

  let steppedIndex = -1;

  while (t <= maxDistance) {
    // exit check
    const aabbs = getVoxel(ix, iy, iz);

    let hit = -1;
    aabbs.forEach((aabb) => {
      const dT = raycastAABB(
        origin,
        [dx, dy, dz],
        aabb.clone().translate([ix, iy, iz]),
        maxDistance - t,
      );
      if (dT !== -1) {
        hit = dT;
      }
    });

    if (hit !== -1) {
      return {
        point: [px + hit * dx, py + hit * dy, pz + hit * dz],
        normal: [
          steppedIndex === 0 ? -stepX : 0,
          steppedIndex === 1 ? -stepY : 0,
          steppedIndex === 2 ? -stepZ : 0,
        ],
        voxel: [ix, iy, iz],
      };
    }

    // advance t to next nearest voxel boundary
    if (txMax < tyMax) {
      if (txMax < tzMax) {
        ix += stepX;
        t = txMax;
        txMax += txDelta;
        steppedIndex = 0;
      } else {
        iz += stepZ;
        t = tzMax;
        tzMax += tzDelta;
        steppedIndex = 2;
      }
    } else {
      if (tyMax < tzMax) {
        iy += stepY;
        t = tyMax;
        tyMax += tyDelta;
        steppedIndex = 1;
      } else {
        iz += stepZ;
        t = tzMax;
        tzMax += tzDelta;
        steppedIndex = 2;
      }
    }
  }

  return null;
}
