import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

export const GalaxyNebulaFluid: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

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

        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }

        void main(){
          vec2 aR=vec2(resolution.x/resolution.y,1.); vec2 st=vUv*aR*scale;
          float duration=20.0; 
          float theta=2.*PI*fract(time/duration);
          vec2 move1=vec2(cos(theta)*0.4,sin(theta)*0.4);
          vec2 move2=vec2(sin(theta*2.)*0.6,cos(theta*2.)*0.6);
          vec2 v1=vec2(cheapNoise(vec3(st+move1,theta*2.)),cheapNoise(vec3(st-move1,theta*1.)));
          vec2 v2=vec2(cheapNoise(vec3(st+v1+move2,theta*2.)),cheapNoise(vec3(st+v1-move2,theta*3.)));
          float n=0.5+0.5*cheapNoise(vec3(st+v2,theta*1.));
          
          vec3 c1=vec3(0.01,0.0,0.03);   
          vec3 c2=vec3(0.2,0.0,0.4);     
          vec3 c3=vec3(0.8,0.1,0.6);     
          vec3 c4=vec3(0.3,0.4,1.0);     
          vec3 color=mix(c1,c2,clamp((n*n)*8.,0.,1.));
          color=mix(color,c3,clamp(length(v1),0.,1.));
          color=mix(color,c4,clamp(length(v2.x),0.,1.));
          color/=n*n+n*7.; color=pow(color,vec3(0.8)); color*=1.4;
          
          vec2 grid=floor(vUv*resolution.xy/3.0);
          float star=hash(grid);
          if(star>0.997){
            float tw=0.5+0.5*sin(time*3.14159265359+star*100.0);
            color+=vec3(0.9,0.9,1.0)*tw*(star-0.997)*300.0;
          }
          gl_FragColor=vec4(color,1.);
        }
      `,
      uniforms: {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT) },
      },
      depthWrite: false,
      depthTest: false,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    return () => {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const elapsedTime = frame / fps;

    if (materialRef.current) {
      materialRef.current.uniforms.time.value = elapsedTime;
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
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
    backgroundColor: '#000000',
  };

  const canvasStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    height: '100%',
  };

  return (
    <div style={containerStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
    </div>
  );
};

export default GalaxyNebulaFluid;
// END_OF_FILE