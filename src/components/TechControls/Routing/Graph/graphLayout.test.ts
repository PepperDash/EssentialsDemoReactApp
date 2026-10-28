import { describe, expect, it } from 'vitest';

import { buildGraph, traceSignalPath } from './graphLayout';
import { RoutingDevice, RoutingPort, TieLine } from './routingTypes';

// The demo config's routing: four sources into matrix-router, which feeds two displays and the
// program audio output. The mics aren't wired to anything.
const port = (key: string, signalType = 'AudioVideo'): RoutingPort => ({
  key,
  signalType,
  connectionType: 'Hdmi',
  isInternal: false,
});

const source = (key: string): RoutingDevice => ({
  key,
  name: key,
  hasInputs: false,
  hasOutputs: true,
  hasInputsAndOutputs: false,
  outputPorts: [port('anyOut')],
});

const sourceKeys = ['source-laptop', 'source-wireless', 'source-media', 'source-cable'];

const devices: RoutingDevice[] = [
  ...sourceKeys.map(source),
  {
    key: 'matrix-router',
    name: 'Matrix Router',
    hasInputs: true,
    hasOutputs: true,
    hasInputsAndOutputs: true,
    inputPorts: sourceKeys.map((k) => port(k)),
    outputPorts: [port('display-1'), port('display-2'), port('programAudio', 'Audio')],
  },
  // Like the mock display, it has more inputs than are wired.
  { key: 'display-1', name: 'Left Display', hasInputs: true, hasOutputs: false, hasInputsAndOutputs: false, inputPorts: [port('hdmiIn1'), port('hdmiIn2')] },
  { key: 'display-2', name: 'Right Display', hasInputs: true, hasOutputs: false, hasInputsAndOutputs: false, inputPorts: [port('hdmiIn1')] },
  { key: 'program-audio', name: 'Program Audio', hasInputs: true, hasOutputs: false, hasInputsAndOutputs: false, inputPorts: [port('anyAudioIn', 'Audio')] },
  { key: 'audio-lectern-mic', name: 'Lectern Mic', hasInputs: false, hasOutputs: true, hasInputsAndOutputs: false, outputPorts: [port('out', 'Audio')] },
];

const tieLine = (src: string, srcPort: string, dst: string, dstPort: string, signalType = 'AudioVideo'): TieLine => ({
  sourceDeviceKey: src,
  sourcePortKey: srcPort,
  destinationDeviceKey: dst,
  destinationPortKey: dstPort,
  signalType,
  isInternal: false,
});

const tieLines: TieLine[] = [
  ...sourceKeys.map((k) => tieLine(k, 'anyOut', 'matrix-router', k)),
  tieLine('matrix-router', 'display-1', 'display-1', 'hdmiIn1', 'Video'),
  tieLine('matrix-router', 'display-2', 'display-2', 'hdmiIn1', 'Video'),
  tieLine('matrix-router', 'programAudio', 'program-audio', 'anyAudioIn', 'Audio'),
];

const NONE = new Set<string>();

describe('buildGraph with the demo topology', () => {
  it('draws one node per wired device and one edge per tie line', () => {
    const { nodes, edges } = buildGraph({ devices, tieLines }, NONE, true, NONE, false, {});

    expect(nodes.map((n) => n.id).sort()).toEqual(
      [...sourceKeys, 'matrix-router', 'display-1', 'display-2', 'program-audio'].sort()
    );
    expect(edges).toHaveLength(tieLines.length);
  });

  it('keeps unwired devices when "hide unconnected" is off', () => {
    const { nodes } = buildGraph({ devices, tieLines }, NONE, false, NONE, false, {});
    expect(nodes.map((n) => n.id)).toContain('audio-lectern-mic');
  });

  it('hides unwired ports when asked', () => {
    const inputsOfLeftDisplay = (hidePorts: boolean) => {
      const { nodes } = buildGraph({ devices, tieLines }, NONE, true, NONE, hidePorts, {});
      const node = nodes.find((n) => n.id === 'display-1')!;
      return (node.data as { device: RoutingDevice }).device.inputPorts!.map((p) => p.key);
    };

    expect(inputsOfLeftDisplay(true)).toEqual(['hdmiIn1']);
    expect(inputsOfLeftDisplay(false)).toEqual(['hdmiIn1', 'hdmiIn2']);
  });

  it('lays sources out left of the matrix, and the matrix left of the displays', () => {
    const { nodes } = buildGraph({ devices, tieLines }, NONE, true, NONE, false, {});
    const x = (id: string) => nodes.find((n) => n.id === id)!.position.x;

    expect(x('source-laptop')).toBeLessThan(x('matrix-router'));
    expect(x('matrix-router')).toBeLessThan(x('display-1'));
  });
});

describe('traceSignalPath with the demo topology', () => {
  it('follows a display back through the matrix to its source', () => {
    const { edges } = buildGraph({ devices, tieLines }, NONE, true, NONE, false, {});
    const toLeftDisplay = edges.find((e) => e.target === 'display-1')!;

    const path = traceSignalPath(edges, toLeftDisplay.id, {
      'matrix-router': [{ inputPortKey: 'source-laptop', outputPortKey: 'display-1', signalType: 'AudioVideo' }],
    });

    const laptopEdge = edges.find((e) => e.source === 'source-laptop')!;
    const mediaEdge = edges.find((e) => e.source === 'source-media')!;
    expect(path.has(laptopEdge.id)).toBe(true);
    expect(path.has(mediaEdge.id)).toBe(false);
  });

  it('follows only the clicked signal through a breakaway output', () => {
    // Video from the laptop and Audio from the media player, both switched to the Left Display
    // output. The matrix-to-display tie line is Video, so tracing it must not pull in the media
    // player's Audio route.
    const { edges } = buildGraph({ devices, tieLines }, NONE, true, NONE, false, {});
    const toLeftDisplay = edges.find((e) => e.target === 'display-1')!;

    const path = traceSignalPath(edges, toLeftDisplay.id, {
      'matrix-router': [
        { inputPortKey: 'source-laptop', outputPortKey: 'display-1', signalType: 'Video' },
        { inputPortKey: 'source-media', outputPortKey: 'display-1', signalType: 'Audio' },
      ],
    });

    expect(path.has(edges.find((e) => e.source === 'source-laptop')!.id)).toBe(true);
    expect(path.has(edges.find((e) => e.source === 'source-media')!.id)).toBe(false);
  });
});
