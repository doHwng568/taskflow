import { useState } from 'react';
import BoardHeader from '../components/BoardHeader';
import BoardColumn from '../components/BoardColumn';
import '../styles/BoardPage.css';

export default function BoardPage() {
  const [columns, setColumns] = useState([
    { id: 'col-1', title: 'Cần làm', cardsCount: 0 },
    { id: 'col-2', title: 'Đang làm', cardsCount: 0 },
    { id: 'col-3', title: 'SBA', cardsCount: 0 },
    { id: 'col-4', title: 'Đã xong', cardsCount: 0 },
  ]);

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const handleCreateList = (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    setColumns([
      ...columns,
      { id: `col-${Date.now()}`, title: newListTitle, cardsCount: 0 }
    ]);
    setNewListTitle('');
    setIsAddingList(false);
  };

  const handleUpdateListTitle = (columnId, newTitle) => {
    setColumns(columns.map(col => col.id === columnId ? { ...col, title: newTitle } : col));
  };

  const handleDeleteList = (columnId) => {
    setColumns(columns.filter(col => col.id !== columnId));
  };

  return (
    <div
      className="board-page"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2000')" }}
    >
      <BoardHeader />

      <main className="board-lists">
        {columns.map((col) => (
          <BoardColumn
            key={col.id}
            column={col}
            onUpdateTitle={handleUpdateListTitle}
            onDeleteList={handleDeleteList}
          />
        ))}

        {isAddingList ? (
          <form onSubmit={handleCreateList} className="board-add-list-form">
            <input
              autoFocus
              type="text"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="Nhập tiêu đề danh sách..."
              className="board-add-list-input"
            />
            <div className="board-add-list-actions">
              <button
                type="submit"
                className="board-add-list-submit"
              >
                Thêm danh sách
              </button>
              <button
                type="button"
                onClick={() => setIsAddingList(false)}
                className="board-add-list-cancel"
                aria-label="Hủy thêm danh sách"
              >
                ✕
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingList(true)}
            className="board-add-list-button"
          >
            <span aria-hidden="true">＋</span> Thêm danh sách khác
          </button>
        )}
      </main>

      <nav className="board-bottom-nav" aria-label="Điều hướng bảng">
        <button className="board-nav-item">
          <span aria-hidden="true">▣</span> Hộp thư đến
        </button>
        <button className="board-nav-item">
          <span aria-hidden="true">▦</span> Trình lập kế hoạch
        </button>
        <button className="board-nav-item is-active" aria-current="page">
          <span aria-hidden="true">▥</span> Bảng thông tin
        </button>
        <button className="board-nav-item">
          <span aria-hidden="true">▤</span> Chuyển đổi các bảng
        </button>
      </nav>
    </div>
  );
}