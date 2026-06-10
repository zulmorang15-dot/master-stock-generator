import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const vertexShaderSource = `
  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  uniform float uPhase;
  uniform float uAspect;
  uniform float uElementCount;
  uniform vec2 uResolution;

  varying vec2 vUv;

  const float PI = 3.141592653589793;
  const float TAU = 6.283185307179586;

  mat2 rotate2d(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
  }

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float softNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(a, b, u.x),
      mix(c, d, u.x),
      u.y
    );
  }

  float seamlessField(vec2 p, float layerIndex, float phase) {
    float a = TAU * phase;
    float id = layerIndex + 1.0;

    vec2 orbitalA = vec2(
      sin(a * (0.65 + id * 0.035) + id * 1.71),
      cos(a * (0.65 + id * 0.035) + id * 1.71)
    );

    vec2 orbitalB = vec2(
      cos(a * (0.85 - id * 0.025) + id * 2.43),
      sin(a * (0.85 - id * 0.025) + id * 2.43)
    );

    p += orbitalA * (0.18 + id * 0.012);
    p = rotate2d(0.38 * sin(a + id * 0.73)) * p;
    p += orbitalB * (0.11 + id * 0.008);

    float waveA = sin(
      p.x * (2.2 + id * 0.33) +
      cos(p.y * (2.6 + id * 0.21) + a + id) * 1.35 +
      sin(a + id * 0.91) * 0.8
    );

    float waveB = cos(
      p.y * (3.1 + id * 0.27) +
      sin(p.x * (2.4 + id * 0.19) - a * 0.82 + id) * 1.15 +
      cos(a * 0.92 + id * 1.33) * 0.9
    );

    float waveC = sin(
      dot(p, vec2(1.45 + id * 0.08, -1.22 - id * 0.05)) * 3.0 +
      sin(a + id * 1.9) * 1.4
    );

    return (waveA * 0.48 + waveB * 0.37 + waveC * 0.15);
  }

  vec3 palette(float x) {
    vec3 midnightBlue = vec3(0.020, 0.024, 0.095);
    vec3 royalViolet = vec3(0.220, 0.075, 0.460);
    vec3 electricCyan = vec3(0.000, 0.850, 1.000);
    vec3 plasmaPink = vec3(1.000, 0.110, 0.680);
    vec3 liquidGold = vec3(1.000, 0.710, 0.120);

    vec3 col = mix(midnightBlue, royalViolet, smoothstep(0.00, 0.45, x));
    col = mix(col, electricCyan, smoothstep(0.26, 0.72, x) * 0.85);
    col = mix(col, plasmaPink, smoothstep(0.48, 0.92, x) * 0.62);
    col = mix(col, liquidGold, pow(smoothstep(0.74, 1.0, x), 3.0) * 0.75);

    return col;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv - 0.5;
    p.x *= uAspect;

    float phase = uPhase;
    float a = TAU * phase;

    float slowBreath = 0.5 + 0.5 * sin(a);
    float counterBreath = 0.5 + 0.5 * cos(a);

    p *= 1.16 + 0.045 * sin(a);
    p = rotate2d(0.075 * sin(a)) * p;

    vec2 core = p;

    float accumulated = 0.0;
    float glow = 0.0;
    float silk = 0.0;

    for (int i = 0; i < 8; i++) {
      float fi = float(i);

      if (fi < uElementCount) {
        vec2 q = core;

        float depth = fi / max(uElementCount - 1.0, 1.0);
        q *= 1.0 + depth * 0.42;

        float f = seamlessField(q, fi, phase);

        float ribbonCenter =
          -0.28 +
          depth * 0.095 +
          0.18 * sin(a + fi * 0.91) +
          0.12 * cos(q.x * (1.45 + depth) - a + fi);

        float ribbonWidth = 0.115 + 0.035 * sin(a + fi * 1.37);
        float ribbon = exp(-abs(q.y - ribbonCenter - f * 0.155) / ribbonWidth);

        float upperMist = exp(-abs(q.y + 0.18 + f * 0.20) / (0.28 + depth * 0.04));
        float filament = pow(max(0.0, 0.5 + 0.5 * f), 2.7);

        accumulated += ribbon * (0.42 + depth * 0.13);
        glow += upperMist * (0.13 + depth * 0.05);
        silk += filament * ribbon * (0.46 + depth * 0.08);
      }
    }

    accumulated /= max(uElementCount, 1.0);
    glow /= max(uElementCount, 1.0);
    silk /= max(uElementCount, 1.0);

    float radial = length(p);
    float vortex =
      sin(atan(p.y, p.x) * 3.0 + radial * 8.5 - a) * 0.5 +
      cos(radial * 10.0 + a) * 0.5;

    float liquid = accumulated * 2.35 + glow * 1.25 + silk * 1.85;
    liquid += vortex * 0.055;
    liquid += slowBreath * 0.045 + counterBreath * 0.035;

    liquid = smoothstep(0.08, 1.18, liquid);

    vec3 color = palette(liquid);

    vec3 deepBase = vec3(0.010, 0.012, 0.050);
    vec3 velvet = vec3(0.040, 0.018, 0.115);

    float bgGradient = smoothstep(0.85, -0.35, uv.y);
    vec3 background = mix(deepBase, velvet, bgGradient);

    float auroraMask = smoothstep(0.02, 0.92, liquid);
    color = mix(background, color, auroraMask);

    float cyanEdge = pow(max(0.0, accumulated), 2.2);
    float goldSpark = pow(max(0.0, silk), 4.5);

    color += vec3(0.0, 0.70, 1.0) * cyanEdge * 0.42;
    color += vec3(1.0, 0.62, 0.08) * goldSpark * 0.62;

    float starField = softNoise(gl_FragCoord.xy * 0.55);
    float stars = smoothstep(0.985, 1.0, starField);
    stars *= smoothstep(0.05, 0.75, uv.y);
    stars *= 0.18 + 0.07 * sin(a + starField * TAU);
    color += vec3(0.60, 0.85, 1.0) * stars;

    float shimmerHash = hash21(gl_FragCoord.xy);
    float shimmer = 0.955 + 0.045 * sin(a + shimmerHash * TAU);
    color *= shimmer;

    float vignette = smoothstep(0.98, 0.18, length((uv - 0.5) * vec2(uAspect * 0.78, 1.0)));
    color *= 0.48 + 0.88 * vignette;

    color = pow(color, vec3(0.86));
    color = min(color, vec3(1.0));

    gl_FragColor = vec4(color, 1.0);
  }
`;

