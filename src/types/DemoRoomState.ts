import { RoomState } from '@pepperdash/mobile-control-react-app-core';

/**
 * State the demo room pushes to this app.
 *
 * `RoomState` itself (isOn, isWarmingUp, volumes, configuration, ...) is populated automatically
 * by the framework's `MobileControlEssentialsRoomBridge` - every room that implements
 * `IEssentialsRoom` gets that for free, no custom code needed. `roomType` is the one field this
 * demo actually adds on top, posted by `DemoRoomMessenger`
 * (`EssentialsDemoRoom/src/DemoRoom/DemoRoomMessenger.cs`).
 *
 * `configuration.defaultDisplayKey` and top-level `selectedSourceKey` are also on the base
 * `RoomConfiguration`/`RoomState` types already - the framework declares them but never populates
 * them (`RunRouteActionMessenger` only handles the inbound `/source` action; nothing tracks which
 * source is current), so `DemoRoomMessenger` fills those in, nested/placed exactly where the base
 * type already expects them rather than as fields here.
 *
 * The room's audio device is not exposed as a key at all: `RoomState.volumes.master` and the
 * `/room/{key}/volumes/master/*` actions are wired automatically via `IHasCurrentVolumeControls`,
 * so the client never needs to know which device backs the room's volume control.
 */
/** One entry in `DemoRoomState.techDisplays` - see `DemoRoomTechDisplayConfig` on the C# side. */
export interface TechDisplayConfig {
  /** Device key of the display itself - implements `IHasPowerControlWithFeedback` + `IHasInputs<string>`. */
  deviceKey: string;
  /** Device key of this display's projector screen (`IProjectorScreenLiftControl`), if it has one. */
  screenDeviceKey?: string;
  /** Device key of this display's projector lift (`IProjectorScreenLiftControl`), if it has one. */
  liftDeviceKey?: string;
}

export interface DemoRoomState extends RoomState {
  /** Config `type` of the room device. Matches the type name in `DemoRoomFactory`. */
  roomType: 'essentialsDemoRoom';
  /**
   * Device keys shown on the tech System Status page, in display order - posted by
   * `DemoRoomMessenger` from `DemoRoomTechConfig.SystemStatusDeviceKeys`. There's no framework
   * concept of "the devices to monitor" for a room, so this is how the demo room tells the client
   * which ones to ask about via `useICommunicationMonitor`.
   */
  techSystemStatusDeviceKeys?: string[];
  /**
   * Device key of the rack sensor (temperature/humidity) shown on the tech System Status page -
   * posted by `DemoRoomMessenger` from `DemoRoomTechConfig.RackSensorDeviceKey`.
   */
  techRackSensorDeviceKey?: string;
  /**
   * Displays shown on the tech Displays page, in display order - posted by `DemoRoomMessenger` from
   * `DemoRoomTechConfig.Displays`. There's no framework concept of "the displays in a room" beyond
   * the routing destination list, so this is how the demo room tells the client which devices to
   * offer and, for a display with a projector screen/lift, which companion devices back its extra
   * controls.
   */
  techDisplays?: TechDisplayConfig[];
  /**
   * Device key of the matrix router shown on the tech Routing page - posted by `DemoRoomMessenger`
   * from `DemoRoomTechConfig.RoutingDeviceKey`.
   */
  techRoutingDeviceKey?: string;
}
