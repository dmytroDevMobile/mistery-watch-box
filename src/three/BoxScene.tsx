import React, { useMemo, useRef } from 'react';
import { ActivityIndicator, PanResponder, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  EnvironmentalLight,
  FilamentScene,
  FilamentView,
  Light,
  RenderCallbackContext,
  useFilamentContext,
  useModel,
  useWorkletEffect,
  type Entity,
} from 'react-native-filament';
import { useSharedValue, type ISharedValue } from 'react-native-worklets-core';
import type { BoxPalette } from '../types';
import {
  BOX_MODEL,
  CLOSED_CENTER_Y,
  HINGE_AXIS,
  HINGE_PIVOT,
  OPEN_ANGLE,
  OPEN_CENTER_Y,
  PART,
  PRIMITIVE,
  hexToLinear,
} from './boxModel';

/**
 * Shared values that drive a box from React. Inputs are written on the JS
 * thread; the render loop on Filament's thread integrates them every frame.
 */
export type BoxRig = {
  /** 0 = closed, 1 = fully open (115°). The lid springs toward it. */
  openTarget: ISharedValue<number>;
  /** 1 while the user holds to open: the box charges up and shakes. */
  holding: ISharedValue<number>;
  /** 1 turns the box to face the viewer (shortest way round) and holds it there. */
  faceFront: ISharedValue<number>;
  /** Radians per second of idle turntable rotation. */
  autoSpin: ISharedValue<number>;
  dragging: ISharedValue<number>;
  dragYaw: ISharedValue<number>;
  dragElevation: ISharedValue<number>;
  yawVelocity: ISharedValue<number>;
  // Integrated state, owned by the render loop.
  yaw: ISharedValue<number>;
  elevation: ISharedValue<number>;
  lidAngle: ISharedValue<number>;
  lidVelocity: ISharedValue<number>;
  charge: ISharedValue<number>;
  lastTimestamp: ISharedValue<number>;
  aspect: ISharedValue<number>;
};

type RigOptions = { yaw?: number; autoSpin?: number; elevation?: number };

export function useBoxRig({ yaw = -0.6, autoSpin = 0, elevation = 0.45 }: RigOptions = {}): BoxRig {
  return {
    openTarget: useSharedValue(0),
    holding: useSharedValue(0),
    faceFront: useSharedValue(0),
    autoSpin: useSharedValue(autoSpin),
    dragging: useSharedValue(0),
    dragYaw: useSharedValue(yaw),
    dragElevation: useSharedValue(elevation),
    yawVelocity: useSharedValue(0),
    yaw: useSharedValue(yaw),
    elevation: useSharedValue(elevation),
    lidAngle: useSharedValue(0),
    lidVelocity: useSharedValue(0),
    charge: useSharedValue(0),
    lastTimestamp: useSharedValue(0),
    aspect: useSharedValue(0),
  };
}

/** Camera placement; `open` values are blended in as the lid opens. */
export type Framing = {
  focalLength: number;
  distance: number;
  openDistance: number;
  restElevation: number;
};

export const FRAMING = {
  card: { focalLength: 42, distance: 4.5, openDistance: 5.6, restElevation: 0.45 },
  stage: { focalLength: 40, distance: 4.6, openDistance: 5.8, restElevation: 0.45 },
} satisfies Record<string, Framing>;

type BoxSceneProps = {
  palette: BoxPalette;
  rig: BoxRig;
  framing: Framing;
  /** Enables drag-to-rotate with inertia. */
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
};

const MIN_ELEVATION = 0.02;
/** A slight three-quarter turn off dead-on front, so the box still reads as 3D. */
const FRONT_YAW = -0.45;
const MAX_ELEVATION = 1.05;

export function BoxScene({ palette, rig, framing, interactive = false, style }: BoxSceneProps) {
  const dragStart = useRef({ yaw: 0, elevation: 0 });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive,
        onMoveShouldSetPanResponder: (_, g) => interactive && Math.abs(g.dx) + Math.abs(g.dy) > 4,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragStart.current = { yaw: rig.yaw.value, elevation: rig.elevation.value };
          rig.dragYaw.value = rig.yaw.value;
          rig.dragElevation.value = rig.elevation.value;
          rig.yawVelocity.value = 0;
          rig.dragging.value = 1;
        },
        onPanResponderMove: (_, g) => {
          rig.dragYaw.value = dragStart.current.yaw + g.dx * 0.011;
          rig.dragElevation.value = Math.min(
            MAX_ELEVATION,
            Math.max(MIN_ELEVATION, dragStart.current.elevation + g.dy * 0.006),
          );
        },
        onPanResponderRelease: (_, g) => {
          // Gesture velocity is px/ms; convert to rad/s for the inertial spin.
          rig.yawVelocity.value = g.vx * 1000 * 0.011;
          rig.dragging.value = 0;
        },
        onPanResponderTerminate: () => {
          rig.dragging.value = 0;
        },
      }),
    [interactive, rig],
  );

  return (
    <View style={style} {...panResponder.panHandlers}>
      <FilamentScene fallback={<Loader />}>
        <BoxRenderer palette={palette} rig={rig} framing={framing} />
      </FilamentScene>
    </View>
  );
}

