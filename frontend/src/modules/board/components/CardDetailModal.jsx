import { useState } from 'react';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthForDate = (dateString) => {
  const date = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

const makeCalendarDays = (month) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
};

function CardDateEditor({
  startDate,
  setStartDate,
  dueDate,
  setDueDate,
  startEnabled,
  setStartEnabled,
  dueEnabled,
  setDueEnabled,
  startTime,
  setStartTime,
  dueTime,
  setDueTime,
  recurrence,
  setRecurrence,
  reminder,
  setReminder,
  calendarMonth,
  setCalendarMonth,
  calendarTarget,
  setCalendarTarget,
}) {
  const today = getLocalDateString();
  const selectedDate = calendarTarget === 'start' ? startDate : dueDate;
  const calendarDays = makeCalendarDays(calendarMonth);
  const changeMonth = (amount) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };
  const changeYear = (amount) => {
    setCalendarMonth((current) => new Date(current.getFullYear() + amount, current.getMonth(), 1));
  };
  const selectCalendarDate = (date) => {
    const value = getLocalDateString(date);
    if (calendarTarget === 'start') {
      setStartDate(value);
      setStartEnabled(true);
    } else {
      setDueDate(value);
      setDueEnabled(true);
    }
  };
  const toggleDate = (target, enabled) => {
    if (target === 'start') {
      setStartEnabled(enabled);
      if (enabled && !startDate) setStartDate(today);
      if (!enabled) setStartDate('');
    } else {
      setDueEnabled(enabled);
      if (enabled && !dueDate) setDueDate(today);
      if (!enabled) setDueDate('');
    }
  };

  return (
    <div className="card-date-editor">
      <div className="card-date-calendar">
        <div className="card-calendar-header">
          <button type="button" onClick={() => changeYear(-1)} aria-label="Năm trước">«</button>
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Tháng trước">‹</button>
          <strong>Tháng {calendarMonth.getMonth() + 1} {calendarMonth.getFullYear()}</strong>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Tháng sau">›</button>
          <button type="button" onClick={() => changeYear(1)} aria-label="Năm sau">»</button>
        </div>
        <div className="card-calendar-grid card-calendar-weekdays" aria-hidden="true">
          {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="card-calendar-grid card-calendar-days">
          {calendarDays.map((date) => {
            const value = getLocalDateString(date);
            const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
            const isSelected = value === selectedDate;
            return (
              <button
                type="button"
                key={value}
                className={`${isCurrentMonth ? '' : 'is-outside-month'} ${isSelected ? 'is-selected' : ''} ${value === today ? 'is-today' : ''}`.trim()}
                aria-pressed={isSelected}
                onClick={() => selectCalendarDate(date)}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card-date-fields">
        <div className="card-date-field-group">
          <label className="card-date-field-title" htmlFor="card-start-date-enabled">
            <input
              id="card-start-date-enabled"
              type="checkbox"
              checked={startEnabled}
              onFocus={() => setCalendarTarget('start')}
              onChange={(event) => toggleDate('start', event.target.checked)}
            />
            <span>Ngày bắt đầu</span>
          </label>
          <div className="card-date-field-controls">
            <input
              type="text"
              className="card-modal-input"
              value={formatDateForDisplay(startDate)}
              placeholder="dd/mm/yyyy"
              readOnly
              disabled={!startEnabled}
              onFocus={() => setCalendarTarget('start')}
              onClick={() => setCalendarTarget('start')}
              aria-label="Ngày bắt đầu"
            />
            <input
              type="time"
              step="60"
              className="card-modal-input card-date-time"
              value={startTime}
              disabled={!startEnabled}
              onChange={(event) => setStartTime(event.target.value)}
              aria-label="Giờ bắt đầu"
            />
          </div>
        </div>

        <div className="card-date-field-group">
          <label className="card-date-field-title" htmlFor="card-due-date-enabled">
            <input
              id="card-due-date-enabled"
              type="checkbox"
              checked={dueEnabled}
              onFocus={() => setCalendarTarget('due')}
              onChange={(event) => toggleDate('due', event.target.checked)}
            />
            <span>Ngày hết hạn</span>
          </label>
          <div className="card-date-field-controls">
            <input
              type="text"
              className="card-modal-input"
              value={formatDateForDisplay(dueDate)}
              placeholder="dd/mm/yyyy"
              readOnly
              disabled={!dueEnabled}
              onFocus={() => setCalendarTarget('due')}
              onClick={() => setCalendarTarget('due')}
              aria-label="Ngày hết hạn"
            />
            <input
              type="time"
              step="60"
              className="card-modal-input card-date-time"
              value={dueTime}
              disabled={!dueEnabled}
              onChange={(event) => setDueTime(event.target.value)}
              aria-label="Giờ hết hạn"
            />
          </div>
        </div>

        <label className="card-date-select-label" htmlFor="card-date-recurrence">Định kỳ</label>
        <select
          id="card-date-recurrence"
          className="card-modal-input"
          value={recurrence}
          onChange={(event) => setRecurrence(event.target.value)}
        >
          <option value="none">Không bao giờ</option>
          <option value="daily">Hằng ngày</option>
          <option value="weekly">Hằng tuần</option>
          <option value="monthly">Hằng tháng</option>
          <option value="yearly">Hằng năm</option>
        </select>

        <label className="card-date-select-label" htmlFor="card-date-reminder">Thiết lập Nhắc nhở</label>
        <select
          id="card-date-reminder"
          className="card-modal-input"
          value={reminder}
          onChange={(event) => setReminder(event.target.value)}
        >
          <option value="none">Không nhắc</option>
          <option value="at-time">Đúng thời điểm đến hạn</option>
          <option value="5-minutes">5 phút trước</option>
          <option value="1-hour">1 giờ trước</option>
          <option value="1-day">1 ngày trước</option>
          <option value="2-days">2 ngày trước</option>
          <option value="1-week">1 tuần trước</option>
        </select>
        <p className="card-date-reminder-note">
          Chọn thời điểm cần nhắc trước ngày hết hạn.
        </p>
      </div>
    </div>
  );
}

const labelOptions = [
  { id: 'green', name: 'Xanh lá', color: '#4bce97' },
  { id: 'yellow', name: 'Vàng', color: '#f5cd47' },
  { id: 'orange', name: 'Cam', color: '#fea362' },
  { id: 'red', name: 'Đỏ', color: '#f87168' },
  { id: 'purple', name: 'Tím', color: '#c97cf4' },
  { id: 'blue', name: 'Xanh dương', color: '#579dff' },
];

export default function CardDetailModal({
  card,
  initialView = 'details',
  onClose,
  onSave,
  onUpdateCard,
  onDelete,
}) {
  const [activePanel, setActivePanel] = useState(initialView);
  const [activePopover, setActivePopover] = useState(null);
  const [title, setTitle] = useState(card.title || '');
  const [completed, setCompleted] = useState(Boolean(card.completed));
  const [description, setDescription] = useState(card.description || '');
  const [startDate, setStartDate] = useState(card.startDate || '');
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [startEnabled, setStartEnabled] = useState(card.startDateEnabled ?? Boolean(card.startDate));
  const [dueEnabled, setDueEnabled] = useState(card.dueDateEnabled ?? Boolean(card.dueDate));
  const [startTime, setStartTime] = useState(card.startTime || '09:00');
  const [dueTime, setDueTime] = useState(card.dueTime || '17:00');
  const [recurrence, setRecurrence] = useState(card.recurrence || 'none');
  const [reminder, setReminder] = useState(card.reminder || '1-day');
  const [calendarMonth, setCalendarMonth] = useState(() => getMonthForDate(card.dueDate || card.startDate));
  const [calendarTarget, setCalendarTarget] = useState('due');
  const [labels, setLabels] = useState(Array.isArray(card.labels) ? card.labels : []);
  const [popoverSnapshot, setPopoverSnapshot] = useState(null);
  const [comments, setComments] = useState(Array.isArray(card.comments) ? card.comments : []);
  const [commentDraft, setCommentDraft] = useState('');
  const [labelSearch, setLabelSearch] = useState('');
  const [editingLabelId, setEditingLabelId] = useState(null);

  const getUpdatedCard = (overrides = {}) => ({
    ...card,
    title: title.trim(),
    completed,
    description: description.trim(),
    startDate: startEnabled ? startDate : '',
    dueDate: dueEnabled ? dueDate : '',
    startDateEnabled: startEnabled,
    dueDateEnabled: dueEnabled,
    startTime,
    dueTime,
    recurrence,
    reminder,
    labels,
    comments,
    ...overrides,
  });

  const toggleCompletion = () => {
    const nextCompleted = !completed;
    setCompleted(nextCompleted);
    onUpdateCard?.({ ...card, completed: nextCompleted });
  };

  const saveChanges = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onSave(getUpdatedCard({ title: trimmedTitle }));
  };

  const savePopoverChanges = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onUpdateCard?.(getUpdatedCard({ title: trimmedTitle }));
    setPopoverSnapshot(null);
    setActivePopover(null);
  };

  const cancelPopoverChanges = () => {
    if (popoverSnapshot) {
      setLabels(popoverSnapshot.labels);
      setStartDate(popoverSnapshot.startDate);
      setDueDate(popoverSnapshot.dueDate);
      setStartEnabled(popoverSnapshot.startEnabled);
      setDueEnabled(popoverSnapshot.dueEnabled);
      setStartTime(popoverSnapshot.startTime);
      setDueTime(popoverSnapshot.dueTime);
      setRecurrence(popoverSnapshot.recurrence);
      setReminder(popoverSnapshot.reminder);
    }
    setPopoverSnapshot(null);
    setActivePopover(null);
  };

  const openPopover = (popover) => {
    if (activePopover === popover) {
      cancelPopoverChanges();
      return;
    }

    setPopoverSnapshot({
      labels,
      startDate,
      dueDate,
      startEnabled,
      dueEnabled,
      startTime,
      dueTime,
      recurrence,
      reminder,
    });
    setActivePopover(popover);
  };

  const removeDate = () => {
    const clearedDate = getUpdatedCard({
      startDate: '',
      dueDate: '',
      startDateEnabled: false,
      dueDateEnabled: false,
      recurrence: 'none',
      reminder: 'none',
    });
    setStartDate('');
    setDueDate('');
    setStartEnabled(false);
    setDueEnabled(false);
    setRecurrence('none');
    setReminder('none');

    if (activePopover === 'date') {
      onUpdateCard?.(clearedDate);
      setPopoverSnapshot(null);
      setActivePopover(null);
      return;
    }
    onSave(clearedDate);
  };

  const handleCommentSubmit = (event) => {
    event.preventDefault();
    const text = commentDraft.trim();
    if (!text) return;

    const updatedComments = [
      ...comments,
      {
        id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text,
        createdAt: new Date().toISOString(),
      },
    ];
    setComments(updatedComments);
    setCommentDraft('');
    onUpdateCard?.({ ...card, comments: updatedComments });
  };

  const toggleLabel = (option) => {
    setLabels((currentLabels) => {
      const exists = currentLabels.some((label) => label.id === option.id);
      return exists
        ? currentLabels.filter((label) => label.id !== option.id)
        : [...currentLabels, option];
    });
  };

  const updateLabelColor = (option, color) => {
    setLabels((currentLabels) => {
      const existing = currentLabels.find((label) => label.id === option.id);
      if (existing) {
        return currentLabels.map((label) =>
          label.id === option.id ? { ...label, color } : label
        );
      }
      return [...currentLabels, { ...option, color }];
    });
  };

  const panelTitle = {
    details: 'Chi tiết thẻ',
    labels: 'Nhãn',
    date: 'Ngày',
  }[activePanel];

  const dateEditorProps = {
    startDate,
    setStartDate,
    dueDate,
    setDueDate,
    startEnabled,
    setStartEnabled,
    dueEnabled,
    setDueEnabled,
    startTime,
    setStartTime,
    dueTime,
    setDueTime,
    recurrence,
    setRecurrence,
    reminder,
    setReminder,
    calendarMonth,
    setCalendarMonth,
    calendarTarget,
    setCalendarTarget,
  };

  return (
    <div className="card-modal-backdrop" onMouseDown={onClose}>
      <section
        className={`card-modal ${activePanel === 'quick' ? 'card-modal-quick' : ''} ${activePanel === 'details' ? 'card-modal-details' : ''} ${activePanel === 'date' ? 'card-modal-date' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {activePanel === 'quick' ? (
          <div className="card-quick-layout">
            <div className="card-quick-editor">
              <textarea
                className="card-quick-title-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-label="Tiêu đề thẻ"
                autoFocus
                rows={4}
              />
              <button type="button" className="card-save-button" onClick={saveChanges}>
                Lưu
              </button>
            </div>
            <nav className="card-quick-actions" aria-label="Thao tác với thẻ">
              <button type="button" onClick={() => setActivePanel('details')}>
                <span aria-hidden="true">▣</span> Mở thẻ
              </button>
              <button type="button" onClick={() => {
                setActivePopover(null);
                setActivePanel('labels');
              }}>
                <span aria-hidden="true">◇</span> Chỉnh sửa nhãn
              </button>
              <button type="button" onClick={() => {
                setActivePopover(null);
                setActivePanel('date');
              }}>
                <span aria-hidden="true">◷</span> Chỉnh sửa ngày
              </button>
            </nav>
          </div>
        ) : (
          <>
            <header className="card-modal-header">
              <button
                type="button"
                className="card-modal-back"
                onClick={() => {
                  setActivePopover(null);
                  setActivePanel('quick');
                }}
                aria-label="Quay lại"
              >
                ‹
              </button>
              <h2 id="card-modal-title">{panelTitle}</h2>
              <button
                type="button"
                className="card-modal-close"
                onClick={onClose}
                aria-label="Đóng"
              >
                ×
              </button>
            </header>

            {activePanel === 'details' && (
              <div className="card-detail-layout">
                <div className="card-modal-body card-detail-main">
                  <div className="card-detail-title-row">
                    <button
                      type="button"
                      className={`card-detail-check ${completed ? 'is-complete' : ''}`}
                      onClick={toggleCompletion}
                      aria-label={completed ? 'Đánh dấu thẻ chưa hoàn thành' : 'Đánh dấu thẻ hoàn thành'}
                      aria-pressed={completed}
                    />
                    <input
                      id="card-title"
                      className="card-detail-title-input"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      aria-label="Tiêu đề thẻ"
                      autoFocus
                    />
                  </div>

                  <div className="card-detail-shortcuts">
                    <div className="card-popover-anchor">
                      <button
                        type="button"
                        aria-expanded={activePopover === 'labels'}
                        onClick={() => openPopover('labels')}
                      >
                        ◇ Nhãn
                      </button>
                      {activePopover === 'labels' && (
                        <div className="card-editor-popover card-label-popover">
                          <header className="card-editor-popover-header">
                            <h3>Nhãn</h3>
                            <button type="button" onClick={cancelPopoverChanges} aria-label="Đóng nhãn">
                              ×
                            </button>
                          </header>
                          <input
                            className="card-modal-input card-label-search"
                            value={labelSearch}
                            onChange={(event) => setLabelSearch(event.target.value)}
                            placeholder="Tìm nhãn..."
                            aria-label="Tìm nhãn"
                          />
                          <span className="card-modal-label">Nhãn</span>
                          <div className="card-label-list">
                            {labelOptions
                              .filter((option) => option.name.toLowerCase().includes(labelSearch.toLowerCase()))
                              .map((option) => {
                                const selected = labels.find((label) => label.id === option.id);
                                const color = selected?.color || option.color;

                                return (
                                  <div className="card-label-row" key={option.id}>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(selected)}
                                      onChange={() => toggleLabel(option)}
                                      aria-label={`Chọn nhãn ${option.name}`}
                                    />
                                    <span
                                      className="card-label-swatch"
                                      style={{ backgroundColor: color }}
                                      aria-label={option.name}
                                      title={option.name}
                                    />
                                    <button
                                      type="button"
                                      className="card-label-edit"
                                      onClick={() => setEditingLabelId(
                                        editingLabelId === option.id ? null : option.id
                                      )}
                                      aria-label={`Đổi màu nhãn ${option.name}`}
                                      title="Đổi màu"
                                    >
                                      ✎
                                    </button>
                                    {editingLabelId === option.id && (
                                      <input
                                        type="color"
                                        className="card-label-color-input"
                                        value={color}
                                        onChange={(event) => updateLabelColor(option, event.target.value)}
                                        aria-label={`Màu nhãn ${option.name}`}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                          <footer className="card-popover-footer">
                            <button type="button" className="card-cancel-button" onClick={cancelPopoverChanges}>
                              Hủy
                            </button>
                            <button type="button" className="card-save-button" onClick={savePopoverChanges}>
                              Lưu
                            </button>
                          </footer>
                        </div>
                      )}
                    </div>
                    <div className="card-popover-anchor">
                      <button
                        type="button"
                        aria-expanded={activePopover === 'date'}
                        onClick={() => openPopover('date')}
                      >
                        ◷ Ngày
                      </button>
                      {activePopover === 'date' && (
                        <div className="card-editor-popover card-date-popover">
                          <header className="card-editor-popover-header">
                            <h3>Ngày</h3>
                            <button type="button" onClick={cancelPopoverChanges} aria-label="Đóng ngày">
                              ×
                            </button>
                          </header>
                          <CardDateEditor {...dateEditorProps} />
                          <footer className="card-popover-footer card-date-popover-footer">
                            <button type="button" className="card-date-remove" onClick={removeDate}>
                              Gỡ bỏ
                            </button>
                            <button type="button" className="card-save-button" onClick={savePopoverChanges}>
                              Lưu
                            </button>
                          </footer>
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="card-modal-label" htmlFor="card-description">
                    Mô tả
                  </label>
                  <textarea
                    id="card-description"
                    className="card-modal-input card-description-input"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Thêm mô tả chi tiết hơn..."
                    rows={4}
                  />

                  <footer className="card-modal-footer">
                    <button type="button" className="card-delete-button" onClick={onDelete}>
                      Xóa thẻ
                    </button>
                    <div className="card-modal-footer-right">
                      <button type="button" className="card-cancel-button" onClick={onClose}>
                        Hủy
                      </button>
                      <button type="button" className="card-save-button" onClick={saveChanges}>
                        Lưu
                      </button>
                    </div>
                  </footer>
                </div>

                <aside className="card-activity-panel">
                  <h3><span aria-hidden="true">▤</span> Nhận xét và hoạt động</h3>
                  <form className="card-comment-form" onSubmit={handleCommentSubmit}>
                    <input
                      type="text"
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      placeholder="Viết bình luận..."
                      aria-label="Viết bình luận"
                    />
                    <button type="submit" disabled={!commentDraft.trim()}>
                      Gửi
                    </button>
                  </form>
                  <div className="card-comment-list" aria-live="polite">
                    {comments.length === 0 ? (
                      <p className="card-comment-empty">Chưa có nhận xét.</p>
                    ) : (
                      comments.map((comment, index) => {
                        const commentText = typeof comment === 'string' ? comment : comment.text;
                        const createdAt = typeof comment === 'string' ? null : comment.createdAt;

                        return (
                          <article className="card-comment" key={comment.id || `${index}-${commentText}`}>
                            <span className="card-comment-avatar" aria-hidden="true">T</span>
                            <div className="card-comment-content">
                              <strong>Bạn</strong>
                              <p>{commentText}</p>
                              {createdAt && (
                                <time dateTime={createdAt}>
                                  {new Date(createdAt).toLocaleString('vi-VN')}
                                </time>
                              )}
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </aside>
              </div>
            )}

            {activePanel === 'labels' && (
              <div className="card-modal-body">
                <input
                  className="card-modal-input card-label-search"
                  value={labelSearch}
                  onChange={(event) => setLabelSearch(event.target.value)}
                  placeholder="Tìm nhãn..."
                  aria-label="Tìm nhãn"
                  autoFocus
                />
                <span className="card-modal-label">Nhãn</span>
                <div className="card-label-list">
                  {labelOptions
                    .filter((option) => option.name.toLowerCase().includes(labelSearch.toLowerCase()))
                    .map((option) => {
                      const selected = labels.find((label) => label.id === option.id);
                      const color = selected?.color || option.color;

                      return (
                        <div className="card-label-row" key={option.id}>
                          <input
                            type="checkbox"
                            checked={Boolean(selected)}
                            onChange={() => toggleLabel(option)}
                            aria-label={`Chọn nhãn ${option.name}`}
                          />
                          <span
                            className="card-label-swatch"
                            style={{ backgroundColor: color }}
                            aria-label={option.name}
                            title={option.name}
                          />
                          <button
                            type="button"
                            className="card-label-edit"
                            onClick={() => setEditingLabelId(
                              editingLabelId === option.id ? null : option.id
                            )}
                            aria-label={`Đổi màu nhãn ${option.name}`}
                            title="Đổi màu"
                          >
                            ✎
                          </button>
                          {editingLabelId === option.id && (
                            <input
                              type="color"
                              className="card-label-color-input"
                              value={color}
                              onChange={(event) => updateLabelColor(option, event.target.value)}
                              aria-label={`Màu nhãn ${option.name}`}
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
                <footer className="card-modal-footer">
                  <button type="button" className="card-cancel-button" onClick={onClose}>
                    Hủy
                  </button>
                  <button type="button" className="card-save-button" onClick={saveChanges}>
                    Lưu
                  </button>
                </footer>
              </div>
            )}

            {activePanel === 'date' && (
              <div className="card-modal-body card-date-panel">
                <CardDateEditor {...dateEditorProps} />
                <footer className="card-modal-footer">
                  <button type="button" className="card-date-remove" onClick={removeDate}>
                    Gỡ bỏ
                  </button>
                  <button type="button" className="card-save-button" onClick={saveChanges}>
                    Lưu
                  </button>
                </footer>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
