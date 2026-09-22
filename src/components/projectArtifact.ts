import { hashId } from '../utils/archive';

export type ArtifactController = {
  draw: (id: string, animate: boolean) => void;
  dispose: () => void;
};

type Shape =
  | { kind: 'ring'; x: number; y: number; rotation: number; radius: number; thickness: number; sides: number; color: string }
  | { kind: 'rect'; x: number; y: number; rotation: number; width: number; height: number; color: string };

export const createProjectArtifact = async (canvas: HTMLCanvasElement): Promise<ArtifactController> => {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');

  let animationFrame = 0;
  let resizeFrame = 0;
  let rotation = 0;
  let shapes: Shape[] = [];

  const render = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const pixelRatio = Math.min(devicePixelRatio, innerWidth < 860 ? 1 : 1.5);
    if (!width || !height) return;
    if (canvas.width !== Math.round(width * pixelRatio) || canvas.height !== Math.round(height * pixelRatio)) {
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
    }
    context.setTransform(pixelRatio, 0, 0, pixelRatio, width / 2, height / 2);
    context.fillStyle = '#fff';
    context.fillRect(-width / 2, -height / 2, width, height);
    context.rotate(rotation);
    const scale = Math.min(width, height) / 2;
    for (const shape of shapes) {
      context.save();
      context.translate(shape.x * scale, shape.y * scale);
      context.rotate(shape.rotation);
      context.fillStyle = shape.color;
      context.strokeStyle = shape.color;
      if (shape.kind === 'rect') {
        context.fillRect(-shape.width * scale / 2, -shape.height * scale / 2, shape.width * scale, shape.height * scale);
      } else {
        context.lineWidth = shape.thickness * scale;
        context.beginPath();
        for (let side = 0; side <= shape.sides; side += 1) {
          const angle = side / shape.sides * Math.PI * 2;
          const x = Math.cos(angle) * shape.radius * scale;
          const y = Math.sin(angle) * shape.radius * scale;
          if (side) context.lineTo(x, y);
          else context.moveTo(x, y);
        }
        context.stroke();
      }
      context.restore();
    }
  };
  const resize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(render);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  const draw = (id: string, animate: boolean) => {
    cancelAnimationFrame(animationFrame);
    let seed = hashId(id) || 1;
    const random = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
    const count = 3 + Math.floor(random() * 3);
    shapes = Array.from({ length: count }, (_, index): Shape => {
      const radius = 0.12 + random() * 0.18;
      const common = {
        x: (random() - 0.5) * 1.35,
        y: (random() - 0.5) * 1.35,
        rotation: random() * Math.PI,
        color: index % 3 ? '#000' : '#e6e6e6',
      };
      return index % 2
        ? { ...common, kind: 'ring', radius, thickness: 0.08 + random() * 0.2, sides: 4 + Math.floor(random() * 5) }
        : { ...common, kind: 'rect', width: 0.25 + random() * 0.65, height: 0.08 + random() * 0.5 };
    });
    rotation = 0;
    if (animate) {
      const startedAt = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / 240, 1);
        rotation = -0.08 * (1 - progress) ** 2;
        render();
        if (progress < 1) animationFrame = requestAnimationFrame(tick);
      };
      animationFrame = requestAnimationFrame(tick);
    } else {
      render();
    }
  };

  resize();
  return {
    draw,
    dispose: () => {
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
    },
  };
};
