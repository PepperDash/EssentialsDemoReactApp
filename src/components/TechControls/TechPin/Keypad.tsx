import classes from './Keypad.module.scss';

const DIGIT_LETTERS: Record<string, string> = {
  '2': 'abc',
  '3': 'def',
  '4': 'ghi',
  '5': 'jkl',
  '6': 'mno',
  '7': 'pqrs',
  '8': 'tuv',
  '9': 'wxyz',
};

interface KeypadProps {
  onDigit: (digit: string) => void;
  onClear: () => void;
  onDelete: () => void;
}

/**
 * The numeric entry pad: 1-9, Clear, 0, Delete. The letters under 2-9 are purely decorative
 * (a standard phone-keypad convention) - nothing here does text input.
 */
export const Keypad = ({ onDigit, onClear, onDelete }: KeypadProps) => (
  <div className={classes.keypad}>
    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
      <button key={digit} type="button" className={classes.key} onClick={() => onDigit(digit)}>
        <span className={classes.digit}>{digit}</span>
        {DIGIT_LETTERS[digit] && <span className={classes.letters}>{DIGIT_LETTERS[digit]}</span>}
      </button>
    ))}

    <button type="button" className={classes.key} onClick={onClear}>
      <span className={classes.label}>Clear</span>
    </button>
    <button type="button" className={classes.key} onClick={() => onDigit('0')}>
      <span className={classes.digit}>0</span>
    </button>
    <button type="button" className={classes.key} onClick={onDelete}>
      <span className={classes.label}>Delete</span>
    </button>
  </div>
);

export default Keypad;
