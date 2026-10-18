import { useState } from 'react';
import ListActionMenu from './ListActionMenu';

export default function BoardColumn({ column, onUpdateTitle, onDeleteList }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);

  const handleTitleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onUpdateTitle(column.id, title);
    } else {
      setTitle(column.title);
    }
    setIsEditingTitle(false);
  };

  return (
    <section className="board-column">
      <div className="board-column-heading">
        {isEditingTitle ? (
          <form onSubmit={handleTitleSubmit} className="board-column-title-form">
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              className="board-column-title-input"
            />
          </form>
        ) : (
          <h2
            onClick={() => setIsEditingTitle(true)}
            className="board-column-title"
          >
            {column.title}
          </h2>
        )}

        <div className="board-column-meta">
          <span className="board-card-count">
            {column.cardsCount || 0}
          </span>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="board-column-menu-button"
            aria-label={`Tùy chọn danh sách ${column.title}`}
            aria-expanded={showMenu}
          >
            •••
          </button>
        </div>
      </div>

      {showMenu && (
        <ListActionMenu
          onClose={() => setShowMenu(false)}
          onAddCard={() => setShowMenu(false)}
          onDeleteList={() => {
            onDeleteList(column.id);
            setShowMenu(false);
          }}
        />
      )}

      <div className="board-column-footer">
        <button className="board-add-card-button">
          <span aria-hidden="true">＋</span> Thêm thẻ
        </button>
        <button className="board-create-card-button" aria-label="Tạo thẻ bằng mẫu">
          ↗
        </button>
      </div>
    </section>
  );
}