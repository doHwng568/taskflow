import { useState } from 'react';
import workspaceService from '../../workspace/services/workspaceService';

// Bảng màu: đều là màu tối để chữ sáng của area vẫn đọc rõ
const AREA_COLORS = [
  { name: 'Đỏ', value: '#7f1d1d' },
  { name: 'Cam', value: '#9a3412' },
  { name: 'Vàng', value: '#854d0e' },
  { name: 'Xanh lá', value: '#166534' },
  { name: 'Xanh ngọc', value: '#155e75' },
  { name: 'Xanh dương', value: '#1e40af' },
  { name: 'Tím', value: '#6b21a8' },
  { name: 'Hồng', value: '#9d174d' },
  { name: 'Xám', value: '#374151' },
  { name: 'Nâu', value: '#5b3a29' },
];

export default function ListActionMenu({
  onClose,
  onAddCard,
  onArchive,
  onDeleteList,
  color,
  onChangeColor,
  pinned,
  onTogglePin,
  onCopy,
  currentWorkspaceId,
  onMoveToWorkspace,
  totalColumns = 1,
  currentPosition = 1,
  onMovePosition,
}) {
  const [showColors, setShowColors] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [moveStatus, setMoveStatus] = useState('idle'); // idle | loading | error

  // Mở mục "Di chuyển danh sách..."
  const toggleMove = async () => {
    const willOpen = !showMove;
    setShowMove(willOpen);
    if (!willOpen || workspaces.length > 0) return;

    setMoveStatus('loading');
    try {
      const all = await workspaceService.getAll();
      setWorkspaces(
        Array.isArray(all)
          ? all.filter((ws) => String(ws.id) !== String(currentWorkspaceId))
          : []
      );
      setMoveStatus('idle');
    } catch {
      setMoveStatus('idle');
    }
  };

  return (
    <div className="board-list-menu">
      <div className="board-list-menu-header">
        <span>Thao tác với danh sách</span>
        <button
          onClick={onClose}
          className="board-list-menu-close"
          aria-label="Đóng menu"
        >
          ✕
        </button>
      </div>

      <div className="board-list-menu-options">
        <button
          onClick={onAddCard}
          className="board-list-menu-option"
        >
          Thêm thẻ...
        </button>
        <button
          onClick={onTogglePin}
          className="board-list-menu-option"
        >
          {pinned ? 'Bỏ ghim danh sách' : 'Ghim danh sách'}
        </button>
        <button
          onClick={onCopy}
          className="board-list-menu-option"
        >
          Sao chép danh sách...
        </button>
        <button
          onClick={toggleMove}
          className="board-list-menu-option board-list-menu-submenu"
          aria-expanded={showMove}
        >
          <span>Di chuyển danh sách...</span>
          <span className="text-xs">{showMove ? '⌄' : '❯'}</span>
        </button>
        {showMove && (
          <div className="board-list-menu-workspaces">
            <p className="board-list-menu-hint">Vị trí trong bảng:</p>
            <div className="board-list-menu-positions">
              {Array.from({ length: Math.max(1, totalColumns) }, (_, idx) => idx + 1).map(
                (pos) => {
                  const isCurrent = pos === currentPosition;
                  return (
                    <button
                      key={pos}
                      type="button"
                      className={`board-list-pos-btn ${isCurrent ? 'is-active' : ''}`}
                      disabled={isCurrent}
                      onClick={() => onMovePosition?.(pos)}
                    >
                      {pos}
                    </button>
                  );
                }
              )}
            </div>

            {workspaces.length > 0 && (
              <>
                <p className="board-list-menu-hint">Chuyển sang bảng khác:</p>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    className="board-list-menu-option"
                    onClick={() => onMoveToWorkspace(ws)}
                  >
                    {ws.name}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
        <button className="board-list-menu-option">
          Theo dõi
        </button>
      </div>

      <div className="board-list-menu-divider" />

      <button
        className="board-list-menu-option board-list-menu-submenu"
        onClick={() => setShowColors((isOpen) => !isOpen)}
        aria-expanded={showColors}
      >
        <span>Thay đổi màu danh sách</span>
        <span className="text-xs">{showColors ? '⌄' : '❯'}</span>
      </button>

      {showColors && (
        <div className="board-list-menu-colors-wrap">
          <div className="board-list-menu-colors">
            {AREA_COLORS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`board-list-menu-swatch ${color === item.value ? 'is-selected' : ''}`}
                style={{ backgroundColor: item.value }}
                title={item.name}
                aria-label={`Màu ${item.name}`}
                onClick={() => onChangeColor(item.value)}
              />
            ))}
          </div>
          <button
            type="button"
            className="board-list-menu-clear-color"
            onClick={() => onChangeColor(null)}
            disabled={!color}
          >
            Bỏ màu
          </button>
        </div>
      )}

      <div className="board-list-menu-divider" />

      <div className="board-list-menu-options">
        <button
          onClick={onArchive}
          className="board-list-menu-option"
        >
          Lưu trữ danh sách này
        </button>
        <button
          onClick={onDeleteList}
          className="board-list-menu-option is-danger"
        >
          Xóa danh sách này
        </button>
      </div>
    </div>
  );
}
