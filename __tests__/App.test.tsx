import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import App from '../App';
import { ApiError, api, configureApi } from '../src/api/mockApi';
import { BOXES } from '../src/data/catalog';

beforeAll(() => {
  configureApi({ latencyMs: [0, 0], failureRate: 0 });
});

const texts = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root
    .findAllByType(Text)
    .map(node => [node.props.children].flat().join(''));

describe('App', () => {
  it('loads the catalogue with a 3D scene per box', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = ReactTestRenderer.create(<App />);
    });
    // Let the simulated catalogue and profile requests resolve.
    await act(() => new Promise<void>(resolve => setTimeout(resolve, 20)));

    const rendered = texts(tree!);
    expect(rendered).toContain('Choose a box');
    for (const box of BOXES) {
      expect(rendered).toContain(box.name);
    }
    const scenes = tree!.root.findAll(
      node =>
        typeof node.type === 'string' && node.props.testID === 'box-scene',
    );
    expect(scenes).toHaveLength(BOXES.length);
  });
});

describe('mock API', () => {
  it('charges the box price and adds a watch the box can contain', async () => {
    const box = BOXES[0];
    const before = await api.fetchProfile();
    const { balance, item } = await api.purchaseBox(box.id);

    expect(balance).toBe(before.balance - box.price);
    expect(box.odds.map(o => o.watchId)).toContain(item.watchId);
    expect((await api.fetchProfile()).collection[0].uid).toBe(item.uid);
  });

  it('rejects purchases the balance cannot cover', async () => {
    const { balance } = await api.fetchProfile();
    const expensive = BOXES.reduce((a, b) => (a.price > b.price ? a : b));
    while ((await api.fetchProfile()).balance >= expensive.price) {
      await api.purchaseBox(expensive.id);
    }

    await expect(api.purchaseBox(expensive.id)).rejects.toMatchObject({
      code: 'INSUFFICIENT_FUNDS',
    });
    await expect(api.purchaseBox(expensive.id)).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(balance).toBeGreaterThan(0);
  });

  it('persists balance and collection across app restarts', async () => {
    const before = await api.fetchProfile();
    const { balance, item } = await api
      .purchaseBox(BOXES[0].id)
      .catch(async () => {
        await api.topUp(BOXES[0].price);
        return api.purchaseBox(BOXES[0].id);
      });
    expect(before.balance).not.toBe(balance);

    // A fresh module instance simulates a cold start reading from storage.
    let reloaded: typeof api | undefined;
    jest.isolateModules(() => {
      const fresh = require('../src/api/mockApi');
      fresh.configureApi({ latencyMs: [0, 0], failureRate: 0 });
      reloaded = fresh.api;
    });
    const profile = await reloaded!.fetchProfile();
    expect(profile.balance).toBe(balance);
    expect(profile.collection[0].uid).toBe(item.uid);
  });

  it('box odds sum to 100%', () => {
    for (const box of BOXES) {
      expect(box.odds.reduce((sum, o) => sum + o.chance, 0)).toBe(100);
    }
  });
});
