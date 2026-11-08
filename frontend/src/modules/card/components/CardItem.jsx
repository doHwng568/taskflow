import { CommentIcon } from './CardIcons';
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
  const commentCount = Array.isArray(card.comments) ? card.comments.length : 0;
  const isCoverColor = Boolean(
    card.coverImage && (card.coverImage.startsWith('#') || card.coverImage.startsWith('rgb'))
  );

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
        if (String(dragData.sourceColumnId) === String(columnId)) {
          return;
        }
        onDropOnCard(dragData.sourceColumnId, columnId, dragData.cardId, card.id);
      }
    } catch {
      // Ignore invalid drag payload
    }
  };

  return (
    <article
      className={`board-card ${card.coverImage ? 'has-cover' : ''}`.trim()}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={handleDrop}
      onClick={onClick}
    >
      {card.coverImage && (
        isCoverColor ? (
          <div
            className="board-card-cover is-color"
            style={{ backgroundColor: card.coverImage }}
          />
        ) : (
          <div className="board-card-cover">
            <img src={card.coverImage} alt="" draggable={false} />
          </div>
        )
      )}
      <div
        className="board-card-body"
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

        {(hasAnyDate || commentCount > 0) && (
          <span className="board-card-details">
            {hasAnyDate && (
              <span className={`board-card-due-date ${dateStatusClass}`.trim()}>
                ◷ {dateDisplay}
              </span>
            )}
            {commentCount > 0 && (
              <span className="card-badge-item" aria-label={`${commentCount} nhận xét`} title="Nhận xét">
                <CommentIcon size={16} />
                <span className="card-badge-count">{commentCount}</span>
              </span>
            )}
          </span>
        )}
      </div>

      <button
        type="button"
        draggable={false}
        className="board-card-edit"
        onClick={(event) => {
          event.stopPropagation();
          const cardEl = event.currentTarget.closest('.board-card');
          const rect = cardEl ? cardEl.getBoundingClientRect() : null;
          onEdit?.(rect);
        }}
        aria-label={`Sửa thẻ ${card.title}`}
        title="Sửa thẻ"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </button>
    </article>
  );
}
