export default function ListActionMenu({ onClose, onAddCard, onDeleteList }) {
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

      <div className="board-list-menu-option board-list-menu-submenu">
        <span>Thay đổi màu danh sách</span>
        <span className="text-xs">❯</span>
      </div>

      <div className="board-list-menu-divider" />

      <div className="board-list-menu-options">
        <button
          onClick={onDeleteList}
          className="board-list-menu-option is-danger"
        >
          Lưu trữ/Xóa danh sách này
        </button>
      </div>
    </div>
  );
}