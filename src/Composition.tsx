import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import React, { useRef, useEffect } from 'react';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const VS = `
  attribute vec2 a_pos;
  void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FS = `
  precision highp float;

  uniform vec2  u_res;
  uniform float u_time;
  uniform vec2  u_mouse;

  // ── Hash & noise ──
  vec2 hash2(vec2 p){
    p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
    return -1.0 + 2.0*fract(sin(p)*43758.5453123);
  }

  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(dot(hash2(i+vec2(0,0)),f-vec2(0,0)),
                   dot(hash2(i+vec2(1,0)),f-vec2(1,0)),u.x),
               mix(dot(hash2(i+vec2(0,1)),f-vec2(0,1)),
                   dot(hash2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);
  }

  float fbm(vec2 p, int oct){
    float v=0.0, a=0.5;
    mat2 m = mat2(1.6,1.2,-1.2,1.6);
    for(int i=0;i<8;i++){
      if(i>=oct) break;
      v += a*noise(p);
      p = m*p;
      a *= 0.5;
    }
    return v;
  }

  // ── Metallic color ──
  vec3 metalColor(float t, float spec){
    // deep ocean-blue steel palette
    vec3 dark   = vec3(0.01, 0.04, 0.12);
    vec3 mid    = vec3(0.02, 0.15, 0.38);
    vec3 bright = vec3(0.18, 0.55, 0.90);
    vec3 white  = vec3(0.75, 0.92, 1.00);

    t = clamp(t*0.5+0.5, 0.0, 1.0);

    vec3 col;
    if(t < 0.33)      col = mix(dark,  mid,    t/0.33);
    else if(t < 0.66) col = mix(mid,   bright, (t-0.33)/0.33);
    else              col = mix(bright, white,  (t-0.66)/0.34);

    // specular hotspot
    col += white * pow(spec, 6.0) * 0.9;
    return col;
  }

  void main(){
    vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / min(u_res.x, u_res.y);

    // mouse warp
    vec2 mouse = (u_mouse - 0.5*u_res) / min(u_res.x,u_res.y);
    float md = length(uv - mouse);
    float mwarp = exp(-md*md*3.0) * 0.18;
    vec2 mdir = normalize(uv - mouse + 0.0001);
    uv += mdir * mwarp;

    float t = u_time;

    // layered flow distortion
    vec2 q;
    q.x = fbm(uv + vec2(0.0, 0.0), 6);
    q.y = fbm(uv + vec2(5.2, 1.3), 6);

    vec2 r;
    r.x = fbm(uv + 4.0*q + vec2(1.7+t*0.05, 9.2), 6);
    r.y = fbm(uv + 4.0*q + vec2(8.3+t*0.03, 2.8), 6);

    // slow time drift
    vec2 s;
    s.x = fbm(uv + 3.5*r + vec2(t*0.04, t*-0.02), 5);
    s.y = fbm(uv + 3.5*r + vec2(t*-0.03, t*0.04+1.5), 5);

    float f = fbm(uv + 3.0*s, 6);

    // normal approximation for lighting
    float eps = 0.004;
    float fx = fbm(uv + 3.0*s + vec2(eps,0.0), 6);
    float fy = fbm(uv + 3.0*s + vec2(0.0,eps), 6);
    vec3 normal = normalize(vec3(f-fx, f-fy, 0.002));

    // multiple light sources
    vec3 L1 = normalize(vec3( 0.8, 0.6, 1.0));
    vec3 L2 = normalize(vec3(-0.6, -0.3, 0.8));
    vec3 L3 = normalize(vec3( 0.0, -0.9, 0.6));
    float diff1 = max(dot(normal, L1), 0.0);
    float diff2 = max(dot(normal, L2), 0.0) * 0.4;
    float diff3 = max(dot(normal, L3), 0.0) * 0.25;

    // view-dependent specular
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 H1 = normalize(L1+V);
    vec3 H2 = normalize(L2+V);
    float spec1 = pow(max(dot(normal,H1),0.0), 32.0);
    float spec2 = pow(max(dot(normal,H2),0.0), 18.0) * 0.5;

    float lighting = diff1 + diff2 + diff3;
    float spec     = spec1 + spec2;

    // base metallic value
    float val = f * 0.6 + lighting * 0.55 - 0.1;

    vec3 col = metalColor(val, spec);

    // subtle chromatic edge
    float edge = length(vec2(f-fx, f-fy)/eps);
    col += vec3(0.05, 0.18, 0.35) * smoothstep(0.3, 1.2, edge) * 0.25;

    // vignette
    float vign = 1.0 - 0.55*dot(uv*0.9,uv*0.9);
    col *= vign;

    gl_FragColor = vec4(clamp(col,0.0,1.0), 1.0);
  }
