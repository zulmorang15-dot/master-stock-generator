import { useVideoConfig, useCurrentFrame } from 'remotion';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const AuroraFluid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const uniformsRef = useRef<{ [key: string]: { value: any } } | null>(null);

  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT) },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: `
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
        const float scale=0.5;
        float cheapNoise(vec3 stp){
          vec3 p=vec3(stp.st,stp.p); vec4 a=vec4(5.,7.,9.,13.);
          return mix(sin(p.z+p.x*a.x+cos(p.x*a.x-p.z))*cos(p.z+p.y*a.y+cos(p.y*a.x+p.z)),
                     sin(1.+p.x*a.z+p.z+cos(p.y*a.w-p.z))*cos(1.+p.y*a.w+p.z+cos(p.x*a.x+p.z)),0.436);
        }
        void main(){
          vec2 aR=vec2(resolution.x/resolution.y,1.); vec2 st=vUv*aR*scale;
          float duration=20.0; // Loop duration adjusted to 20 seconds for seamless loop
          float theta=2.*PI*fract(time/duration);
          vec2 move1=vec2(sin(theta)*0.3, cos(theta)*0.5);
          vec2 move2=vec2(cos(theta*2.)*0.4, sin(theta*2.)*0.7);
          vec2 v1=vec2(cheapNoise(vec3(st+move1,theta*2.)),cheapNoise(vec3(st-move1,theta*1.)));
          vec2 v2=vec2(cheapNoise(vec3(st+v1+move2,theta*2.)),cheapNoise(vec3(st+v1-move2,theta*3.)));
          float n=0.5+0.5*cheapNoise(vec3(st+v2,theta*1.));
          // PALET AURORA
          vec3 c1=vec3(0.01,0.01,0.04);
          vec3 c2=vec3(0.0,1.0,0.615);   // hijau toska
          vec3 c3=vec3(0.0,0.4,1.0);     // biru
          vec3 c4=vec3(0.416,0.0,1.0);   // ungu
          vec3 color=mix(c1,c2,clamp((n*n)*8.,0.,1.));
          color=mix(color,c3,clamp(length(v1),0.,1.));
          color=mix(color,c4,clamp(length(v2.x),0.,1.));
          color/=n*n+n*7.; color=pow(color,vec3(0.8)); color*=1.4;
          // vignette
          float vig=1.-length(vUv-0.5)*1.1; color*=clamp(vig,0.3,1.);
          gl_FragColor=vec4(color,1.);
        }
      `,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    uniformsRef.current = uniforms;

    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  useEffect(() => {
    if (uniformsRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
      const time = frame / fps;
      uniformsRef.current.time.value = time;
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
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
        backgroundColor: '#000',
      }}
    >
      <div
        className="video-container"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#111',
          position: 'relative',
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
    </div>
  );
};

export default AuroraFluid;
// END_OF_FILE