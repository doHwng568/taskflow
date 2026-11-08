import { useRef, useState } from 'react';
import ListActionMenu from './ListActionMenu';
import CardItem from '../../card/components/CardItem';
import AddCardForm from '../../card/components/AddCardForm';

// Kiểu dữ liệu riêng khi kéo area. Kéo thẻ dùng 'text/plain' nên hai loại kéo không lẫn nhau.
const AREA_DRAG_TYPE = 'application/x-area-id';

const isAreaDrag = (event) =>
  Array.from(event.dataTransfer.types).includes(AREA_DRAG_TYPE);

export default function BoardColumn({ column, onUpdateTitle, onDeleteList, onCreateCard,
  onOpenCard, onEditCard, onMoveCard, onToggleCardComplete,
  onArchiveList, onChangeColor, onMoveArea,
  workspaceId, onTogglePin, onCopyList, onMoveToWorkspace,
  draggingAreaId, onAreaDragStart, onAreaDragEnd, }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [areaDropPlacement, setAreaDropPlacement] = useState(null); // 'before' | 'after' | null
  const sectionRef = useRef(null);

  // Con trỏ nằm nửa trái cột -> thả vào trước cột này, nửa phải -> thả vào sau
  const getPlacement = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    // Đang kéo một area (không phải thẻ)
    if (isAreaDrag(event)) {
      if (draggingAreaId === column.id) return; // đang kéo qua chính nó
      setAreaDropPlacement(getPlacement(event));
      return;
    }

    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragOver(false);
      setAreaDropPlacement(null);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    setAreaDropPlacement(null);

    // Thả một area: đổi thứ tự
    if (isAreaDrag(event)) {
      const draggedId = Number(event.dataTransfer.getData(AREA_DRAG_TYPE));
      const placement = getPlacement(event);

      onAreaDragEnd();
      if (draggedId && draggedId !== column.id) {
        onMoveArea(draggedId, column.id, placement);
      }
      return;
    }

    // Thả một thẻ
    try {
      const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
      if (dragData.cardId && dragData.sourceColumnId) {
        onMoveCard(dragData.sourceColumnId, column.id, dragData.cardId);
      }
    } catch {
      // Ignore drops that do not come from a board card.
    }
  };

  const handleAreaDragStart = (event) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(AREA_DRAG_TYPE, String(column.id));

    // Dùng cả cột làm ảnh khi kéo (mặc định chỉ có phần tiêu đề)
    if (sectionRef.current) {
      event.dataTransfer.setDragImage(sectionRef.current, 20, 20);
    }

    // Trì hoãn đổi state: đổi giao diện ngay trong dragstart có thể làm trình duyệt hủy thao tác kéo
    setTimeout(() => onAreaDragStart(column.id), 0);
  };

  const handleAreaDragEnd = () => {
    onAreaDragEnd();
  };

  const handleTitleSubmit = (e) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    setIsEditingTitle(false);

    // Trống hoặc không đổi gì thì không gọi API, trả ô nhập về tên hiện tại
    if (!trimmedTitle || trimmedTitle === column.title) {
      setTitle(column.title);
      return;
    }

    onUpdateTitle(column.id, trimmedTitle);
  };

  const startEditingTitle = () => {
    setTitle(column.title); // luôn bắt đầu từ tên hiện tại (kể cả khi vừa bị hoàn lại do lỗi)
    setIsEditingTitle(true);
  };

  const showCardForm = () => {
    setIsAddingCard(true);
    setShowMenu(false);
  };

  return (
    <section
      ref={sectionRef}
      className={[
        'board-column',
        column.color ? 'has-color' : '',
        isDragOver ? 'is-drop-target' : '',
        draggingAreaId === column.id ? 'is-area-dragging' : '',
        areaDropPlacement ? `is-area-drop-${areaDropPlacement}` : '',
      ].filter(Boolean).join(' ')}
      style={column.color ? { '--area-color': column.color } : undefined}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="board-column-heading"
        draggable={!isEditingTitle}
        onDragStart={handleAreaDragStart}
        onDragEnd={handleAreaDragEnd}
      >
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
            onClick={startEditingTitle}
            className="board-column-title"
          >
            {column.title}
          </h2>
        )}

        <div className="board-column-meta">
          {column.pinned && (
            <span className="board-column-pin-badge" title="Đã ghim" aria-label="Đã ghim">📌</span>
          )}
          <span className="board-card-count">{column.cards.length}</span>
          <button
            onClick={() => setShowMenu((isOpen) => !isOpen)}
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
          onAddCard={showCardForm}
          color={column.color}
          onChangeColor={(color) => onChangeColor(column.id, color)}
          pinned={Boolean(column.pinned)}
          onTogglePin={() => {
            setShowMenu(false);
            onTogglePin(column.id, !column.pinned);
          }}
          onCopy={() => {
            setShowMenu(false);
            onCopyList(column.id);
          }}
          currentWorkspaceId={workspaceId}
          onMoveToWorkspace={(workspace) => {
            setShowMenu(false);
            if (window.confirm(`Chuyển danh sách "${column.title}" (kèm ${column.cards.length} thẻ) sang workspace "${workspace.name}"?`)) {
              onMoveToWorkspace(column.id, workspace.id);
            }
          }}
          onArchive={() => {
            setShowMenu(false);
            onArchiveList(column.id);
          }}
          onDeleteList={() => {
            setShowMenu(false);

            const cardCount = column.cards.length;
            const message =
              cardCount > 0
                ? `Xóa danh sách "${column.title}"?\n\nDanh sách có ${cardCount} thẻ, các thẻ này cũng sẽ bị xóa vĩnh viễn.`
                : `Xóa danh sách "${column.title}"?`;

            if (window.confirm(message)) {
              onDeleteList(column.id);
            }
          }}
        />
      )}

      <div className="board-column-cards">
        {column.cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            columnId={column.id}
            onClick={() => onOpenCard(column.id, card)}
            onEdit={(rect) => onEditCard(column.id, card, rect)}
            onToggleComplete={onToggleCardComplete}
            onDropOnCard={(sourceColId, targetColId, draggedCardId, targetCardId) => {
              setIsDragOver(false);
              onMoveCard(sourceColId, targetColId, draggedCardId, targetCardId);
            }}
          />
        ))}
      </div>
      <AddCardForm
        columnId={column.id}
        onCreateCard={onCreateCard}
        isAddingCard={isAddingCard}
        setIsAddingCard={setIsAddingCard}
      />
    </section>
  );
}