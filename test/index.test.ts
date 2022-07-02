import { raycastAABB } from '../src';
import { AABB } from '@voxelize/voxel-aabb';

console.log(
  raycastAABB(
    [0, 0, 0],
    [0, 0, 1],
    new AABB(-1, -1, -1, 1, 1, 1).translate([0, 0, 3]),
  ),
);
