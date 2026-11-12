// A camera rig for a scroll-driven web piece: poses at progress marks, one Catmull-Rom spline through the
// positions and one through the targets, an ease per beat, and a critically damped follow on the input.
// Pure (no DOM, no three) and self-contained: a delivery copies this file as written.

                                            
                                                                               
                    
                                                                    
             
                             
                 
                          
               
                                                                                   
              
                                                                                                                                                            
                                  
  
                                                                                         
                          
                
                                                                                                                                 
                  
                                                                                                                                     
                   
  
                   
                                                                            
                                      
                                                                                                                                                                                           
                                             
                                                                                                                                          
                            
                                           
                    
                               
                            
                                                                      
                           
  

const EASES                                        = {
  linear: (u) => u,
  in: (u) => u * u * u,
  out: (u) => 1 - (1 - u) * (1 - u) * (1 - u),
  inOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - 4 * (1 - u) * (1 - u) * (1 - u)),
};

/** 95% of a critically damped step from rest is reached at omega * t = 4.744 (1 - (1 + x) e^-x = 0.95). */
const SETTLE_95 = 4.743864518;

const isVec3 = (v         )            => Array.isArray(v) && v.length === 3 && v.every((n) => Number.isFinite(n));

/** Uniform Catmull-Rom through p1..p2 at u, with p0 and p3 its neighbours (mirrored at the ends by the caller). */
function catmullRom(p0        , p1        , p2        , p3        , u        )         {
  const u2 = u * u;
  const u3 = u2 * u;
  return 0.5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (3 * p1 - p0 - 3 * p2 + p3) * u3);
}

export function createRig(options            )      {
  const { poses, settle = 0.5, epsilon = 1e-4 } = options;
  if (!Array.isArray(poses) || poses.length < 2) throw new Error("web: createRig needs at least 2 poses");
  if (!(settle > 0) || !Number.isFinite(settle)) throw new Error(`web: createRig settle must be > 0 seconds, got ${settle}`);
  if (!(epsilon > 0)) throw new Error(`web: createRig epsilon must be > 0, got ${epsilon}`);
  const keys = Object.keys(poses[0].values ?? {}).sort();
  poses.forEach((p, i) => {
    if (!Number.isFinite(p.at)) throw new Error(`web: createRig pose ${i} needs a finite "at"`);
    if (i > 0 && !(p.at > poses[i - 1].at)) throw new Error(`web: createRig pose ${i} is at ${p.at}, not after pose ${i - 1} (${poses[i - 1].at})`);
    if (!isVec3(p.position) || !isVec3(p.target)) throw new Error(`web: createRig pose ${i} needs position and target as [x, y, z]`);
    if (p.ease !== undefined && typeof p.ease !== "function" && !(p.ease in EASES)) throw new Error(`web: createRig pose ${i} has an unknown ease ${JSON.stringify(p.ease)} (linear, in, out, inOut or a function)`);
    const own = Object.keys(p.values ?? {}).sort();
    if (own.join() !== keys.join() || own.some((k) => !Number.isFinite(p.values [k]))) throw new Error(`web: createRig pose ${i} must give the same values as pose 0 (${keys.join(", ") || "none"}), as finite numbers`);
  });
  const first = poses[0].at;
  const last = poses[poses.length - 1].at;
  const omega = SETTLE_95 / settle;
  const clamp = (p        ) => (p <= first ? first : p >= last ? last : p);
  // A point of the spline's control polygon; past either end, the end point mirrored through its neighbour (a straight run-in).
  const point = (get                     , i        )         => {
    if (i < 0) return 2 * get(poses[0]) - get(poses[1]);
    if (i >= poses.length) return 2 * get(poses[poses.length - 1]) - get(poses[poses.length - 2]);
    return get(poses[i]);
  };

  function sample(progress        )            {
    if (!Number.isFinite(progress)) throw new Error(`web: rig progress must be a finite number, got ${progress}`);
    const p = clamp(progress);
    let i = poses.length - 2;
    for (let k = 0; k < poses.length - 1; k++) {
      if (p < poses[k + 1].at) {
        i = k;
        break;
      }
    }
    const from = poses[i];
    const to = poses[i + 1];
    const ease = typeof from.ease === "function" ? from.ease : EASES[from.ease ?? "inOut"];
    const u = ease((p - from.at) / (to.at - from.at));
    const along = (get                     ) => catmullRom(point(get, i - 1), point(get, i), point(get, i + 1), point(get, i + 2), u);
    const vec = (pick                   )       => [along((q) => pick(q)[0]), along((q) => pick(q)[1]), along((q) => pick(q)[2])];
    const values                         = {};
    for (const k of keys) values[k] = from.values [k] + (to.values [k] - from.values [k]) * u;
    return { position: vec((q) => q.position), target: vec((q) => q.target), values };
  }

  let x = first; // the followed progress
  let v = 0; // its speed, in progress per second
  let moving = false;

  return {
    sample,
    follow(input, dt) {
      if (!Number.isFinite(input)) throw new Error(`web: rig input must be a finite number, got ${input}`);
      if (!(dt >= 0) || !Number.isFinite(dt)) throw new Error(`web: rig dt must be >= 0 seconds, got ${dt}`);
      const goal = clamp(input);
      // x'' = -2w x' - w^2 (x - goal), solved exactly over dt: no step size in the result.
      const d = x - goal;
      const c = v + omega * d;
      const e = Math.exp(-omega * dt);
      x = goal + (d + c * dt) * e;
      v = (v - omega * c * dt) * e;
      if (Math.abs(x - goal) <= epsilon && Math.abs(v) <= epsilon) {
        x = goal;
        v = 0;
      }
      moving = x !== goal || v !== 0;
      return moving;
    },
    jump(input) {
      if (!Number.isFinite(input)) throw new Error(`web: rig input must be a finite number, got ${input}`);
      x = clamp(input);
      v = 0;
      moving = false;
    },
    pose: () => sample(x),
    get progress() {
      return x;
    },
    get moving() {
      return moving;
    },
  };
}
