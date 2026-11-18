import React, { useEffect, useRef } from 'react';

export interface Camera360State {
  yaw: number;   // degrees (-180 to +180, wraps continuously)
  pitch: number; // degrees (-75 to +75)
  fov: number;   // vertical field of view in degrees (45 to 100)
}

/**
 * Computes orthonormal camera basis vectors (forward, right, up) from (yawDeg, pitchDeg).
 */
export function getCameraBasis(yawDeg: number, pitchDeg: number) {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;

  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);

  const forward: [number, number, number] = [cosP * sinY, sinP, cosP * cosY];
  const right: [number, number, number] = [cosY, 0, -sinY];
  const up: [number, number, number] = [-sinP * sinY, cosP, -sinP * cosY];

  return { forward, right, up };
}

/**
 * Projects a 3D spherical coordinate (pitchDeg, yawDeg) onto 2D viewport percentages (x%, y%).
 */
export function projectSphericalToScreen(
  hsPitchDeg: number,
  hsYawDeg: number,
  camera: Camera360State,
  aspect: number
): { xPct: number; yPct: number; visible: boolean } {
  const { forward, right, up } = getCameraBasis(camera.yaw, camera.pitch);
  const lat = (hsPitchDeg * Math.PI) / 180;
  const lon = (hsYawDeg * Math.PI) / 180;

  const hx = Math.cos(lat) * Math.sin(lon);
  const hy = Math.sin(lat);
  const hz = Math.cos(lat) * Math.cos(lon);

  const vz = hx * forward[0] + hy * forward[1] + hz * forward[2];
  if (vz <= 0.08) {
    return { xPct: -100, yPct: -100, visible: false };
  }

  const vx = hx * right[0] + hy * right[1] + hz * right[2];
  const vy = hx * up[0] + hy * up[1] + hz * up[2];

  const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);
  const ndcX = vx / vz / (tanHalfFov * aspect);
  const ndcY = vy / vz / tanHalfFov;

  const xPct = (0.5 + 0.5 * ndcX) * 100;
  const yPct = (0.5 - 0.5 * ndcY) * 100;

  const visible = xPct >= -15 && xPct <= 115 && yPct >= -15 && yPct <= 115;
  return { xPct, yPct, visible };
}

/**
 * Unprojects a 2D click point (xPct 0..100, yPct 0..100) into 3D spherical (pitchDeg, yawDeg).
 */
export function unprojectScreenToSpherical(
  xPct: number,
  yPct: number,
  camera: Camera360State,
  aspect: number
): { pitch: number; yaw: number } {
  const { forward, right, up } = getCameraBasis(camera.yaw, camera.pitch);
  const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);

  const ndcX = (xPct / 100 - 0.5) * 2;
  const ndcY = (0.5 - yPct / 100) * 2;

  const sx = ndcX * tanHalfFov * aspect;
  const sy = ndcY * tanHalfFov;

  let dx = forward[0] + sx * right[0] + sy * up[0];
  let dy = forward[1] + sx * right[1] + sy * up[1];
  let dz = forward[2] + sx * right[2] + sy * up[2];

  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  dx /= len;
  dy /= len;
  dz /= len;

  const yaw = Number(((Math.atan2(dx, dz) * 180) / Math.PI).toFixed(2));
  const pitch = Number(((Math.asin(Math.max(-1, Math.min(1, dy))) * 180) / Math.PI).toFixed(2));

  return { pitch, yaw };
}

const VERTEX_SHADER_SRC = `
attribute vec2 aPosition;
varying vec2 vNdc;
void main() {
  vNdc = aPosition;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;
varying vec2 vNdc;
uniform sampler2D uPanorama;
uniform vec3 uForward;
uniform vec3 uRight;
uniform vec3 uUp;
uniform float uTanHalfFov;
uniform float uAspect;

const float PI = 3.141592653589793;

void main() {
  vec3 dir = normalize(
    uForward +
    (vNdc.x * uTanHalfFov * uAspect) * uRight +
    (vNdc.y * uTanHalfFov) * uUp
  );

  float lon = atan(dir.x, dir.z);
  float lat = asin(clamp(dir.y, -1.0, 1.0));

  float u = fract(0.5 + lon / (2.0 * PI));
  float v = clamp(0.5 - lat / PI, 0.001, 0.999);

  gl_FragColor = texture2D(uPanorama, vec2(u, v));
}
`;

interface EquirectangularCanvas360Props {
  imageUrl: string;
  camera: Camera360State;
  onAspectChange?: (aspect: number) => void;
}

export default function EquirectangularCanvas360({
  imageUrl,
  camera,
  onAspectChange,
}: EquirectangularCanvas360Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glStateRef = useRef<{
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    texture: WebGLTexture;
    uForward: WebGLUniformLocation | null;
    uRight: WebGLUniformLocation | null;
    uUp: WebGLUniformLocation | null;
    uTanHalfFov: WebGLUniformLocation | null;
    uAspect: WebGLUniformLocation | null;
    textureLoaded: boolean;
  } | null>(null);

  const renderFrame = () => {
    const state = glStateRef.current;
    const canvas = canvasRef.current;
    if (!state || !canvas || !state.textureLoaded) return;

    const { gl, program, uForward, uRight, uUp, uTanHalfFov, uAspect } = state;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayW = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const displayH = Math.max(1, Math.floor(canvas.clientHeight * dpr));

    if (canvas.width !== displayW || canvas.height !== displayH) {
      canvas.width = displayW;
      canvas.height = displayH;
      gl.viewport(0, 0, displayW, displayH);
    }

    const aspect = displayW / displayH;
    const { forward, right, up } = getCameraBasis(camera.yaw, camera.pitch);
    const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);

    gl.useProgram(program);
    gl.uniform3fv(uForward, forward);
    gl.uniform3fv(uRight, right);
    gl.uniform3fv(uUp, up);
    gl.uniform1f(uTanHalfFov, tanHalfFov);
    gl.uniform1f(uAspect, aspect);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  // Initialize WebGL context and shader program once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: true, powerPreference: 'high-performance' });
    if (!gl) return;

    const compileShader = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const quadVerts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    glStateRef.current = {
      gl,
      program,
      texture,
      uForward: gl.getUniformLocation(program, 'uForward'),
      uRight: gl.getUniformLocation(program, 'uRight'),
      uUp: gl.getUniformLocation(program, 'uUp'),
      uTanHalfFov: gl.getUniformLocation(program, 'uTanHalfFov'),
      uAspect: gl.getUniformLocation(program, 'uAspect'),
      textureLoaded: false,
    };

    const ro = new ResizeObserver(() => {
      if (canvas && onAspectChange && canvas.clientHeight > 0) {
        onAspectChange(canvas.clientWidth / canvas.clientHeight);
      }
      renderFrame();
    });
    ro.observe(canvas);

    return () => {
      ro.disconnect();
    };
  }, []);

  // Load equirectangular panorama texture whenever imageUrl changes
  useEffect(() => {
    const state = glStateRef.current;
    if (!state) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const { gl, texture } = state;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      state.textureLoaded = true;
      if (canvasRef.current && onAspectChange && canvasRef.current.clientHeight > 0) {
        onAspectChange(canvasRef.current.clientWidth / canvasRef.current.clientHeight);
      }
      renderFrame();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Re-render whenever camera (yaw, pitch, fov) updates
  useEffect(() => {
    renderFrame();
  }, [camera.yaw, camera.pitch, camera.fov]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
    />
  );
}
