import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const VERTEX_SHADER_SOURCE = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_cos_time;
  uniform float u_sin_time;
  uniform float u_noise_scale;

  uniform vec3 u_color_bg;
  uniform vec3 u_color_violet;
  uniform vec3 u_color_magenta;
  uniform vec3 u_color_cyan;
  uniform vec3 u_color_gold;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 5; ++i) {
      v += a * noise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec2 loopOffset = vec2(u_cos_time, u_sin_time) * 1.2;

    vec2 q = vec2(0.0);
    q.x = fbm(p * u_noise_scale + loopOffset * 0.4);
    q.y = fbm(p * u_noise_scale + loopOffset.yx * 0.5);

    vec2 r = vec2(0.0);
    r.x = fbm(p * (u_noise_scale * 1.3) + q * 1.8 + loopOffset * 0.2 + vec2(2.4, 5.7));
    r.y = fbm(p * (u_noise_scale * 1.3) + q * 1.5 + loopOffset.yx * 0.3 + vec2(8.3, 1.1));

    float f = fbm(p * u_noise_scale + r * 2.0);

    vec3 color = mix(u_color_bg, u_color_violet, clamp(f * 2.5, 0.0, 1.0));
    color = mix(color, u_color_magenta, clamp(length(q) * 0.7, 0.0, 1.0) * 0.65);
    color = mix(color, u_color_cyan, clamp(r.x * 1.1, 0.0, 1.0) * 0.45);

    float goldMask = pow(clamp(f * 1.4, 0.0, 1.0), 4.5);
    color = mix(color, u_color_gold, goldMask * 0.55);

    color = color * 1.15;

    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 d = uv * (1.0 - uv.yx);
    float vignette = d.x * d.y * 15.0;
    vignette = clamp(pow(vignette, 0.25), 0.0, 1.0);
    color *= vignette;

    float grain = hash(uv + vec2(u_cos_time, u_sin_time)) * 0.025;
    color += vec3(grain);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const FluidAuroraLoop = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const glRef = React.useRef<WebGLRenderingContext | null>(null);
  const programRef = React.useRef<WebGLProgram | null>(null);
  const uniformsRef = React.useRef<Record<string, WebGLUniformLocation | null>>({});

  // Establish standard 10-second loop
  const totalDurationFrames = fps * 10;
  const localFrame = frame % totalDurationFrames;
  const progress = localFrame / totalDurationFrames;
  const angle = progress * Math.PI * 2.0;
  const cosTime = Math.cos(angle);
  const sinTime = Math.sin(angle);

  // Auto-Fit Scaling calculation
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl = glRef.current;
    if (!gl) {
      gl = canvas.getContext('webgl', { antialias: true, powerPreference: 'high-performance' });
      if (!gl) return;
      glRef.current = gl;

      // Compile Vertex Shader
      const vs = gl.createShader(gl.VERTEX_SHADER);
      if (!vs) return;
      gl.shaderSource(vs, VERTEX_SHADER_SOURCE);
      gl.compileShader(vs);

      // Compile Fragment Shader
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fs) return;
      gl.shaderSource(fs, FRAGMENT_SHADER_SOURCE);
      gl.compileShader(fs);

      // Program Setup
      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      programRef.current = program;

      // Uniform Locations Cache
      uniformsRef.current = {
        u_resolution: gl.getUniformLocation(program, 'u_resolution'),
        u_cos_time: gl.getUniformLocation(program, 'u_cos_time'),
        u_sin_time: gl.getUniformLocation(program, 'u_sin_time'),
        u_noise_scale: gl.getUniformLocation(program, 'u_noise_scale'),
        u_color_bg: gl.getUniformLocation(program, 'u_color_bg'),
        u_color_violet: gl.getUniformLocation(program, 'u_color_violet'),
        u_color_magenta: gl.getUniformLocation(program, 'u_color_magenta'),
        u_color_cyan: gl.getUniformLocation(program, 'u_color_cyan'),
        u_color_gold: gl.getUniformLocation(program, 'u_color_gold'),
      };

      // Fullscreen Quad Geometry setup
      const vertices = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const positionLocation = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    }

    const program = programRef.current;
    const locs = uniformsRef.current;
    if (!gl || !program) return;

    // Viewport setup
    gl.viewport(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    gl.useProgram(program);

    // Color Configurations (R, G, B normalized to 0.0 - 1.0)
    gl.uniform2f(locs.u_resolution, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    gl.uniform1f(locs.u_cos_time, cosTime);
    gl.uniform1f(locs.u_sin_time, sinTime);
    gl.uniform1f(locs.u_noise_scale, 1.8);
    gl.uniform3f(locs.u_color_bg, 10 / 255, 11 / 255, 30 / 255);
    gl.uniform3f(locs.u_color_violet, 59 / 255, 28 / 255, 99 / 255);
    gl.uniform3f(locs.u_color_magenta, 255 / 255, 0 / 255, 127 / 255);
    gl.uniform3f(locs.u_color_cyan, 0 / 255, 243 / 255, 255 / 255);
    gl.uniform3f(locs.u_color_gold, 255 / 255, 215 / 255, 0 / 255);

    // Draw frame
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, [cosTime, sinTime]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0b1e',
    position: 'relative',
    overflow: 'hidden',
  };

  const wrapperStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    backgroundColor: '#0a0b1e',
    overflow: 'hidden',
  };

  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
  };

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        <canvas
          ref={canvasRef}
          width={ORIGINAL_WIDTH}
          height={ORIGINAL_HEIGHT}
          style={canvasStyle}
        />
      </div>
    </div>
  );
};

export default FluidAuroraLoop;
// END_OF_FILE