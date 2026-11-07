import { useState } from 'react';
import { CommentIcon, DescriptionIcon } from './CardIcons';
import '../styles/Card.css';

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

const formatShortDateVi = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const currentYear = new Date().getFullYear();
  const base = `${Number(day)} thg ${Number(month)}`;
  return Number(year) !== currentYear ? `${base}, ${year}` : base;
};

const getDueStatus = ({ dueDate, dueTime, dueEnabled, completed }) => {
  if (!dueEnabled || !dueDate) return null;
  if (completed) {
    return { label: 'Hoàn tất', className: 'is-complete' };
  }
  const target = new Date(`${dueDate}T${dueTime || '23:59'}:00`);
  const diffMs = target.getTime() - Date.now();
  if (diffMs < 0) {
    return { label: 'Quá hạn', className: 'is-overdue' };
  }
  if (diffMs <= 48 * 60 * 60 * 1000) {
    return { label: 'Sắp hết hạn', className: 'is-due-soon' };
  }
  return null;
};

const formatCardDateSummary = ({
  startDate,
  startTime,
  startEnabled,
  dueDate,
  dueTime,
  dueEnabled,
}) => {
  const hasStart = startEnabled && Boolean(startDate);
  const hasDue = dueEnabled && Boolean(dueDate);
  if (hasStart && hasDue) {
    return `${formatShortDateVi(startDate)} - ${dueTime || '17:00'} ${formatShortDateVi(dueDate)}`;
  }
  if (hasDue) {
    return `${dueTime || '17:00'} ${formatShortDateVi(dueDate)}`;
  }
  if (hasStart) {
    return `Bắt đầu: ${startTime || '09:00'} ${formatShortDateVi(startDate)}`;
  }
  return '';
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

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Không bao giờ' },
  { value: 'daily', label: 'Hằng ngày' },
  { value: 'weekly', label: 'Hằng tuần' },
  { value: 'monthly', label: 'Hằng tháng' },
  { value: 'yearly', label: 'Hằng năm' },
];

const REMINDER_OPTIONS = [
  { value: 'none', label: 'Không nhắc' },
  { value: 'at-time', label: 'Đúng thời điểm đến hạn' },
  { value: '5-minutes', label: '5 phút trước' },
  { value: '1-hour', label: '1 giờ trước' },
  { value: '1-day', label: '1 ngày trước' },
  { value: '2-days', label: '2 ngày trước' },
  { value: '1-week', label: '1 tuần trước' },
];

function DropdownChevron() {
  return (
    <span className="card-move-select-arrow" aria-hidden="true">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  );
}

function OpenCardIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="7" y1="15" x2="13" y2="15" />
      <circle cx="17" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}

function LabelTagIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function MoveArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}

function CoverImageIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <polyline points="21 15 16 10 5 20" />
    </svg>
  );
}

const readImageFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid image file'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1000;
        const maxHeight = 700;
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(String(reader.result || ''));
      img.src = String(reader.result || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const COVER_COLORS = [
  { id: 'green', color: '#4bce97', borderColor: '#22a06b', label: 'Xanh lá' },
  { id: 'yellow', color: '#f5cd47', borderColor: '#d9b51c', label: 'Vàng' },
  { id: 'orange', color: '#fea362', borderColor: '#e56910', label: 'Cam' },
  { id: 'red', color: '#f87168', borderColor: '#c9372c', label: 'Đỏ' },
  { id: 'purple', color: '#c97cf4', borderColor: '#8f7ee7', label: 'Tím' },
  { id: 'blue', color: '#579dff', borderColor: '#1d7afc', label: 'Xanh dương' },
  { id: 'sky', color: '#6cc3e0', borderColor: '#2898bd', label: 'Xanh da trời' },
  { id: 'lime', color: '#94c748', borderColor: '#6a9a23', label: 'Xanh nõn chuối' },
  { id: 'pink', color: '#e774bb', borderColor: '#ae4787', label: 'Hồng' },
  { id: 'gray', color: '#8590a2', borderColor: '#626f86', label: 'Xám' },
];

const isColorCover = (value) =>
  Boolean(value && (value.startsWith('#') || value.startsWith('rgb')));

function CardCoverPopover({ coverImage, onUploadCover, onRemoveCover, onClose }) {
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      if (dataUrl) {
        onUploadCover(dataUrl);
      }
    } catch {
      // Ignore invalid image selection
    }
    event.target.value = '';
  };

  const handleDropImage = async (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      if (dataUrl) {
        onUploadCover(dataUrl);
      }
    } catch {
      // Ignore invalid drop
    }
  };

  return (
    <div
      className="card-cover-popover"
      role="dialog"
      aria-label="Ảnh bìa"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDropImage}
    >
      <header className="card-move-popover-header">
        <h3>Bìa</h3>
        <button type="button" onClick={onClose} aria-label="Đóng ảnh bìa">
          ×
        </button>
      </header>

      <div className="card-cover-popover-body">
        <span className="card-move-subtitle">Màu</span>
        <div className="card-cover-color-grid">
          {COVER_COLORS.map((item) => {
            const isSelected =
              String(coverImage || '').toLowerCase() === item.color.toLowerCase();
            return (
              <button
                key={item.id}
                type="button"
                className={`card-cover-color-swatch ${isSelected ? 'is-selected' : ''}`}
                style={{
                  backgroundColor: item.color,
                  borderColor: item.borderColor,
                }}
                aria-label={`Màu bìa ${item.label}`}
                title={item.label}
                onClick={() => {
                  if (isSelected) {
                    onRemoveCover();
                  } else {
                    onUploadCover(item.color);
                  }
                }}
              />
            );
          })}
        </div>

        {coverImage && (
          <button
            type="button"
            className="card-cover-action-btn is-remove"
            onClick={onRemoveCover}
          >
            Xoá ảnh bìa
          </button>
        )}

        <span className="card-move-subtitle">Các tệp đính kèm</span>
        <label className="card-cover-upload-btn">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            hidden
          />
          Tải lên ảnh bìa
        </label>
        <p className="card-cover-upload-hint">
          Mẹo: Kéo ảnh vào thẻ để tải ảnh đó lên.
        </p>
      </div>
    </div>
  );
}

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
  const [openDateSelect, setOpenDateSelect] = useState(null);
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
    if (calendarTarget === 'start' || (!startEnabled && !dueEnabled)) {
      setStartDate(value);
      setStartEnabled(true);
      setCalendarTarget('due');
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
      setCalendarTarget(enabled ? 'start' : 'due');
    } else {
      setDueEnabled(enabled);
      if (enabled && !dueDate) setDueDate(startDate || today);
      if (!enabled) setDueDate('');
      setCalendarTarget('due');
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
          <div className={`card-date-field-controls ${!startEnabled ? 'is-inactive' : ''}`.trim()}>
            <input
              type="date"
              className="card-modal-input"
              value={startDate}
              onFocus={() => {
                setCalendarTarget('start');
                if (!startEnabled) toggleDate('start', true);
              }}
              onClick={() => {
                setCalendarTarget('start');
                if (!startEnabled) toggleDate('start', true);
              }}
              onChange={(event) => {
                const nextDate = event.target.value;
                setCalendarTarget('start');
                setStartDate(nextDate);
                setStartEnabled(Boolean(nextDate));
                if (nextDate) {
                  setCalendarMonth(getMonthForDate(nextDate));
                }
              }}
              aria-label="Ngày bắt đầu"
            />
            <input
              type="time"
              className="card-modal-input card-date-time"
              value={startTime}
              onFocus={() => {
                setCalendarTarget('start');
                if (!startEnabled) toggleDate('start', true);
              }}
              onClick={() => {
                if (!startEnabled) toggleDate('start', true);
              }}
              onChange={(event) => {
                if (!startEnabled) toggleDate('start', true);
                setStartTime(event.target.value);
              }}
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
          <div className={`card-date-field-controls ${!dueEnabled ? 'is-inactive' : ''}`.trim()}>
            <input
              type="date"
              className="card-modal-input"
              value={dueDate}
              onFocus={() => {
                setCalendarTarget('due');
                if (!dueEnabled) toggleDate('due', true);
              }}
              onClick={() => {
                setCalendarTarget('due');
                if (!dueEnabled) toggleDate('due', true);
              }}
              onChange={(event) => {
                const nextDate = event.target.value;
                setCalendarTarget('due');
                setDueDate(nextDate);
                setDueEnabled(Boolean(nextDate));
                if (nextDate) {
                  setCalendarMonth(getMonthForDate(nextDate));
                }
              }}
              aria-label="Ngày hết hạn"
            />
            <input
              type="time"
              className="card-modal-input card-date-time"
              value={dueTime}
              onFocus={() => {
                setCalendarTarget('due');
                if (!dueEnabled) toggleDate('due', true);
              }}
              onClick={() => {
                if (!dueEnabled) toggleDate('due', true);
              }}
              onChange={(event) => {
                if (!dueEnabled) toggleDate('due', true);
                setDueTime(event.target.value);
              }}
              aria-label="Giờ hết hạn"
            />
          </div>
        </div>

        <span className="card-date-select-label">Định kỳ</span>
        <div className="card-move-dropdown-wrapper">
          <button
            type="button"
            className={`card-move-select-trigger ${openDateSelect === 'recurrence' ? 'is-open' : ''}`}
            onClick={() =>
              setOpenDateSelect((cur) => (cur === 'recurrence' ? null : 'recurrence'))
            }
          >
            <span>
              {RECURRENCE_OPTIONS.find((opt) => opt.value === recurrence)?.label || 'Không bao giờ'}
            </span>
            <DropdownChevron />
          </button>
          {openDateSelect === 'recurrence' && (
            <div className="card-move-select-menu is-drop-up" role="listbox">
              {RECURRENCE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`card-move-select-option ${recurrence === opt.value ? 'is-selected' : ''}`}
                  onClick={() => {
                    setRecurrence(opt.value);
                    setOpenDateSelect(null);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="card-date-select-label">Thiết lập Nhắc nhở</span>
        <div className="card-move-dropdown-wrapper">
          <button
            type="button"
            className={`card-move-select-trigger ${openDateSelect === 'reminder' ? 'is-open' : ''}`}
            onClick={() =>
              setOpenDateSelect((cur) => (cur === 'reminder' ? null : 'reminder'))
            }
          >
            <span>
              {REMINDER_OPTIONS.find((opt) => opt.value === reminder)?.label || '1 ngày trước'}
            </span>
            <DropdownChevron />
          </button>
          {openDateSelect === 'reminder' && (
            <div className="card-move-select-menu is-drop-up" role="listbox">
              {REMINDER_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`card-move-select-option ${reminder === opt.value ? 'is-selected' : ''}`}
                  onClick={() => {
                    setReminder(opt.value);
                    setOpenDateSelect(null);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
  columns = [],
  currentColumnId = null,
  initialView = 'details',
  anchorRect = null,
  onClose,
  onSave,
  onUpdateCard,
  onMoveCard,
  onDelete,
}) {
  const [activePanel, setActivePanel] = useState(initialView);
  const [activePopover, setActivePopover] = useState(null);
  const [title, setTitle] = useState(card.title || '');
  const [completed, setCompleted] = useState(Boolean(card.completed));
  const [description, setDescription] = useState(card.description || '');
  const [coverImage, setCoverImage] = useState(card.coverImage || '');
  const [isQuickCoverOpen, setIsQuickCoverOpen] = useState(false);
  const [startDate, setStartDate] = useState(card.startDate || '');
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [startEnabled, setStartEnabled] = useState(card.startDateEnabled ?? Boolean(card.startDate));
  const [dueEnabled, setDueEnabled] = useState(card.dueDateEnabled ?? Boolean(card.dueDate));
  const [startTime, setStartTime] = useState(card.startTime || '09:00');
  const [dueTime, setDueTime] = useState(card.dueTime || '17:00');
  const [recurrence, setRecurrence] = useState(card.recurrence || 'none');
  const [reminder, setReminder] = useState(card.reminder || '1-day');
  const [calendarMonth, setCalendarMonth] = useState(() => getMonthForDate(card.dueDate || card.startDate));
  const [calendarTarget, setCalendarTarget] = useState(() => (card.startDate ? 'due' : 'start'));
  const [labels, setLabels] = useState(Array.isArray(card.labels) ? card.labels : []);
  const [popoverSnapshot, setPopoverSnapshot] = useState(null);
  const [comments, setComments] = useState(Array.isArray(card.comments) ? card.comments : []);
  const [commentDraft, setCommentDraft] = useState('');
  const [openCommentMenuKey, setOpenCommentMenuKey] = useState(null);
  const [editingCommentKey, setEditingCommentKey] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [labelSearch, setLabelSearch] = useState('');
  const [editingLabelId, setEditingLabelId] = useState(null);

  const currentColumnIndex = columns.findIndex(
    (col) => String(col.id) === String(currentColumnId)
  );
  const initialColumnPosition = currentColumnIndex >= 0 ? currentColumnIndex + 1 : 1;

  const [isQuickMoveOpen, setIsQuickMoveOpen] = useState(false);
  const [openMoveDropdown, setOpenMoveDropdown] = useState(null);
  const [selectedBoardName, setSelectedBoardName] = useState('Bảng SBA');
  const [moveTargetColumnId, setMoveTargetColumnId] = useState(
    () => String(currentColumnId ?? columns[0]?.id ?? '')
  );
  const [moveTargetPosition, setMoveTargetPosition] = useState(() => initialColumnPosition);

  const targetColumnObj =
    columns.find((col) => String(col.id) === String(moveTargetColumnId)) || columns[0];
  const totalBoardColumns = Math.max(1, columns.length);

  const handleMoveColumnSelect = (nextColId) => {
    const colIdx = columns.findIndex((col) => String(col.id) === String(nextColId));
    setMoveTargetColumnId(String(nextColId));
    if (colIdx >= 0) {
      setMoveTargetPosition(colIdx + 1);
    }
    setOpenMoveDropdown(null);
  };

  const handleMovePositionSelect = (posNumber) => {
    const pos = Number(posNumber);
    setMoveTargetPosition(pos);
    const targetCol = columns[pos - 1];
    if (targetCol) {
      setMoveTargetColumnId(String(targetCol.id));
    }
    setOpenMoveDropdown(null);
  };

  const handleExecuteMove = () => {
    const matchedCol =
      columns.find((col) => String(col.id) === String(moveTargetColumnId)) ||
      columns[moveTargetPosition - 1];
    const resolvedColId = matchedCol ? matchedCol.id : moveTargetColumnId;
    onMoveCard?.(resolvedColId, null);
  };

  const handleUploadCover = (dataUrl) => {
    setCoverImage(dataUrl);
    onUpdateCard?.(getUpdatedCard({ coverImage: dataUrl }));
  };

  const handleRemoveCover = () => {
    setCoverImage('');
    onUpdateCard?.(getUpdatedCard({ coverImage: '' }));
  };

  const getUpdatedCard = (overrides = {}) => ({
    ...card,
    title: title.trim(),
    completed,
    description: description.trim(),
    coverImage,
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
    onUpdateCard?.(getUpdatedCard({ completed: nextCompleted }));
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
    if (popover === 'date') {
      setCalendarTarget(!startEnabled ? 'start' : 'due');
    }
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
    onUpdateCard?.(getUpdatedCard({ comments: updatedComments }));
  };

  const handleDeleteComment = (indexToDelete, commentId) => {
    const updatedComments = comments.filter((comment, idx) =>
      commentId && comment?.id ? comment.id !== commentId : idx !== indexToDelete
    );
    setComments(updatedComments);
    setOpenCommentMenuKey(null);
    if (editingCommentKey !== null) {
      setEditingCommentKey(null);
      setEditingCommentText('');
    }
    onUpdateCard?.(getUpdatedCard({ comments: updatedComments }));
  };

  const handleStartEditComment = (commentKey, currentText) => {
    setEditingCommentKey(commentKey);
    setEditingCommentText(currentText);
    setOpenCommentMenuKey(null);
  };

  const handleCancelEditComment = () => {
    setEditingCommentKey(null);
    setEditingCommentText('');
  };

  const handleSaveEditComment = (indexToEdit, commentId) => {
    const trimmed = editingCommentText.trim();
    if (!trimmed) return;

    const updatedComments = comments.map((comment, idx) => {
      const isMatch = commentId && comment?.id ? comment.id === commentId : idx === indexToEdit;
      if (!isMatch) return comment;
      if (typeof comment === 'string') {
        return {
          id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          text: trimmed,
          createdAt: new Date().toISOString(),
        };
      }
      return {
        ...comment,
        text: trimmed,
      };
    });

    setComments(updatedComments);
    setEditingCommentKey(null);
    setEditingCommentText('');
    onUpdateCard?.(getUpdatedCard({ comments: updatedComments }));
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

  const isQuickAnchored = activePanel === 'quick' && Boolean(anchorRect);
  const quickCardWidth = anchorRect?.width ? Math.round(anchorRect.width) : 252;
  const quickModalStyle = isQuickAnchored
    ? {
        position: 'fixed',
        top: `${Math.max(12, Math.min(anchorRect.top, window.innerHeight - 250))}px`,
        left: `${Math.max(12, Math.min(anchorRect.left, window.innerWidth - (quickCardWidth + 190)))}px`,
        margin: 0,
      }
    : undefined;

  return (
    <div
      className={`card-modal-backdrop ${isQuickAnchored ? 'is-quick-anchored' : ''}`}
      onMouseDown={onClose}
    >
      <section
        className={`card-modal ${activePanel === 'quick' ? 'card-modal-quick' : ''} ${activePanel === 'details' ? 'card-modal-details' : ''} ${activePanel === 'date' ? 'card-modal-date' : ''}`}
        style={quickModalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {activePanel === 'quick' ? (
          <div className="card-quick-layout">
            <div className="card-quick-editor" style={{ width: `${quickCardWidth}px` }}>
              <div className={`card-quick-surface ${coverImage ? 'has-cover' : ''}`}>
                {coverImage && (
                  isColorCover(coverImage) ? (
                    <div
                      className="card-quick-cover is-color"
                      style={{ backgroundColor: coverImage }}
                    />
                  ) : (
                    <div className="card-quick-cover">
                      <img src={coverImage} alt="" draggable={false} />
                    </div>
                  )
                )}
                <div className="card-quick-body">
                  {labels.length > 0 && (
                    <div className="card-quick-labels">
                      {labels.map((label) => (
                        <span
                          key={label.id}
                          className="card-quick-label-pill"
                          style={{ backgroundColor: label.color }}
                          title={label.name}
                        />
                      ))}
                    </div>
                  )}
                  <textarea
                    className="card-quick-title-input"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    onFocus={(event) => event.target.select()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        saveChanges();
                      }
                    }}
                    aria-label="Tiêu đề thẻ"
                    autoFocus
                    rows={3}
                  />
                  {(description || comments.length > 0) && (
                    <div className="card-quick-badges">
                      {description && (
                        <span className="card-badge-item" title="Thẻ đã có mô tả">
                          <DescriptionIcon size={14} />
                        </span>
                      )}
                      {comments.length > 0 && (
                        <span className="card-badge-item" title="Nhận xét">
                          <CommentIcon size={14} /> {comments.length}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button type="button" className="card-save-button" onClick={saveChanges}>
                Lưu
              </button>
            </div>
            <nav className="card-quick-actions" aria-label="Thao tác với thẻ">
              <button type="button" onClick={() => setActivePanel('details')}>
                <OpenCardIcon /> Mở thẻ
              </button>
              <button type="button" onClick={() => {
                setActivePopover(null);
                setIsQuickMoveOpen(false);
                setIsQuickCoverOpen(false);
                setActivePanel('labels');
              }}>
                <LabelTagIcon /> Chỉnh sửa nhãn
              </button>
              <div className="card-quick-move-anchor">
                <button
                  type="button"
                  className={isQuickCoverOpen ? 'is-active-move' : ''}
                  aria-expanded={isQuickCoverOpen}
                  onClick={() => {
                    setIsQuickMoveOpen(false);
                    setIsQuickCoverOpen((open) => !open);
                  }}
                >
                  <CoverImageIcon /> Thay đổi bìa
                </button>
                {isQuickCoverOpen && (
                  <CardCoverPopover
                    coverImage={coverImage}
                    onUploadCover={handleUploadCover}
                    onRemoveCover={handleRemoveCover}
                    onClose={() => setIsQuickCoverOpen(false)}
                  />
                )}
              </div>
              <button type="button" onClick={() => {
                setActivePopover(null);
                setIsQuickMoveOpen(false);
                setIsQuickCoverOpen(false);
                setActivePanel('date');
              }}>
                <ClockIcon /> Chỉnh sửa ngày
              </button>
              <div className="card-quick-move-anchor">
                <button
                  type="button"
                  className={isQuickMoveOpen ? 'is-active-move' : ''}
                  aria-expanded={isQuickMoveOpen}
                  onClick={() => {
                    setIsQuickCoverOpen(false);
                    setIsQuickMoveOpen((open) => !open);
                  }}
                >
                  <MoveArrowIcon /> Di chuyển
                </button>
                {isQuickMoveOpen && (
                  <div className="card-move-popover" role="dialog" aria-label="Di chuyển thẻ">
                    <header className="card-move-popover-header">
                      <h3>Di chuyển thẻ</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMoveDropdown(null);
                          setIsQuickMoveOpen(false);
                        }}
                        aria-label="Đóng di chuyển thẻ"
                      >
                        ×
                      </button>
                    </header>

                    <div className="card-move-body">
                      <span className="card-move-subtitle">Chọn đích đến</span>

                      <span className="card-move-field-label">Bảng</span>
                      <div className="card-move-dropdown-wrapper">
                        <button
                          type="button"
                          className={`card-move-select-trigger ${openMoveDropdown === 'board' ? 'is-open' : ''}`}
                          onClick={() =>
                            setOpenMoveDropdown((cur) => (cur === 'board' ? null : 'board'))
                          }
                        >
                          <span>{selectedBoardName}</span>
                          <DropdownChevron />
                        </button>
                        {openMoveDropdown === 'board' && (
                          <div className="card-move-select-menu" role="listbox">
                            <button
                              type="button"
                              className="card-move-select-option is-selected"
                              onClick={() => {
                                setSelectedBoardName('Bảng SBA');
                                setOpenMoveDropdown(null);
                              }}
                            >
                              Bảng SBA
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="card-move-row">
                        <div className="card-move-col-list">
                          <span className="card-move-field-label">Danh sách</span>
                          <div className="card-move-dropdown-wrapper">
                            <button
                              type="button"
                              className={`card-move-select-trigger ${openMoveDropdown === 'list' ? 'is-open' : ''}`}
                              onClick={() =>
                                setOpenMoveDropdown((cur) => (cur === 'list' ? null : 'list'))
                              }
                            >
                              <span>{targetColumnObj?.title || ''}</span>
                              <DropdownChevron />
                            </button>
                            {openMoveDropdown === 'list' && (
                              <div className="card-move-select-menu" role="listbox">
                                {columns.map((col) => {
                                  const isSelected =
                                    String(col.id) === String(moveTargetColumnId);
                                  return (
                                    <button
                                      type="button"
                                      key={col.id}
                                      className={`card-move-select-option ${isSelected ? 'is-selected' : ''}`}
                                      onClick={() => handleMoveColumnSelect(col.id)}
                                    >
                                      {col.title}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="card-move-col-pos">
                          <span className="card-move-field-label">Vị trí</span>
                          <div className="card-move-dropdown-wrapper">
                            <button
                              type="button"
                              className={`card-move-select-trigger ${openMoveDropdown === 'pos' ? 'is-open' : ''}`}
                              onClick={() =>
                                setOpenMoveDropdown((cur) => (cur === 'pos' ? null : 'pos'))
                              }
                            >
                              <span>{moveTargetPosition}</span>
                              <DropdownChevron />
                            </button>
                            {openMoveDropdown === 'pos' && (
                              <div className="card-move-select-menu" role="listbox">
                                {Array.from({ length: totalBoardColumns }, (_, idx) => idx + 1).map(
                                  (pos) => {
                                    const isSelected = pos === Number(moveTargetPosition);
                                    return (
                                      <button
                                        type="button"
                                        key={pos}
                                        className={`card-move-select-option ${isSelected ? 'is-selected' : ''}`}
                                        onClick={() => handleMovePositionSelect(pos)}
                                      >
                                        {pos}
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="card-move-submit-btn"
                        onClick={handleExecuteMove}
                      >
                        Di chuyển
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button type="button" onClick={onDelete}>
                <TrashIcon /> Xóa thẻ
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
                  {coverImage && (
                    <div
                      className={`card-detail-cover-banner ${isColorCover(coverImage) ? 'is-color' : ''}`}
                      style={isColorCover(coverImage) ? { backgroundColor: coverImage } : undefined}
                    >
                      {!isColorCover(coverImage) && <img src={coverImage} alt="Ảnh bìa thẻ" />}
                      <button
                        type="button"
                        className="card-detail-cover-remove"
                        onClick={handleRemoveCover}
                      >
                        <TrashIcon /> Xoá ảnh bìa
                      </button>
                    </div>
                  )}
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
                        <LabelTagIcon /> Nhãn
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
                                      onClick={() => toggleLabel(option)}
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
                        <ClockIcon /> Ngày
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
                    <div className="card-popover-anchor">
                      <button
                        type="button"
                        aria-expanded={activePopover === 'cover'}
                        onClick={() => openPopover('cover')}
                      >
                        <CoverImageIcon /> Ảnh bìa
                      </button>
                      {activePopover === 'cover' && (
                        <CardCoverPopover
                          coverImage={coverImage}
                          onUploadCover={handleUploadCover}
                          onRemoveCover={handleRemoveCover}
                          onClose={cancelPopoverChanges}
                        />
                      )}
                    </div>
                  </div>

                  {(labels.length > 0 || (startEnabled && startDate) || (dueEnabled && dueDate)) && (
                    <div className="card-detail-meta">
                      {labels.length > 0 && (
                        <div className="card-detail-meta-group">
                          <span className="card-detail-meta-title">Nhãn</span>
                          <div className="card-detail-labels-row">
                            {labels.map((label) => (
                              <button
                                type="button"
                                key={label.id}
                                className="card-detail-label-pill"
                                style={{ backgroundColor: label.color }}
                                title={label.name}
                                aria-label={`Nhãn ${label.name}`}
                                onClick={() => openPopover('labels')}
                              />
                            ))}
                            <button
                              type="button"
                              className="card-detail-label-add"
                              aria-label="Thêm nhãn"
                              onClick={() => openPopover('labels')}
                            >
                              ＋
                            </button>
                          </div>
                        </div>
                      )}

                      {((startEnabled && startDate) || (dueEnabled && dueDate)) && (() => {
                        const dueStatus = getDueStatus({
                          dueDate,
                          dueTime,
                          dueEnabled,
                          completed,
                        });
                        const summaryText = formatCardDateSummary({
                          startDate,
                          startTime,
                          startEnabled,
                          dueDate,
                          dueTime,
                          dueEnabled,
                        });

                        return (
                          <div className="card-detail-meta-group">
                            <span className="card-detail-meta-title">Ngày</span>
                            <button
                              type="button"
                              className="card-detail-date-badge"
                              onClick={() => openPopover('date')}
                            >
                              <span className="card-detail-date-text">{summaryText}</span>
                              {dueStatus && (
                                <span className={`card-due-status ${dueStatus.className}`}>
                                  {dueStatus.label}
                                </span>
                              )}
                              <span className="card-detail-date-caret" aria-hidden="true">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}

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
                      <TrashIcon /> Xóa thẻ
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
                  <h3><CommentIcon size={18} /> Nhận xét và hoạt động</h3>
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
                        const commentKey = comment.id || `${index}-${commentText}`;
                        const isMenuOpen = openCommentMenuKey === commentKey;
                        const isEditing = editingCommentKey === commentKey;

                        return (
                          <article className="card-comment" key={commentKey}>
                            <span className="card-comment-avatar" aria-hidden="true">T</span>
                            <div className="card-comment-content">
                              <div className="card-comment-header">
                                <strong>Bạn</strong>
                                <div className="card-comment-menu-wrapper">
                                  <button
                                    type="button"
                                    className="card-comment-menu-button"
                                    onClick={() =>
                                      setOpenCommentMenuKey((current) =>
                                        current === commentKey ? null : commentKey
                                      )
                                    }
                                    aria-label="Tùy chọn nhận xét"
                                    aria-expanded={isMenuOpen}
                                  >
                                    •••
                                  </button>
                                  {isMenuOpen && (
                                    <div className="card-comment-dropdown" role="menu">
                                      <button
                                        type="button"
                                        role="menuitem"
                                        className="card-comment-dropdown-item"
                                        onClick={() => handleStartEditComment(commentKey, commentText)}
                                      >
                                        Sửa
                                      </button>
                                      <button
                                        type="button"
                                        role="menuitem"
                                        className="card-comment-dropdown-item is-danger"
                                        onClick={() => handleDeleteComment(index, comment.id)}
                                      >
                                        Xóa
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {isEditing ? (
                                <div className="card-comment-edit-box">
                                  <input
                                    type="text"
                                    className="card-modal-input card-comment-edit-input"
                                    value={editingCommentText}
                                    onChange={(event) => setEditingCommentText(event.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') {
                                        event.preventDefault();
                                        handleSaveEditComment(index, comment.id);
                                      } else if (event.key === 'Escape') {
                                        handleCancelEditComment();
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <div className="card-comment-edit-actions">
                                    <button
                                      type="button"
                                      className="card-save-button"
                                      onClick={() => handleSaveEditComment(index, comment.id)}
                                    >
                                      Lưu
                                    </button>
                                    <button
                                      type="button"
                                      className="card-cancel-button"
                                      onClick={handleCancelEditComment}
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p>{commentText}</p>
                                  {createdAt && (
                                    <time dateTime={createdAt}>
                                      {new Date(createdAt).toLocaleString('vi-VN')}
                                    </time>
                                  )}
                                </>
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
                            onClick={() => toggleLabel(option)}
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
