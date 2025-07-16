import './LogicToggle.css';

export interface LogicToggleProps {
  currentLogic: 'AND' | 'OR';
  onToggle: (logic: 'AND' | 'OR') => void;
  allTitle?: string;
  anyTitle?: string;
  className?: string;
  disabled?: boolean;
}

export function LogicToggle({
  currentLogic,
  onToggle,
  allTitle = 'All selected items must match',
  anyTitle = 'Any selected item can match',
  className = '',
  disabled = false
}: LogicToggleProps) {
  return (
    <div className={`logic-toggle ${className}`}>
      <div className="logic-toggle__button-group">
        <button
          className={`logic-toggle__button ${
            currentLogic === 'AND' ? 'logic-toggle__button--active' : ''
          }`}
          onClick={() => !disabled && currentLogic !== 'AND' && onToggle('AND')}
          title={allTitle}
          disabled={disabled}
        >
          ALL
        </button>
        <button
          className={`logic-toggle__button ${
            currentLogic === 'OR' ? 'logic-toggle__button--active' : ''
          }`}
          onClick={() => !disabled && currentLogic !== 'OR' && onToggle('OR')}
          title={anyTitle}
          disabled={disabled}
        >
          ANY
        </button>
      </div>
    </div>
  );
}