`;

const LiquidMetal: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<{
    uRes: WebGLUniformLocation | null;
    uTime: WebGLUniformLocation | null;
    uMouse: WebGLUniformLocation | null;
  }>({ uRes: null, uTime: null, uMouse: null });
  const bufferRef = useRef<WebGLBuffer | null>(null);

  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Full-screen 16:9 scaling math
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') as WebGLRenderingContext | null|| canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;
    glRef.current = gl;

    const compile = (glCtx: WebGLRenderingContext, type: number, src: string): WebGLShader | null => {
      const s = glCtx.createShader(type);
      if (!s) return null;
      glCtx.shaderSource(s, src);
      glCtx.compileShader(s);
      if (!glCtx.getShaderParameter(s, glCtx.COMPILE_STATUS)) {
        console.error(glCtx.getShaderInfoLog(s));
        return null;
      }
      return s;
    };

    const vs = compile(gl, gl.VERTEX_SHADER, VS);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);
    programRef.current = prog;

    const buf = gl.createBuffer();
    if (!buf) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    bufferRef.current = buf;

    uniformsRef.current = {
      uRes: gl.getUniformLocation(prog, 'u_res'),
      uTime: gl.getUniformLocation(prog, 'u_time'),
      uMouse: gl.getUniformLocation(prog, 'u_mouse'),
    };

    gl.viewport(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    return () => {
      const currentGl = glRef.current;
      if (currentGl) {
        if (programRef.current) {
          currentGl.deleteProgram(programRef.current);
        }
        if (bufferRef.current) {
          currentGl.deleteBuffer(bufferRef.current);
        }
        currentGl.deleteShader(vs);
        currentGl.deleteShader(fs);
      }
    };
  }, []);

  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    const uniforms = uniformsRef.current;

    // Perfectly seamless loop helper over a 15-second duration (900 frames at 60 fps).
    // Using a sinewave mapping allows us to reverse the timeline fluid motion symmetrically back to its start.
    const progress = Math.sin((frame / 900) * Math.PI);
    const elapsedTime = progress * 15.0;

    // Symmetrical, deterministic looping mouse pattern
    const angle = (frame / 900) * 2 * Math.PI;
    const mx = ORIGINAL_WIDTH / 2 + Math.sin(angle) * 350;
    const my = ORIGINAL_HEIGHT / 2 + Math.sin(angle * 2) * 200;

    gl.uniform2f(uniforms.uRes, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    gl.uniform1f(uniforms.uTime, elapsedTime);
    gl.uniform2f(uniforms.uMouse, mx, my);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [frame]);

  // Handle CSS fadeIn and fadeOut mapped directly to frame-locked interpolate
  // Duration: 900 frames (15s at 60fps)
  // Title animations:
  let titleOpacity = 0;
  let titleTranslateY = 8;
  if (frame < 120) {
    titleOpacity = interpolate(frame, [0, 120], [0, 1], {
      easing: Easing.out(Easing.quad),
      extrapolateRight: 'clamp',
    });
    titleTranslateY = interpolate(frame, [0, 120], [8, 0], {
      easing: Easing.out(Easing.quad),
      extrapolateRight: 'clamp',
    });
  } else if (frame < 780) {
    titleOpacity = 1;
    titleTranslateY = 0;
  } else {
    titleOpacity = interpolate(frame, [780, 900], [1, 0], {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: 'clamp',
    });
    titleTranslateY = interpolate(frame, [780, 900], [0, -8], {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: 'clamp',
    });
  }

  // Subtitle animations:
  let subtitleOpacity = 0;
  let subtitleTranslateY = 8;
  if (frame < 15) {
    subtitleOpacity = 0;
    subtitleTranslateY = 8;
  } else if (frame < 165) {
    subtitleOpacity = interpolate(frame, [15, 165], [0, 1], {
      easing: Easing.out(Easing.quad),
      extrapolateRight: 'clamp',
    });
    subtitleTranslateY = interpolate(frame, [15, 165], [8, 0], {
      easing: Easing.out(Easing.quad),
      extrapolateRight: 'clamp',
    });
  } else if (frame < 765) {
    subtitleOpacity = 1;
    subtitleTranslateY = 0;
  } else {
    subtitleOpacity = interpolate(frame, [765, 885], [1, 0], {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: 'clamp',
    });
    subtitleTranslateY = interpolate(frame, [765, 885], [0, -8], {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: 'clamp',
    });
  }

  const containerStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#000',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    userSelect: 'none',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '110px',
    fontWeight: 900,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#fff',
    textShadow: `
      0 0 40px rgba(100,200,255,0.6),
      0 0 80px rgba(60,140,220,0.3),
      0 2px 4px rgba(0,0,0,0.8)
    `,
    transform: `translateY(${titleTranslateY}px)`,
    opacity: titleOpacity,
    fontFamily: "'Arial Black', Arial, sans-serif",
  };

  const subtitleStyle: React.CSSProperties = {
    marginTop: '20px',
    fontSize: '24px',
    fontWeight: 400,
    letterSpacing: '0.45em',
    textTransform: 'uppercase',
    color: 'rgba(180,230,255,0.75)',
    textShadow: '0 0 20px rgba(100,200,255,0.5)',
    transform: `translateY(${subtitleTranslateY}px)`,
    opacity: subtitleOpacity,
    fontFamily: "'Arial Black', Arial, sans-serif",
  };

  return (
    <div style={containerStyle}>
      <canvas
        ref={canvasRef}
        width={ORIGINAL_WIDTH}
        height={ORIGINAL_HEIGHT}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      <div style={overlayStyle}>
        <div style={titleStyle}>Liquid Metal</div>
        <div style={subtitleStyle}>WebGL Background</div>
      </div>
    </div>
  );
};

export default LiquidMetal;
// END_OF_FILE