import '../styles/Card.css';

const formatShortDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const currentYear = new Date().getFullYear();
  const base = `${Number(day)} thg ${Number(month)}`;
  return Number(year) !== currentYear ? `${base}, ${year}` : base;
};

const getCardDateBadgeStatus = (card) => {
  if (!card.dueDate) return '';
  if (card.completed) return 'is-complete';
  const target = new Date(`${card.dueDate}T${card.dueTime || '23:59'}:00`);
  const diffMs = target.getTime() - Date.now();
  if (diffMs < 0) return 'is-overdue';
  if (diffMs <= 48 * 60 * 60 * 1000) return 'is-due-soon';
  return '';
};

export default function CardItem({
  card,
  columnId,
  onClick,
  onEdit,
  onToggleComplete,
  onDropOnCard,
}) {
  const hasStartDate = Boolean(card.startDate);
  const hasDueDate = Boolean(card.dueDate);
  const hasAnyDate = hasStartDate || hasDueDate;
  const labels = Array.isArray(card.labels) ? card.labels : [];
  const dateStatusClass = getCardDateBadgeStatus(card);

  const dateDisplay = hasStartDate && hasDueDate
    ? `${formatShortDate(card.startDate)} - ${formatShortDate(card.dueDate)}`
    : hasDueDate
      ? formatShortDate(card.dueDate)
      : `Bắt đầu: ${formatShortDate(card.startDate)}`;

  const handleDragStart = (event) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ type: 'card', cardId: card.id, sourceColumnId: columnId })
    );
    event.currentTarget.classList.add('is-dragging');
  };

  const handleDragEnd = (event) => {
    event.stopPropagation();
    event.currentTarget.classList.remove('is-dragging');
  };

  const handleDrop = (event) => {
    if (!onDropOnCard) return;

    try {
      const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
      if (dragData.cardId && dragData.sourceColumnId) {
        event.preventDefault();
        event.stopPropagation();
        onDropOnCard(dragData.sourceColumnId, columnId, dragData.cardId, card.id);
      }
    } catch {
      // Ignore invalid drag payload
    }
  };

  return (
    <article
      className="board-card"
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={handleDrop}
      onClick={onClick}
      style={{ backgroundColor: card.color || '#ffffff' }}
    >
      <div className="board-card-topline">
        <button
          type="button"
          draggable={false}
          className={`board-card-check ${card.completed ? 'is-complete' : ''}`}
          aria-label={card.completed ? `Đánh dấu chưa hoàn thành: ${card.title}` : `Đánh dấu hoàn thành: ${card.title}`}
          aria-pressed={Boolean(card.completed)}
          onClick={(event) => {
            event.stopPropagation();
            onToggleComplete?.(columnId, card.id);
          }}
        />
        <div
          role="button"
          tabIndex={0}
          className={`board-card-main ${card.completed ? 'is-complete' : ''}`}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              onClick?.(event);
            }
          }}
        >
          <span className="board-card-title">{card.title}</span>
        </div>
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

      {(card.description || hasAnyDate) && (
        <span className="board-card-details">
          {card.description && <span aria-label="Có mô tả">▤</span>}
          {hasAnyDate && (
            <span className={`board-card-due-date ${dateStatusClass}`.trim()}>
              ◷ {dateDisplay}
            </span>
          )}
        </span>
      )}

      <button
        type="button"
        draggable={false}
        className="board-card-edit"
        onClick={(event) => {
          event.stopPropagation();
          onEdit?.(event);
        }}
        aria-label={`Sửa thẻ ${card.title}`}
        title="Sửa thẻ"
      >
        ✎
      </button>
    </article>
  );
}
