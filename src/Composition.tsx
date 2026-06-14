import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

export const GalaxyNebulaFluid: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  useEffect(() => {
    if (!canvasRef.current) return;

    const w = ORIGINAL_WIDTH;
    const h = ORIGINAL_HEIGHT;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(1);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(w, h) },
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform float time;
      uniform vec2 resolution;
      const float PI=3.141592654;
      const float scale=0.6;
      float cheapNoise(vec3 stp){
        vec3 p=vec3(stp.st,stp.p); vec4 a=vec4(5.,7.,9.,13.);
        return mix(sin(p.z+p.x*a.x+cos(p.x*a.x-p.z))*cos(p.z+p.y*a.y+cos(p.y*a.x+p.z)),
                   sin(1.+p.x*a.z+p.z+cos(p.y*a.w-p.z))*cos(1.+p.y*a.w+p.z+cos(p.x*a.x+p.z)),0.436);
      }
      void main(){
        vec2 aR=vec2(resolution.x/resolution.y,1.); vec2 st=vUv*aR*scale;
        float duration=20.0; 
        float theta=2.*PI*fract(time/duration);
        vec2 move1=vec2(sin(theta)*0.4, cos(theta)*0.4);
        vec2 move2=vec2(cos(theta*2.)*0.6, sin(theta*2.)*0.5);
        vec2 v1=vec2(cheapNoise(vec3(st+move1,theta*2.)),cheapNoise(vec3(st-move1,theta*1.)));
        vec2 v2=vec2(cheapNoise(vec3(st+v1+move2,theta*2.)),cheapNoise(vec3(st+v1-move2,theta*3.)));
        float n=0.5+0.5*cheapNoise(vec3(st+v2,theta*1.));
        vec3 c1=vec3(0.02,0.0,0.05);
        vec3 c2=vec3(0.2,0.0,0.4);
        vec3 c3=vec3(0.8,0.1,0.5);
        vec3 c4=vec3(0.9,0.85,1.0);
        vec3 color=mix(c1,c2,clamp((n*n)*8.,0.,1.));
        color=mix(color,c3,clamp(length(v1),0.,1.));
        color=mix(color,c4,clamp(length(v2.x),0.,1.));
        color/=n*n+n*7.; color=pow(color,vec3(0.85)); color*=1.6;
        float vig=1.-length(vUv-0.5)*1.1; color*=clamp(vig,0.1,1.);
        gl_FragColor=vec4(color,1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  useEffect(() => {
    const material = materialRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (material && renderer && scene && camera) {
      const cycleDuration = 20;
      const totalFramesInCycle = fps * cycleDuration;
      const localFrame = frame % totalFramesInCycle;
      const simulatedTime = (localFrame / totalFramesInCycle) * cycleDuration;

      material.uniforms.time.value = simulatedTime;
      renderer.render(scene, camera);
    }
  }, [frame, fps]);

  const containerStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#111',
  };

  return (
    <div style={containerStyle}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

export default GalaxyNebulaFluid;
// END_OF_FILE