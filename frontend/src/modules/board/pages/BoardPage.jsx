import { useState } from 'react';
import BoardHeader from '../components/BoardHeader';
import BoardColumn from '../components/BoardColumn';
import CardDetailModal from '../../card/components/CardDetailModal';
import cardApi from '../../card/api/cardApi';
import '../styles/BoardPage.css';

export default function BoardPage() {
  const [columns, setColumns] = useState([
  { id: 'col-1', title: 'Cần làm', cards: [] },
  { id: 'col-2', title: 'Đang làm', cards: [] },
  { id: 'col-3', title: 'Đã xong', cards: [] },
]);

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);


  const handleCreateList = (event) => {
    event.preventDefault();

    const title = newListTitle.trim();
    if (!title) return;

    setColumns((currentColumns) => [
      ...currentColumns,
      {
        id: `col-${Date.now()}`,
        title,
        cards: [],
      },
    ]);
    setNewListTitle('');
    setIsAddingList(false);
  };

  const handleUpdateListTitle = (columnId, newTitle) => {
    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId ? { ...column, title: newTitle } : column
      )
    );
  };

  const handleDeleteList = (columnId) => {
    setColumns((currentColumns) =>
      currentColumns.filter((column) => column.id !== columnId)
    );
  };

  const handleMoveColumn = (sourceColumnId, targetColumnId) => {
    if (!sourceColumnId || !targetColumnId || sourceColumnId === targetColumnId) {
      return;
    }

    setColumns((currentColumns) => {
      const sourceIndex = currentColumns.findIndex((col) => col.id === sourceColumnId);
      const targetIndex = currentColumns.findIndex((col) => col.id === targetColumnId);
      if (sourceIndex === -1 || targetIndex === -1) return currentColumns;

      const updatedColumns = [...currentColumns];
      const [movedColumn] = updatedColumns.splice(sourceIndex, 1);
      updatedColumns.splice(targetIndex, 0, movedColumn);
      return updatedColumns;
    });
  };

  //----Card (API + UI update)-----
  const parseNumericId = (rawId) => {
    const num = Number(String(rawId).replace(/\D/g, ''));
    return Number.isFinite(num) && num > 0 ? num : null;
  };

  const handleCreateCard = async (columnId, title) => {
    let createdFromServer = null;
    try {
      const res = await cardApi.createCardApi({
        title,
        content: '',
        areaId: parseNumericId(columnId),
      });
      createdFromServer = res?.data?.data;
    } catch {
      // Fallback khi server chưa kết nối DB
    }

    const newCard = {
      id: createdFromServer?.id ?? `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: createdFromServer?.title ?? title,
      description: createdFromServer?.content ?? '',
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

  const handleMoveCard = async (sourceColumnId, targetColumnId, cardId, targetCardId = null) => {
    if (sourceColumnId === targetColumnId && (!targetCardId || cardId === targetCardId)) {
      return;
    }

    const numericCardId = parseNumericId(cardId);
    const numericTargetAreaId = parseNumericId(targetColumnId);
    if (numericCardId && numericTargetAreaId) {
      try {
        await cardApi.moveCardApi(numericCardId, {
          targetAreaId: numericTargetAreaId,
        });
      } catch {
        // Fallback khi server chưa kết nối DB
      }
    }

    setColumns((currentColumns) => {
      const sourceColumn = currentColumns.find((column) => column.id === sourceColumnId);
      const movedCard = sourceColumn?.cards?.find((card) => card.id === cardId);
      if (!movedCard) return currentColumns;

      if (sourceColumnId === targetColumnId) {
        return currentColumns.map((column) => {
          if (column.id !== sourceColumnId) return column;
          const remainingCards = column.cards.filter((card) => card.id !== cardId);
          const targetIndex = remainingCards.findIndex((card) => card.id === targetCardId);
          if (targetIndex === -1) {
            return { ...column, cards: [...remainingCards, movedCard] };
          }
          const updatedCards = [...remainingCards];
          updatedCards.splice(targetIndex, 0, movedCard);
          return { ...column, cards: updatedCards };
        });
      }

      return currentColumns.map((column) => {
        if (column.id === sourceColumnId) {
          return {
            ...column,
            cards: column.cards.filter((card) => card.id !== cardId),
          };
        }
        if (column.id === targetColumnId) {
          const existingCards = column.cards || [];
          if (targetCardId) {
            const targetIndex = existingCards.findIndex((card) => card.id === targetCardId);
            if (targetIndex !== -1) {
              const updatedCards = [...existingCards];
              updatedCards.splice(targetIndex, 0, movedCard);
              return { ...column, cards: updatedCards };
            }
          }
          return {
            ...column,
            cards: [...existingCards, movedCard],
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

  const syncCardUpdateToBackend = async (updatedCard) => {
    const numericCardId = parseNumericId(updatedCard.id);
    if (!numericCardId) return;

    const dueDateIso = updatedCard.dueDate
      ? `${updatedCard.dueDate}T${updatedCard.dueTime || '17:00'}:00`
      : null;

    try {
      await cardApi.updateCardApi(numericCardId, {
        title: updatedCard.title,
        content: updatedCard.description || '',
        dueDate: dueDateIso,
      });
    } catch {
      // Fallback khi server chưa kết nối DB
    }
  };

  const handleSaveCard = async (updatedCard) => {
    await syncCardUpdateToBackend(updatedCard);

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

  const handleUpdateCard = async (updatedCard) => {
    if (!selectedCard) return;

    await syncCardUpdateToBackend(updatedCard);

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

  const handleDeleteCard = async () => {
    if (!selectedCard) return;

    const numericCardId = parseNumericId(selectedCard.card.id);
    if (numericCardId) {
      try {
        await cardApi.deleteCardApi(numericCardId);
      } catch {
        // Fallback khi server chưa kết nối DB
      }
    }

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
      <BoardHeader />

      <main className="board-lists">
        {columns.map((col) => (
          <BoardColumn
            key={col.id}
            column={col}
            onUpdateTitle={handleUpdateListTitle}
            onDeleteList={handleDeleteList}
            onMoveColumn={handleMoveColumn}
            onCreateCard={handleCreateCard}
            onOpenCard={handleOpenCard}
            onEditCard={handleEditCard}
            onMoveCard={handleMoveCard}
            onToggleCardComplete={handleToggleCardComplete}
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
    </div>
  );
}
