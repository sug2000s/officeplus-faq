import React from 'react';
import styles from './TagBadge.module.css';

interface TagBadgeProps {
  name: string;
  color?: string | null;
  onRemove?: () => void;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ name, color, onRemove }) => {
  const badgeStyle = color
    ? { backgroundColor: `${color}20`, borderColor: color, color }
    : {};

  return (
    <span className={styles.badge} style={badgeStyle}>
      {name}
      {onRemove && (
        <button className={styles.removeBtn} onClick={onRemove}>
          &times;
        </button>
      )}
    </span>
  );
};
