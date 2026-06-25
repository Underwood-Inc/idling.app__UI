import styles from './RadioPlayerPanelResizeHandle.module.css';

export interface RadioPlayerPanelResizeHandleProps {
  panelHeightPx: number | null;
  onBeginResize: (clientY: number) => void;
  onResetHeight: () => void;
}

export function RadioPlayerPanelResizeHandle({
  panelHeightPx,
  onBeginResize,
  onResetHeight,
}: RadioPlayerPanelResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Drag to resize panel. Double-click to reset height."
      aria-valuenow={panelHeightPx ?? undefined}
      data-panel-resize-handle="true"
      className={styles.panelResizeHandle}
      data-mappy-cursor="ns-resize"
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onBeginResize(event.clientY);
      }}
      onDoubleClick={() => {
        onResetHeight();
      }}
    />
  );
}
