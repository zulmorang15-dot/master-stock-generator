import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

export const MarbleFluid: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setPixelRatio(1);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      time: { value: 0.0 },
      resolution: { value: new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: `
        precision highp float;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
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
          vec2 move1=vec2(cos(theta)*0.3,sin(theta)*0.3);
          vec2 move2=vec2(sin(theta*2.)*0.5,cos(theta*2.)*0.5);
          vec2 v1=vec2(cheapNoise(vec3(st+move1,theta*2.)),cheapNoise(vec3(st-move1,theta*1.)));
          vec2 v2=vec2(cheapNoise(vec3(st+v1+move2,theta*2.)),cheapNoise(vec3(st+v1-move2,theta*3.)));
          float vein=abs(cheapNoise(vec3(st*1.5+v2,theta*1.)));
          float n=0.5+0.5*cheapNoise(vec3(st+v2,theta*1.));
          vec3 baseWhite=vec3(0.92,0.91,0.88);
          vec3 grey=vec3(0.55,0.55,0.58);
          vec3 gold=vec3(0.8,0.6,0.2);
          vec3 color=mix(baseWhite,grey,smoothstep(0.0,0.25,vein));
          color=mix(color,gold,smoothstep(0.02,0.0,vein)*0.6);
          color*=0.85+0.3*n;
          color=pow(color,vec3(0.95));
          gl_FragColor=vec4(color,1.);
        }
      `,
      uniforms: uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    materialRef.current = material;

    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  useEffect(() => {
    if (
      !rendererRef.current ||
      !sceneRef.current ||
      !cameraRef.current ||
      !materialRef.current
    ) {
      return;
    }

    const elapsedTime = frame / fps;
    materialRef.current.uniforms.time.value = elapsedTime;

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [frame, fps]);

  return (
    <div
      style={{
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        backgroundColor: '#111',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

export default MarbleFluid;
// END_OF_FILE