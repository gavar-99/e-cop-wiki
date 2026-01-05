import React from 'react';
import { colors, transitions } from '../../styles/theme';

const ResizablePanel = ({ children, width, onStartResize }) => {
  return (
    <>
      {/* Resizer Handle */}
      <div
        onMouseDown={onStartResize}
        style={styles.resizer}
        onMouseEnter={(e) => (e.target.style.backgroundColor = colors.primary)}
        onMouseLeave={(e) => (e.target.style.backgroundColor = colors.border)}
      />

      {/* Panel Content */}
      <aside style={{ ...styles.panel, width: `${width}px` }}>
        {children}
      </aside>
    </>
  );
};

const styles = {
  resizer: {
    width: '4px',
    cursor: 'col-resize',
    backgroundColor: colors.border,
    transition: `background-color ${transitions.normal}`,
    zIndex: 10,
  },
  panel: {
    backgroundColor: colors.backgroundSecondary,
  },
};

export default ResizablePanel;