const compileShader = (gl: WebGLRenderingContext, source: string, type: number): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Failed to create WebGL shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Shader compilation failed: ' + log);
  }
  return shader;
};

const createProgram = (gl: WebGLRenderingContext, vsSrc: string, fsSrc: string): WebGLProgram => {
  const vs = compileShader(gl, vsSrc, gl.VERTEX_SHADER);
  const fs = compileShader(gl, fsSrc, gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error('Failed to create WebGL program');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Program linking failed: ' + gl.getProgramInfoLog(program));
  }
  return program;
};

const FluidAurora = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const glRef = React.useRef<any>(null);

  const loopDurationSeconds = 10;
  const totalLoopFrames = fps * loopDurationSeconds;
  const localFrame = frame % totalLoopFrames;
  const phase = localFrame / totalLoopFrames;

  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Fluid Aurora';
  const keywordsList = (inputProps.keywords || 'fluid, velvet, ambient, procedural').split(',');

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  const textOpacity = interpolate(
    frame,
    [0, 25],
    [0, 1],
    { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }
  );

  const textY = interpolate(
    frame,
    [0, 25],
    [20, 0],
    { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }
  );

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    try {
      const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
      const positionLoc = gl.getAttribLocation(program, 'position');
      const positionBuffer = gl.createBuffer();
      
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const vertices = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const uniforms = {
        uPhase: gl.getUniformLocation(program, 'uPhase'),
        uAspect: gl.getUniformLocation(program, 'uAspect'),
        uElementCount: gl.getUniformLocation(program, 'uElementCount'),
        uResolution: gl.getUniformLocation(program, 'uResolution'),
      };

      glRef.current = {
        gl,
        program,
        positionBuffer,
        positionLoc,
        uniforms,
      };
    } catch (e) {
      console.error(e);
    }
  }, []);

  React.useEffect(() => {
    if (!glRef.current) return;
    const { gl, program, positionBuffer, positionLoc, uniforms } = glRef.current;

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = ORIGINAL_WIDTH;
      canvas.height = ORIGINAL_HEIGHT;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const aspect = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;
    gl.uniform1f(uniforms.uPhase, phase);
    gl.uniform1f(uniforms.uAspect, aspect);
    gl.uniform1f(uniforms.uElementCount, 7.0);
    gl.uniform2f(uniforms.uResolution, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, [phase]);

  const containerStyle: React.CSSProperties = {
    width,
    height,
    backgroundColor: '#050614',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const wrapperStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'relative',
    transform: `scale(${scaleFactor})`,
    transformOrigin: 'center center',
    backgroundColor: '#050614',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  };

  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '80px',
    left: '80px',
    zIndex: 10,
    opacity: textOpacity,
    transform: `translateY(${textY}px)`,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#ffffff',
    pointerEvents: 'none',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '56px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    marginBottom: '20px',
    textShadow: '0 4px 16px rgba(0,0,0,0.6), 0 0 24px rgba(0, 136, 255, 0.45)',
  };

  const badgeContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
  };

  const badgeStyle: React.CSSProperties = {
    padding: '8px 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '30px',
    fontSize: '18px',
    fontWeight: 500,
    letterSpacing: '1.5px',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    textTransform: 'uppercase',
  };

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        <canvas ref={canvasRef} style={canvasStyle} />
        <div style={overlayStyle}>
          <div style={titleStyle}>{judul}</div>
          <div style={badgeContainerStyle}>
            {keywordsList.map((keyword, index) => (
              <span key={index} style={badgeStyle}>
                {keyword.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FluidAurora;
// END_OF_FILE