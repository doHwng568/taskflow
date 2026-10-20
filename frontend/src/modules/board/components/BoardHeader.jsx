export default function BoardHeader() {
  return (
    <header className="board-header">
      <div className="board-header-left">
        <button className="board-title">
          SBA
          <span className="board-view-icon" aria-hidden="true">▥⌄</span>
        </button>
      </div>

      <div className="board-header-actions">
        <div className="board-avatar" aria-label="Người dùng LN">
          LN
        </div>
        <button className="board-icon-button" aria-label="Kết nối">♧</button>
        <button className="board-icon-button" aria-label="Tự động hóa">ϟ</button>
        <button className="board-icon-button" aria-label="Lọc">☰</button>
        <button className="board-icon-button" aria-label="Đánh dấu yêu thích">☆</button>
        <button className="board-icon-button" aria-label="Quyền riêng tư">♙</button>
        <button className="board-share-button">
          <span aria-hidden="true">♙</span> Chia sẻ
        </button>
        <button className="board-icon-button board-more-button" aria-label="Tùy chọn khác">•••</button>
      </div>
    </header>
  );
}