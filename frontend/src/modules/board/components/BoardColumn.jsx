import { useState } from 'react';
import ListActionMenu from './ListActionMenu';
import CardItem from '../../card/components/CardItem';
import AddCardForm from '../../card/components/AddCardForm';

export default function BoardColumn({ column, onUpdateTitle, onDeleteList, onMoveColumn, onCreateCard,
  onOpenCard, onEditCard, onMoveCard, onToggleCardComplete, }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleColumnDragStart = (event) => {
    if (
      event.target.closest('.board-card') ||
      event.target.closest('input, textarea, button, .board-list-menu')
    ) {
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ type: 'column', sourceColumnId: column.id })
    );
    event.currentTarget.classList.add('is-dragging-column');
  };

  const handleColumnDragEnd = (event) => {
    event.currentTarget.classList.remove('is-dragging-column');
    setIsDragOver(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);

    try {
      const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
      if (dragData.type === 'column' && dragData.sourceColumnId) {
        onMoveColumn?.(dragData.sourceColumnId, column.id);
        return;
      }
      if (dragData.cardId && dragData.sourceColumnId) {
        if (String(dragData.sourceColumnId) === String(column.id)) {
          return;
        }
        onMoveCard(dragData.sourceColumnId, column.id, dragData.cardId);
      }
    } catch {
      // Ignore drops that do not come from a board card or column.
    }
  };

  const handleTitleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onUpdateTitle(column.id, title);
    } else {
      setTitle(column.title);
    }
    setIsEditingTitle(false);
  };

  const showCardForm = () => {
    setIsAddingCard(true);
    setShowMenu(false);
  };

  return (
    <section
      className={`board-column ${isDragOver ? 'is-drop-target' : ''}`}
      draggable={!isEditingTitle && !isAddingCard}
      onDragStart={handleColumnDragStart}
      onDragEnd={handleColumnDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
          onDeleteList={() => {
            onDeleteList(column.id);
            setShowMenu(false);
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
              if (String(sourceColId) === String(targetColId)) {
                return;
              }
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
