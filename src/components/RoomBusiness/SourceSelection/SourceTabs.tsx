import { roomOffSourceKey, useRoomKey, useRoomSourceList } from '@pepperdash/mobile-control-react-app-core';
import { useLayoutEffect, useRef, useState } from 'react';
import { isMidnight } from '../../../theme/theme';
import classes from './SourceTabs.module.scss';


interface SourceTabsProps {
  /** The tab to highlight - a source-list item key, or undefined to highlight nothing. */
  selectedKey: string | undefined;
  /** Called with a source-list item key when a tab is tapped. */
  onSelect: (sourceListItemKey: string) => void;
}

/**
 * One row of source tabs, shared by basic and advanced routing: what a tap *means* differs between
 * the two (basic mode routes immediately to every display; advanced mode stages a selection for a
 * destination tap to consume), so this component only renders the list and reports taps - the
 * caller owns both the selection and what selecting does.
 *
 * "None" is not a synthetic tab - it's whichever configured source has `sourceKey ===
 * roomOffSourceKey` (my config's "roomOff" entry), always shown first regardless of its own
 * `includeInSourceList` flag, since it's a structural control rather than a content source.
 */
export const SourceTabs = ({ selectedKey, onSelect }: SourceTabsProps) => {
  const roomKey = useRoomKey();
  const sourceList = useRoomSourceList(roomKey);
  const listRef = useRef<HTMLDivElement>(null);
  const [slider, setSlider] = useState<{ left: number; width: number }>();

  // Midnight: one shared underline that slides to whichever tab is active, instead of each tab
  // showing its own. Re-measured on resize, since the tab widths follow the font and labels.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!isMidnight || !list) return;

    const measure = () => {
      const active = list.querySelector<HTMLElement>(`.${classes.active}`);
      setSlider(active ? { left: active.offsetLeft, width: active.offsetWidth } : undefined);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [selectedKey, sourceList]);

  if (!sourceList) return null;

  const entries = Object.entries(sourceList);
  const offEntry = entries.find(([, item]) => item.sourceKey === roomOffSourceKey);
  const contentEntries = entries
    .filter(([, item]) => item.sourceKey !== roomOffSourceKey && item.includeInSourceList)
    .sort(([, a], [, b]) => a.order - b.order);

  const tabs = offEntry
    ? [{ key: offEntry[0], label: 'None' }, ...contentEntries.map(([key, item]) => ({ key, label: item.preferredName }))]
    : contentEntries.map(([key, item]) => ({ key, label: item.preferredName }));

  return (
    <div className={classes.sourceList} ref={listRef}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`${classes.tab} ${selectedKey === tab.key ? classes.active : ''}`}
          onClick={() => onSelect(tab.key)}
        >
          <span className={classes.label}>{tab.label}</span>
          <span className={classes.underline} />
        </button>
      ))}
      {isMidnight && slider && (
        <span
          className={classes.slider}
          style={{ width: slider.width, transform: `translateX(${slider.left}px)` }}
        />
      )}
    </div>
  );
};

export default SourceTabs;
