// The plumbing every web piece needs around its scene: `mount(el, inputs) → { update, destroy }` drawn on demand,
// with the first-frame rules a real page taught (textures uploaded before the first draw, a second draw before
// `onReady`, a redraw on the ResizeObserver's first report and when a swapped texture loads), the `smooth` input
// and a `destroy` that frees the renderer. No imports (the piece hands its three renderer in), so a delivery
// copies this file as written.

/** What the scaffold uses of a three `WebGLRenderer`. */
                            
                                
                                     
                                                                      
                                  
                                                                                                                                              
                  
                           
  
/** The inputs every scaffolded piece takes, beside its own. */
                              
                                                                                                                            
                   
                                                                                                      
                      
                                                              
                       
                                                                                                 
                                     
  
                        
                             
                                                                                                                         
             
                                   
                  
                                                                                                                       
                 
                                                                      
                
                 
                     
  
/** What a piece's setup returns. */
                        
                         
                                                                                                                                        
                                        
                                                                                                                                      
                                                                   
                                                                                                                 
                                                                                  
                                                                                                                          
                   
  
                          
                  
                                                   
                                      
                                                                    
                     
     
                                                                                                               
                                                                                                               
     
                            
  
                    
                                  
                 
                                                                     
                    
                    
                                                    
                     
                   
                                                                     
                
                 
                     
                                           
                 
  
                         
                                                     
                  
                                                                       
               
                                                          
               
  
                               
                                                                                       
                         
  

/**
 * Wraps a piece's setup into its `mount(el, inputs)`. `setup(ctx)` builds the scene (it may return a Promise, to
 * await a download) and returns `{ renderer, draw, resize?, update?, dispose? }`.
 */
export function scaffold                       (setup                                                   , options                  = {})                                                              {
  const { maxPixelRatio = 2 } = options;
  return function mount(el, given) {
    let inputs = { smooth: true, ...given }                      ;
    let piece                      ;
    let destroyed = false;
    let ready = false;
    let failed = false;
    let raf = 0;
    let frames = 0;
    let moving = false;
    let lastDraw = 0;
    let size = { width: 0, height: 0, pixelRatio: 0 };
    let last = { drawCalls: 0, triangles: 0 };
    let observer                            ;
    const pending        = []; // textures registered before the first frame

    const fail = (e         ) => {
      if (destroyed) return;
      if (ready || failed) throw e;
      failed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      inputs.onError?.(String((e         )?.message ?? e));
    };

    /** Sizes the renderer to the stage; true when the size changed. */
    const fit = ()          => {
      const next = {
        width: Math.max(1, el.clientWidth),
        height: Math.max(1, el.clientHeight),
        pixelRatio: inputs.pixelRatio ?? Math.min(globalThis.devicePixelRatio || 1, maxPixelRatio),
      };
      if (next.width === size.width && next.height === size.height && next.pixelRatio === size.pixelRatio) return false;
      size = next;
      piece .renderer.setPixelRatio(size.pixelRatio);
      piece .renderer.setSize(size.width, size.height, false);
      piece .resize?.(size.width, size.height, size.pixelRatio);
      return true;
    };

    const drawNow = () => {
      if (!piece || destroyed || failed) return;
      fit();
      const now = performance.now();
      const dt = moving ? Math.min(0.1, (now - lastDraw) / 1000) : 0;
      const { info } = piece.renderer;
      info.reset();
      moving = piece.draw({ inputs, dt, smooth: inputs.smooth !== false, first: frames === 0, ...size }) === true;
      frames++;
      lastDraw = now;
      last = { drawCalls: info.render.calls, triangles: info.render.triangles };
      if (moving) schedule();
    };

    const schedule = () => {
      if (raf || destroyed || failed || !piece) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        try {
          drawNow();
        } catch (e) {
          return fail(e);
        }
        // Ready only once a second frame is up: drawing on demand would otherwise leave a bad first frame until the visitor scrolls.
        if (!ready && !destroyed && !failed) {
          ready = true;
          inputs.onReady?.();
        }
      });
    };

    /** Uploads a texture now, or when its image has loaded, then redraws. */
    const adopt = (texture     ) => {
      const upload = (loaded         ) => {
        if (destroyed || !piece) return;
        if (loaded) texture.needsUpdate = true;
        piece.renderer.initTexture(texture);
        schedule();
      };
      const image = texture?.image;
      if (image && image.complete === false && typeof image.addEventListener === "function") image.addEventListener("load", () => upload(true), { once: true });
      else upload(false);
    };

    const ctx             = {
      el,
      get inputs() {
        return inputs;
      },
      invalidate: () => schedule(),
      texture(texture) {
        if (piece) adopt(texture);
        else pending.push(texture);
        return texture;
      },
    };

    const free = (made          ) => {
      made.dispose?.();
      made.renderer.dispose();
      made.renderer.forceContextLoss();
      made.renderer.domElement.remove();
    };

    const start = (made          ) => {
      if (destroyed) return free(made);
      piece = made;
      const canvas = made.renderer.domElement;
      canvas.style.display = "block";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      if (canvas.parentNode !== el) el.appendChild(canvas);
      // The scaffold resets the counters itself, once a frame, so a frame of several passes reports all its draw calls.
      made.renderer.info.autoReset = false;
      fit();
      for (const texture of pending.splice(0)) adopt(texture);
      cancelAnimationFrame(raf); // adopt asked for a frame; the first one is drawn here, now
      raf = 0;
      drawNow();
      schedule();
      let reported = false;
      observer = new ResizeObserver(() => {
        if (destroyed || failed) return;
        // Its first report always redraws (the layout may have settled after the first frame); later ones when the size changed.
        // Drawn here, not next frame: resizing clears the canvas.
        const first = !reported;
        reported = true;
        try {
          if (fit() || first) drawNow();
        } catch (e) {
          fail(e);
        }
      });
      observer.observe(el);
    };

    try {
      const made = setup(ctx);
      if (made && typeof (made                     ).then === "function") {
        (made                     ).then((p) => {
          try {
            start(p);
          } catch (e) {
            fail(e);
          }
        }, fail);
      } else start(made            );
    } catch (e) {
      // After the handle is returned, so a page that keeps it in onError's closure has it.
      queueMicrotask(() => fail(e));
    }

    return {
      update(partial) {
        if (destroyed) return;
        inputs = { ...inputs, ...partial };
        if (!piece || failed) return;
        piece.update?.(inputs, partial);
        schedule();
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        cancelAnimationFrame(raf);
        observer?.disconnect();
        if (piece) free(piece);
      },
      draw: drawNow,
      info: () => ({
        frames,
        ...last,
        geometries: piece?.renderer.info.memory.geometries ?? 0,
        textures: piece?.renderer.info.memory.textures ?? 0,
        ...size,
        ready,
      }),
    };
  };
}
