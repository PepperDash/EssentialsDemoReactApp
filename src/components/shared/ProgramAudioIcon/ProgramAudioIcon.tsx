interface ProgramAudioIconProps {
  className?: string;
}

/**
 * Speaker-with-sound-waves glyph for the "set/currently program audio source" control.
 *
 * Hand-authored rather than downloaded: Figma supplied this as two 150x150 PNGs (a white fill and
 * a black fill of the same glyph, for the inactive/active states), and the project doesn't use
 * raster assets. Uses `currentColor` so the caller drives white-on-dark vs. black-on-light purely
 * through CSS `color`, rather than needing two image files for what is otherwise one icon.
 */
export const ProgramAudioIcon = ({ className }: ProgramAudioIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <polygon points="3,9 3,15 7.5,15 13,20 13,4 7.5,9" fill="currentColor" />
    <path
      d="M16.5 8.5a5 5 0 0 1 0 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M19 5.5a9.5 9.5 0 0 1 0 13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export default ProgramAudioIcon;
