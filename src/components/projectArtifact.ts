import { hashId } from '../utils/archive';

export type ArtifactController = {
  draw: (id: string, animate: boolean) => void;
  dispose: () => void;
};

export const createProjectArtifact = async (canvas: HTMLCanvasElement): Promise<ArtifactController> => {
  const [THREE, { gsap }] = await Promise.all([import('three'), import('gsap')]);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  const group = new THREE.Group();
  camera.position.z = 2;
  scene.background = new THREE.Color(0xffffff);
  scene.add(group);

  let tween: ReturnType<typeof gsap.to> | undefined;
  let resizeFrame = 0;
  const render = () => renderer.render(scene, camera);
  const resize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 860 ? 1 : 1.5));
      renderer.setSize(width, height, false);
      camera.left = -width / height;
      camera.right = width / height;
      camera.updateProjectionMatrix();
      render();
    });
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  const clear = () => {
    for (const child of [...group.children]) {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material.dispose());
      }
      group.remove(child);
    }
  };

  const draw = (id: string, animate: boolean) => {
    tween?.kill();
    clear();
    let seed = hashId(id) || 1;
    const random = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
    const count = 3 + Math.floor(random() * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = 0.12 + random() * 0.18;
      const geometry = index % 2
        ? new THREE.RingGeometry(radius, radius + 0.08 + random() * 0.2, 4 + Math.floor(random() * 5))
        : new THREE.PlaneGeometry(0.25 + random() * 0.65, 0.08 + random() * 0.5);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: index % 3 ? 0x000000 : 0xe6e6e6 }));
      mesh.position.set((random() - 0.5) * 1.35, (random() - 0.5) * 1.35, index * 0.01);
      mesh.rotation.z = random() * Math.PI;
      group.add(mesh);
    }
    group.rotation.z = 0;
    if (animate) {
      tween = gsap.fromTo(group.rotation, { z: -0.08 }, { z: 0, duration: 0.24, ease: 'power1.out', onUpdate: render });
    } else {
      render();
    }
  };

  resize();
  return {
    draw,
    dispose: () => {
      tween?.kill();
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      clear();
      renderer.dispose();
    },
  };
};
