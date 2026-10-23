export default function CardItem({ card, columnId, onClick, onEdit, onToggleComplete }) {
  const hasDueDate = Boolean(card.dueDate);
  const labels = Array.isArray(card.labels) ? card.labels : [];

  const handleDragStart = (event) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ cardId: card.id, sourceColumnId: columnId })
    );
    event.currentTarget.classList.add('is-dragging');
  };

  const handleDragEnd = (event) => {
    event.currentTarget.classList.remove('is-dragging');
  };

  return (
    <article
      className="board-card"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ backgroundColor: card.color || '#ffffff' }}
    >
      <div className="board-card-topline">
        <button
          type="button"
          className={`board-card-check ${card.completed ? 'is-complete' : ''}`}
          aria-label={card.completed ? `Đánh dấu chưa hoàn thành: ${card.title}` : `Đánh dấu hoàn thành: ${card.title}`}
          aria-pressed={Boolean(card.completed)}
          onClick={(event) => {
            event.stopPropagation();
            onToggleComplete?.(columnId, card.id);
          }}
        />
        <button
          type="button"
          className={`board-card-main ${card.completed ? 'is-complete' : ''}`}
          onClick={onClick}
        >
          <span className="board-card-title">{card.title}</span>
        </button>
      </div>

      {labels.length > 0 && (
        <span className="board-card-labels" aria-label="Nhãn">
          {labels.map((label) => (
            <span
              key={label.id}
              className="board-card-label"
              style={{ backgroundColor: label.color }}
              title={label.name}
            />
          ))}
        </span>
      )}

      {(card.description || hasDueDate) && (
        <span className="board-card-details">
          {card.description && <span aria-label="Có mô tả">▤</span>}
          {hasDueDate && (
            <span className="board-card-due-date">
              ◷{' '}
              {new Date(`${card.dueDate}T00:00:00`).toLocaleDateString('vi-VN')}
            </span>
          )}
        </span>
      )}

      <button
        type="button"
        className="board-card-edit"
        onClick={onEdit}
        aria-label={`Sửa thẻ ${card.title}`}
        title="Sửa thẻ"
      >
        ✎
      </button>
    </article>
  );
}
