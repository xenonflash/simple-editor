import type { InjectionKey, Ref } from 'vue'

export type Point = { x: number; y: number }
export type Rect = { x: number; y: number; width: number; height: number }

// 2D affine matrix in SVG/CSS form: [a c e; b d f; 0 0 1]
export type Mat2D = { a: number; b: number; c: number; d: number; e: number; f: number }

export function matIdentity(): Mat2D {
  return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
}

export function matTranslate(tx: number, ty: number): Mat2D {
  return { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty }
}

export function matScale(sx: number, sy = sx): Mat2D {
  return { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 }
}

export function matMul(m1: Mat2D, m2: Mat2D): Mat2D {
  // m = m1 * m2
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f
  }
}

export function matInvert(m: Mat2D): Mat2D {
  const det = m.a * m.d - m.b * m.c
  if (!det) return matIdentity()

  const invDet = 1 / det

  const a = m.d * invDet
  const b = -m.b * invDet
  const c = -m.c * invDet
  const d = m.a * invDet

  const e = -(a * m.e + c * m.f)
  const f = -(b * m.e + d * m.f)

  return { a, b, c, d, e, f }
}

export function matTransformPoint(m: Mat2D, p: Point): Point {
  return {
    x: m.a * p.x + m.c * p.y + m.e,
    y: m.b * p.x + m.d * p.y + m.f
  }
}

export function matTransformRect(m: Mat2D, r: Rect): Rect {
  // MVP: only correct for translate/scale (no rotation/shear). Still safe for current Board.
  const p0 = matTransformPoint(m, { x: r.x, y: r.y })
  const p1 = matTransformPoint(m, { x: r.x + r.width, y: r.y + r.height })
  return {
    x: p0.x,
    y: p0.y,
    width: p1.x - p0.x,
    height: p1.y - p0.y
  }
}

export interface CoordinateSnapshot {
  client: Point
  wrapper: Point
  canvas: Point
}

export interface CoordinateHelper {
  getWrapperRect(): DOMRect | null

  getCanvasToWrapperMatrix(): Mat2D
  getWrapperToCanvasMatrix(): Mat2D

  getWrapperToClientMatrix(): Mat2D
  getClientToWrapperMatrix(): Mat2D

  getCanvasToClientMatrix(): Mat2D
  getClientToCanvasMatrix(): Mat2D

  clientToWrapper(p: Point): Point
  wrapperToClient(p: Point): Point
  wrapperToCanvas(p: Point): Point
  canvasToWrapper(p: Point): Point
  clientToCanvas(p: Point): Point
  canvasToClient(p: Point): Point

  clientDeltaToCanvas(delta: Point): Point

  snapshotFromClient(p: Point): CoordinateSnapshot
}

export const COORDINATE_HELPER_KEY: InjectionKey<CoordinateHelper> = Symbol('COORDINATE_HELPER') as InjectionKey<CoordinateHelper>

export function createCoordinateHelper(options: {
  wrapperRef: Ref<HTMLElement | null>
  scale: Ref<number>
  panOffset: Ref<Point>
}): CoordinateHelper {
  function getWrapperRect(): DOMRect | null {
    return options.wrapperRef.value?.getBoundingClientRect() ?? null
  }

  function getCanvasToWrapperMatrix(): Mat2D {
    // wrapper = pan + scale * canvas
    return matMul(matTranslate(options.panOffset.value.x, options.panOffset.value.y), matScale(options.scale.value))
  }

  function getWrapperToCanvasMatrix(): Mat2D {
    return matInvert(getCanvasToWrapperMatrix())
  }

  function getWrapperToClientMatrix(): Mat2D {
    const rect = getWrapperRect()
    if (!rect) return matIdentity()
    return matTranslate(rect.left, rect.top)
  }

  function getClientToWrapperMatrix(): Mat2D {
    return matInvert(getWrapperToClientMatrix())
  }

  function getCanvasToClientMatrix(): Mat2D {
    return matMul(getWrapperToClientMatrix(), getCanvasToWrapperMatrix())
  }

  function getClientToCanvasMatrix(): Mat2D {
    return matInvert(getCanvasToClientMatrix())
  }

  function clientToWrapper(p: Point): Point {
    return matTransformPoint(getClientToWrapperMatrix(), p)
  }

  function wrapperToClient(p: Point): Point {
    return matTransformPoint(getWrapperToClientMatrix(), p)
  }

  function wrapperToCanvas(p: Point): Point {
    return matTransformPoint(getWrapperToCanvasMatrix(), p)
  }

  function canvasToWrapper(p: Point): Point {
    return matTransformPoint(getCanvasToWrapperMatrix(), p)
  }

  function clientToCanvas(p: Point): Point {
    return matTransformPoint(getClientToCanvasMatrix(), p)
  }

  function canvasToClient(p: Point): Point {
    return matTransformPoint(getCanvasToClientMatrix(), p)
  }

  function clientDeltaToCanvas(delta: Point): Point {
    const s = options.scale.value || 1
    return { x: delta.x / s, y: delta.y / s }
  }

  function snapshotFromClient(p: Point): CoordinateSnapshot {
    const wrapper = clientToWrapper(p)
    const canvas = wrapperToCanvas(wrapper)
    return { client: p, wrapper, canvas }
  }

  return {
    getWrapperRect,
    getCanvasToWrapperMatrix,
    getWrapperToCanvasMatrix,
    getWrapperToClientMatrix,
    getClientToWrapperMatrix,
    getCanvasToClientMatrix,
    getClientToCanvasMatrix,
    clientToWrapper,
    wrapperToClient,
    wrapperToCanvas,
    canvasToWrapper,
    clientToCanvas,
    canvasToClient,
    clientDeltaToCanvas,
    snapshotFromClient
  }
}
