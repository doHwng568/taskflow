import { useState } from 'react';

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
}) {
  const [showColors, setShowColors] = useState(false);

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
        <button className="board-list-menu-option">
          Sao chép danh sách...
        </button>
        <button className="board-list-menu-option">
          Di chuyển danh sách...
        </button>
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