function Loader() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.loader]}>
      <ActivityIndicator color="#9aa4b5" />
    </View>
  );
}

type Parts = {
  root: Entity;
  base: Entity;
  lid: Entity;
  seam: Entity;
  wordmark: Entity;
};

function BoxRenderer({ palette, rig, framing }: Omit<BoxSceneProps, 'style' | 'interactive'>) {
  const { transformManager, renderableManager, camera, view } = useFilamentContext();
  const model = useModel(BOX_MODEL);

  const parts = useMemo<Parts | undefined>(() => {
    if (model.state !== 'loaded') {
      return undefined;
    }
    const { asset, rootEntity } = model;
    const base = asset.getFirstEntityByName(PART.base);
    const lid = asset.getFirstEntityByName(PART.lid);
    const seam = asset.getFirstEntityByName(PART.seam);
    const wordmark = asset.getFirstEntityByName(PART.wordmark);
    if (!base || !lid || !seam || !wordmark) {
      console.warn('Box model is missing a named part');
      return undefined;
    }
    return { root: rootEntity, base, lid, seam, wordmark };
  }, [model]);

  // Recolour the shared model per box. Materials are per-asset, and each
  // FilamentScene owns its own engine and asset, so boxes don't affect each other.
  const body = hexToLinear(palette.body);
  const accent = hexToLinear(palette.accent);
  const wordmarkColor = hexToLinear(palette.wordmark);
  const lining = hexToLinear(palette.lining);
  useWorkletEffect(() => {
    'worklet';
    if (parts == null) {
      return;
    }
    const tint = (entity: Entity, primitive: number, color: number[]) => {
      'worklet';
      renderableManager
        .getMaterialInstanceAt(entity, primitive)
        .setFloat4Parameter('baseColorFactor', [color[0], color[1], color[2], color[3]]);
    };
    tint(parts.base, PRIMITIVE.baseBody, body);
    tint(parts.lid, PRIMITIVE.lidBody, body);
    tint(parts.seam, PRIMITIVE.seamAccent, accent);
    tint(parts.seam, PRIMITIVE.seamLining, lining);
    tint(parts.wordmark, PRIMITIVE.wordmark, wordmarkColor);
  });

  const {
    openTarget,
    holding,
    faceFront,
    autoSpin,
    dragging,
    dragYaw,
    dragElevation,
    yawVelocity,
    yaw,
    elevation,
    lidAngle,
    lidVelocity,
    charge,
    lastTimestamp,
    aspect,
  } = rig;
  const { focalLength, distance, openDistance, restElevation } = framing;

  RenderCallbackContext.useRenderCallback(
    ({ timestamp, passedSeconds }) => {
      'worklet';
      if (parts == null) {
        return;
      }

      const now = timestamp / 1e9;
      const dt = lastTimestamp.value > 0 ? Math.min(Math.max(now - lastTimestamp.value, 0), 0.05) : 1 / 60;
      lastTimestamp.value = now;

      // Lens: only when the view's aspect ratio changes.
      const viewAspect = view.getAspectRatio();
      if (viewAspect !== aspect.value) {
        aspect.value = viewAspect;
        camera.setLensProjection(focalLength, viewAspect, 0.1, 50);
      }

      // Charge builds while holding and drains quickly on release.
      charge.value = Math.min(1, Math.max(0, charge.value + (holding.value > 0 ? dt / 1.1 : -dt * 2.5)));

      // Lid: slightly under-damped spring, so it overshoots a touch when it
      // swings open. While charging, the lid cracks open a few degrees.
      const lidTarget = openTarget.value * OPEN_ANGLE + charge.value * 0.14;
      const stiffness = openTarget.value > 0 ? 60 : 140;
      const damping = openTarget.value > 0 ? 9 : 22;
      lidVelocity.value += (stiffness * (lidTarget - lidAngle.value) - damping * lidVelocity.value) * dt;
      lidAngle.value += lidVelocity.value * dt;
      if (lidAngle.value < 0) {
        lidAngle.value = 0;
        lidVelocity.value = 0;
      }
      const openness = Math.min(1, lidAngle.value / OPEN_ANGLE);

      // Yaw: follow the finger while dragging, otherwise coast with friction
      // plus the idle turntable spin.
      if (faceFront.value > 0) {
        // The lid hinges at the back (+Z) and the camera sits in front (−Z),
        // so this yaw shows the front face and lets the lid swing away.
        const turns = Math.round((yaw.value - FRONT_YAW) / (2 * Math.PI));
        const target = FRONT_YAW + turns * 2 * Math.PI;
        yaw.value += (target - yaw.value) * Math.min(1, dt * 6);
        yawVelocity.value = 0;
        const elevationTarget = restElevation + openness * 0.35;
        elevation.value += (elevationTarget - elevation.value) * Math.min(1, dt * 4);
      } else if (dragging.value > 0) {
        const follow = Math.min(1, dt * 18);
        yaw.value += (dragYaw.value - yaw.value) * follow;
        elevation.value += (dragElevation.value - elevation.value) * follow;
      } else {
        yaw.value += (yawVelocity.value + autoSpin.value) * dt;
        yawVelocity.value *= Math.exp(-dt * 2.2);
        const elevationTarget = restElevation + openness * 0.35;
        elevation.value += (elevationTarget - elevation.value) * Math.min(1, dt * 2.5);
      }

      // Anticipation shake grows with the square of the charge.
      const shakeAmount = charge.value * charge.value;
      const shake = Math.sin(passedSeconds * 42) * 0.045 * shakeAmount;
      const hop = Math.abs(Math.sin(passedSeconds * 21)) * 0.03 * shakeAmount;
      const bob = Math.sin(passedSeconds * 1.6) * 0.015 * (1 - openness);

      // Centre the model on the origin, then spin it. Filament's matrix
      // helpers pre-multiply, so the chain reads bottom-to-top.
      const rootMatrix = transformManager
        .createIdentityMatrix()
        .translate([0, -CLOSED_CENTER_Y, 0])
        .rotate(shake, [0, 0, 1])
        .rotate(yaw.value, [0, 1, 0])
        .translate([0, bob + hop, 0]);
      transformManager.setTransform(parts.root, rootMatrix);

      // Hinge: T(pivot) · R(angle) · T(−pivot). The parts' node transforms
      // are identity, so this is their whole local transform.
      const hingeMatrix = transformManager
        .createIdentityMatrix()
        .translate([-HINGE_PIVOT[0], -HINGE_PIVOT[1], -HINGE_PIVOT[2]])
        .rotate(lidAngle.value, HINGE_AXIS)
        .translate(HINGE_PIVOT);
      transformManager.setTransform(parts.lid, hingeMatrix);
      transformManager.setTransform(parts.wordmark, hingeMatrix);

      // Orbit camera; pulls back and looks higher as the lid rises.
      const radius = distance + (openDistance - distance) * openness;
      // Aim above the open box so it settles low in frame, leaving room for the reveal.
      const targetY = (OPEN_CENTER_Y - CLOSED_CENTER_Y + 0.35) * openness;
      const el = elevation.value;
      camera.lookAt(
        [0, targetY + Math.sin(el) * radius, -Math.cos(el) * radius],
        [0, targetY, 0],
        [0, 1, 0],
      );
    },
    [
      parts,
      transformManager,
      camera,
      view,
      focalLength,
      distance,
      openDistance,
      restElevation,
      openTarget,
      holding,
      faceFront,
      autoSpin,
      dragging,
      dragYaw,
      dragElevation,
      yawVelocity,
      yaw,
      elevation,
      lidAngle,
      lidVelocity,
      charge,
      lastTimestamp,
      aspect,
    ],
  );

  return (
    <>
      <FilamentView style={StyleSheet.absoluteFill} enableTransparentRendering>
        <EnvironmentalLight source={{ uri: 'RNF_default_env_ibl.ktx' }} intensity={14_000} />
        {/* Key from the viewer's upper left, and a cool rim from behind. */}
        <Light type="directional" intensity={38_000} colorKelvin={5_600} direction={[0.55, -0.6, 0.6]} castShadows />
        <Light type="directional" intensity={16_000} colorKelvin={9_000} direction={[-0.5, -0.25, -0.85]} />
      </FilamentView>
      {parts == null && <Loader />}
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
