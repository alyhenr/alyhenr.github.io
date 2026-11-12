// The idle clock of a web piece: the time its idle life (a light passing, windows blinking, a slow sway) is a pure
// function of. It starts at 0, where the scene must equal the still scene, runs at a capped frame rate, pauses when
// nobody can see the piece and stays at 0 under reduced motion. Self-contained: a delivery copies this file as written.

                           
                                                                 
               
                                                                                                             
                  
  
                         
                                                         
                    
                                                       
                     
                                                                                            
                          
                                                                                                              
                    
  
                    
                                                                              
                        
                                                                                              
                        
                                                                                       
                            
                                                                                       
                              
     
                                                                                                                   
                                                                                                                           
     
                             
                                                                                                                                     
                           
     
                                                                                                                  
                                                                                                                   
                                               
     
                                                   
  

/** The longest step one tick adds, in seconds: a stalled frame doesn't fling the idle motion forward. */
const MAX_STEP = 0.1;

export function createIdle(options              = {})       {
  const { fps = 30, fadeIn = 2 } = options;
  if (!(fps > 0) || !Number.isFinite(fps)) throw new Error(`web: createIdle fps must be > 0, got ${fps}`);
  if (!(fadeIn >= 0)) throw new Error(`web: createIdle fadeIn must be >= 0 seconds, got ${fadeIn}`);
  // A display's frames land a hair early or late: a frame is due a millisecond before its exact time.
  const frame = 1000 / fps - 1;
  const state = { visible: true, onScreen: true, reducedMotion: false, enabled: true };
  let time = 0;
  let last                    ; // the timestamp of the last frame drawn while running
  let owed = false; // one draw to show the clock back at 0
  const off = () => state.reducedMotion || !state.enabled;
  const running = () => state.visible && state.onScreen && !off();
  let changed = () => {}; // set by watch: a change of state may need a frame

  const idle       = {
    get time() {
      return time;
    },
    get gain() {
      if (fadeIn === 0) return time > 0 ? 1 : 0;
      const u = Math.min(1, time / fadeIn);
      return u * u * (3 - 2 * u);
    },
    get running() {
      return running();
    },
    set(next) {
      for (const k of ["visible", "onScreen", "reducedMotion", "enabled"]         ) {
        if (next[k] !== undefined) state[k] = next[k] === true;
      }
      if (!running()) last = undefined;
      if (off() && time !== 0) {
        time = 0;
        owed = true;
      }
      changed();
    },
    tick(now) {
      if (!running()) {
        const draw = owed;
        owed = false;
        return draw;
      }
      owed = false;
      if (last === undefined) {
        last = now;
        return false;
      }
      const elapsed = now - last;
      if (elapsed < frame) return false;
      last = now;
      time += Math.min(MAX_STEP, elapsed / 1000);
      return true;
    },
    seek(to) {
      if (!(to >= 0) || !Number.isFinite(to)) throw new Error(`web: idle seek needs seconds >= 0, got ${to}`);
      time = to;
      last = undefined;
      owed = false;
    },
    watch(el, draw) {
      let raf = 0;
      let stopped = false;
      const loop = (now        ) => {
        raf = 0;
        if (stopped) return;
        if (idle.tick(now)) draw();
        if (running()) raf = requestAnimationFrame(loop);
      };
      // One frame after any change: it starts the loop when the clock runs again, and draws the still scene once when it went off.
      const wake = () => {
        if (!raf && !stopped) raf = requestAnimationFrame(loop);
      };
      changed = wake;
      const onVisibility = () => idle.set({ visible: document.visibilityState !== "hidden" });
      const media = matchMedia("(prefers-reduced-motion: reduce)");
      const onMedia = () => idle.set({ reducedMotion: media.matches });
      const observer = new IntersectionObserver((entries) => idle.set({ onScreen: entries[entries.length - 1].isIntersecting }));
      document.addEventListener("visibilitychange", onVisibility);
      media.addEventListener("change", onMedia);
      observer.observe(el);
      idle.set({ visible: document.visibilityState !== "hidden", reducedMotion: media.matches });
      return () => {
        stopped = true;
        changed = () => {};
        cancelAnimationFrame(raf);
        document.removeEventListener("visibilitychange", onVisibility);
        media.removeEventListener("change", onMedia);
        observer.disconnect();
      };
    },
  };
  return idle;
}
