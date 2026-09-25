import { useITemperatureSensor } from '@pepperdash/mobile-control-react-app-core';
import { useDeviceHumidity } from '../../../hooks/useDeviceHumidity';
import { useTechRackSensorDeviceKey, useTechSystemStatusDeviceKeys } from '../../../hooks/useTechSystemStatus';
import HealthItem from './HealthItem';
import RackReadingItem from './RackReadingItem';
import { humidityHealthStatus, temperatureHealthStatus } from './rackReadingHealth';
import classes from './SystemStatusPage.module.scss';

/**
 * Tech System Status page: a health item per device in `techSystemStatusDeviceKeys`, plus the
 * rack sensor's temperature/humidity readings along the bottom.
 */
export const SystemStatusPage = () => {
  const deviceKeys = useTechSystemStatusDeviceKeys();
  const rackSensorKey = useTechRackSensorDeviceKey();

  // `.state` is typed as always present once the hook returns, but like the rest of a device's
  // state it's only actually populated once `/fullStatus` returns - guard past it too.
  const temperatureState = useITemperatureSensor(rackSensorKey ?? '')?.state;
  const humidity = useDeviceHumidity(rackSensorKey);

  const temperatureValue = temperatureState ? parseFloat(temperatureState.temperature) : undefined;
  const humidityValue = humidity ? parseFloat(humidity) : undefined;

  return (
    <div className={classes.page}>
      <div className={classes.grid}>
        {deviceKeys.map((key) => (
          <HealthItem key={key} deviceKey={key} />
        ))}
      </div>

      {rackSensorKey && (
        <div className={classes.bottomRow}>
          {temperatureValue !== undefined && (
            <RackReadingItem
              status={temperatureHealthStatus(temperatureValue)}
              label={`Rack Temp: ${temperatureState?.temperature}`}
            />
          )}

          {humidity !== undefined && (
            <RackReadingItem
              status={humidityHealthStatus(humidityValue ?? 0)}
              label={`Rack Humidity: ${humidity}`}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SystemStatusPage;
