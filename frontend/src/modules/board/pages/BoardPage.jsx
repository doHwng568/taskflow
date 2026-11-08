import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BoardHeader from '../components/BoardHeader';
import BoardColumn from '../components/BoardColumn';
import CardDetailModal from '../components/CardDetailModal';
import ArchivedAreasPanel from '../components/ArchivedAreasPanel';
import areaService from '../services/areaService';
import '../styles/BoardPage.css';
import '../styles/AreaFeatures.css';

// Đổi dữ liệu area từ API thành dạng "cột" mà giao diện đang dùng
function toColumn(area) {
  return {
    id: area.id,
    title: area.name,
    position: area.position,
    color: area.color ?? null,
    cards: area.cards.map((card) => ({
      id: card.id,
      title: card.title,
      description: card.content ?? '',
      dueDate: card.dueDate ? card.dueDate.slice(0, 10) : '',
      color: '#ffffff',
    })),
  };
}

export default function BoardPage() {
  const { workspaceId } = useParams();

  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);

  const [showArchived, setShowArchived] = useState(false);
  const [archivedRefreshKey, setArchivedRefreshKey] = useState(0);
  const [draggingAreaId, setDraggingAreaId] = useState(null);

  // Tính năng 1: tải danh sách area của workspace từ API
  useEffect(() => {
    let ignore = false;

    async function loadAreas() {
      setLoading(true);
      setError('');
      try {
        const areas = await areaService.getByWorkspace(workspaceId);
        if (ignore) return;
        setColumns(areas.map(toColumn));
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message ?? 'Không tải được danh sách');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadAreas();
    return () => {
      ignore = true;
    };
  }, [workspaceId]);

  // Tính năng 2: tạo area mới, lưu vào database
  const handleCreateList = async (event) => {
    event.preventDefault();

    const title = newListTitle.trim();
    if (!title) return;

    try {
      const area = await areaService.create(workspaceId, title);
      setColumns((currentColumns) => [...currentColumns, toColumn(area)]);
      setNewListTitle('');
      setIsAddingList(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không tạo được danh sách');
    }
  };

  // Tính năng 3: đổi tên area, lưu vào database.
  // Cập nhật giao diện ngay (optimistic), nếu API lỗi thì trả lại tên cũ.
  const handleUpdateListTitle = async (columnId, newTitle) => {
    const previousTitle = columns.find((column) => column.id === columnId)?.title;

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId ? { ...column, title: newTitle } : column
      )
    );

    try {
      const area = await areaService.rename(columnId, newTitle);
      // Đồng bộ với tên server đã lưu (đã cắt khoảng trắng thừa)
      setColumns((currentColumns) =>
        currentColumns.map((column) =>
          column.id === columnId ? { ...column, title: area.name } : column
        )
      );
      setError('');
    } catch (err) {
      setColumns((currentColumns) =>
        currentColumns.map((column) =>
          column.id === columnId ? { ...column, title: previousTitle } : column
        )
      );
      setError(err.response?.data?.message ?? 'Không đổi được tên danh sách');
    }
  };

  // Các thao tác dưới đây vẫn chỉ đổi state trên trình duyệt,
  // sẽ được nối với API ở các tính năng sau.

  // Tính năng 4: xóa area. Thao tác không hoàn tác được nên chờ server xóa xong
  // rồi mới bỏ cột khỏi giao diện (không dùng optimistic update).
  const handleDeleteList = async (columnId) => {
    try {
      await areaService.remove(columnId);
      setColumns((currentColumns) =>
        currentColumns.filter((column) => column.id !== columnId)
      );
      setError('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không xóa được danh sách');
    }
  };

  // Tính năng 5: lưu trữ area (ẩn khỏi board, có thể khôi phục ở bảng "Đã lưu trữ")
  const handleArchiveList = async (columnId) => {
    try {
      await areaService.archive(columnId);
      setColumns((currentColumns) =>
        currentColumns.filter((column) => column.id !== columnId)
      );
      setArchivedRefreshKey((key) => key + 1); // bảng "Đã lưu trữ" đang mở thì tải lại
      setError('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không lưu trữ được danh sách');
    }
  };

  // Tính năng 5: area vừa được khôi phục -> đưa lại lên board đúng vị trí cũ
  const handleAreaRestored = (area) => {
    setColumns((currentColumns) => {
      if (currentColumns.some((column) => column.id === area.id)) {
        return currentColumns;
      }
      return [...currentColumns, toColumn(area)].sort(
        (a, b) => a.position - b.position
      );
    });
  };

  // Tính năng 6: đổi màu area (color = '#RRGGBB' hoặc null để bỏ màu).
  // Đổi ngay trên giao diện, nếu API lỗi thì trả lại màu cũ.
  const handleChangeColor = async (columnId, color) => {
    const previousColor = columns.find((column) => column.id === columnId)?.color ?? null;

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId ? { ...column, color } : column
      )
    );

    try {
      await areaService.changeColor(columnId, color);
      setError('');
    } catch (err) {
      setColumns((currentColumns) =>
        currentColumns.map((column) =>
          column.id === columnId ? { ...column, color: previousColor } : column
        )
      );
      setError(err.response?.data?.message ?? 'Không đổi được màu danh sách');
    }
  };

  // Tính năng 7: kéo area đến trước / sau một area khác.
  // Đổi thứ tự ngay trên giao diện, gửi id hai area hai bên để server tự tính position,
  // nếu API lỗi thì trả lại thứ tự cũ.
  const handleMoveArea = async (draggedId, targetId, placement) => {
    if (draggedId === targetId) return;

    const previousColumns = columns;
    const draggedColumn = columns.find((column) => column.id === draggedId);
    const withoutDragged = columns.filter((column) => column.id !== draggedId);
    const targetIndex = withoutDragged.findIndex((column) => column.id === targetId);

    if (!draggedColumn || targetIndex === -1) return;

    const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
    const reordered = [
      ...withoutDragged.slice(0, insertIndex),
      draggedColumn,
      ...withoutDragged.slice(insertIndex),
    ];

    // Thả đúng chỗ cũ thì không làm gì
    if (reordered.every((column, index) => column.id === previousColumns[index].id)) return;

    setColumns(reordered);

    const previousAreaId = reordered[insertIndex - 1]?.id ?? null;
    const nextAreaId = reordered[insertIndex + 1]?.id ?? null;

    try {
      await areaService.move(draggedId, previousAreaId, nextAreaId);
      setError('');
    } catch (err) {
      setColumns(previousColumns);
      setError(err.response?.data?.message ?? 'Không đổi được thứ tự danh sách');
    }
  };

  //----Card-----
  const handleCreateCard = (columnId, title) => {
    const newCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      description: '',
      dueDate: '',
      color: '#ffffff',
    };

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId
          ? { ...column, cards: [...(column.cards || []), newCard] }
          : column
      )
    );
  };

  const handleMoveCard = (sourceColumnId, targetColumnId, cardId) => {
    if (sourceColumnId === targetColumnId) return;

    setColumns((currentColumns) => {
      const sourceColumn = currentColumns.find((column) => column.id === sourceColumnId);
      const movedCard = sourceColumn?.cards?.find((card) => card.id === cardId);
      if (!movedCard) return currentColumns;

      return currentColumns.map((column) => {
        if (column.id === sourceColumnId) {
          return {
            ...column,
            cards: column.cards.filter((card) => card.id !== cardId),
          };
        }
        if (column.id === targetColumnId) {
          return {
            ...column,
            cards: [...(column.cards || []), movedCard],
          };
        }
        return column;
      });
    });
  };

  const handleOpenCard = (columnId, card) => {
    setSelectedCard({ columnId, card, view: 'details' });
  };

  const handleEditCard = (columnId, card) => {
    setSelectedCard({ columnId, card, view: 'quick' });
  };

  const handleSaveCard = (updatedCard) => {
    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === selectedCard.columnId
          ? {
            ...column,
            cards: column.cards.map((card) =>
              card.id === updatedCard.id ? updatedCard : card
            ),
          }
          : column
      )
    );

    setSelectedCard(null);
  };

  const handleUpdateCard = (updatedCard) => {
    if (!selectedCard) return;

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === selectedCard.columnId
          ? {
            ...column,
            cards: column.cards.map((card) =>
              card.id === updatedCard.id ? updatedCard : card
            ),
          }
          : column
      )
    );
    setSelectedCard((currentSelection) =>
      currentSelection ? { ...currentSelection, card: updatedCard } : currentSelection
    );
  };

  const handleToggleCardComplete = (columnId, cardId) => {
    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId
          ? {
            ...column,
            cards: column.cards.map((card) =>
              card.id === cardId ? { ...card, completed: !card.completed } : card
            ),
          }
          : column
      )
    );
  };

  const handleDeleteCard = () => {
    if (!selectedCard) return;

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === selectedCard.columnId
          ? {
            ...column,
            cards: column.cards.filter(
              (card) => card.id !== selectedCard.card.id
            ),
          }
          : column
      )
    );

    setSelectedCard(null);
  };

  return (
    <div
      className="board-page"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2000')" }}
    >
      <BoardHeader onOpenArchived={() => setShowArchived(true)} />

      <main className="board-lists">
        {loading && <p style={{ color: '#fff' }}>Đang tải...</p>}
        {error && <p style={{ color: '#ff8f8f' }}>{error}</p>}

        {columns.map((col) => (
          <BoardColumn
            key={col.id}
            column={col}
            onUpdateTitle={handleUpdateListTitle}
            onDeleteList={handleDeleteList}
            onCreateCard={handleCreateCard}
            onOpenCard={handleOpenCard}
            onEditCard={handleEditCard}
            onMoveCard={handleMoveCard}
            onToggleCardComplete={handleToggleCardComplete}
            onArchiveList={handleArchiveList}
            onChangeColor={handleChangeColor}
            onMoveArea={handleMoveArea}
            draggingAreaId={draggingAreaId}
            onAreaDragStart={setDraggingAreaId}
            onAreaDragEnd={() => setDraggingAreaId(null)}
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
      {selectedCard && (
        <CardDetailModal
          key={selectedCard.card.id}
          card={selectedCard.card}
          initialView={selectedCard.view}
          onClose={() => setSelectedCard(null)}
          onSave={handleSaveCard}
          onUpdateCard={handleUpdateCard}
          onDelete={handleDeleteCard}
        />
      )}

      {showArchived && (
        <ArchivedAreasPanel
          workspaceId={workspaceId}
          refreshKey={archivedRefreshKey}
          onClose={() => setShowArchived(false)}
          onRestored={handleAreaRestored}
        />
      )}
    </div>
  );
}