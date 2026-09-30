jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { Image, Text, View } = require('react-native');

  const strip = (Component) => {
    const Wrapped = React.forwardRef(({ entering, exiting, layout, ...props }, ref) =>
      React.createElement(Component, { ...props, ref }),
    );
    Wrapped.displayName = `Animated(${Component.displayName ?? Component.name ?? 'Component'})`;
    return Wrapped;
  };
  // Layout animations are chainable builders: FadeIn.delay(100).duration(200)…
  const builder = new Proxy({}, { get: () => () => builder });
  const identity = (value) => value;

  return {
    __esModule: true,
    default: { View: strip(View), Text: strip(Text), Image: strip(Image) },
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: (factory) => factory(),
    withTiming: identity,
    withSpring: identity,
    withDelay: (_, value) => value,
    withRepeat: identity,
    withSequence: (...values) => values[values.length - 1],
    runOnJS: (fn) => fn,
    cancelAnimation: () => {},
    interpolate: (value, input, output) => output[input.indexOf(value)] ?? output[0],
    Easing: { linear: identity, cubic: identity, sin: identity, out: () => identity, inOut: () => identity },
    FadeIn: builder,
    FadeOut: builder,
    FadeInDown: builder,
    SlideInDown: builder,
    SlideOutDown: builder,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaProvider: ({ children }) => React.createElement(View, { children }),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Filament renders natively; tests only cover the React tree around it.
jest.mock('./src/three/BoxScene', () => {
  const React = require('react');
  const { View } = require('react-native');
  const value = (v) => ({ value: v });

  return {
    FRAMING: { card: {}, stage: {} },
    useBoxRig: () => ({
      openTarget: value(0),
      holding: value(0),
      faceFront: value(0),
      autoSpin: value(0),
      dragging: value(0),
      dragYaw: value(0),
      dragElevation: value(0),
      yawVelocity: value(0),
      yaw: value(0),
      elevation: value(0),
      lidAngle: value(0),
      lidVelocity: value(0),
      charge: value(0),
      lastTimestamp: value(0),
      aspect: value(0),
    }),
    BoxScene: (props) => React.createElement(View, { style: props.style, testID: 'box-scene' }),
  };
});
