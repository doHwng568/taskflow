import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { CommentIcon, DescriptionIcon } from './CardIcons';
import cardApi from '../api/cardApi';
import workspaceService from '../../workspace/services/workspaceService';
import api from '../../../services/api';
import '../styles/Card.css';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateParts = (isoString) => {
  if (!isoString) return { date: '', time: '' };
  const str = String(isoString).trim();
  if (!str) return { date: '', time: '' };
  if (str.includes('T')) {
    const [d, t] = str.split('T');
    return { date: d, time: t ? t.substring(0, 5) : '' };
  }
  return { date: str, time: '' };
};

const getMonthForDate = (dateString) => {
  if (!dateString) return new Date();
  const cleanDate = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  const date = new Date(`${cleanDate}T00:00:00`);
  return isNaN(date.getTime())
    ? new Date()
    : new Date(date.getFullYear(), date.getMonth(), 1);
};

const getCurrentUsername = () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decoded = jwtDecode(token);
      return decoded.sub || 'Bạn';
    }
  } catch {}
  return 'Bạn';
};

const isCurrentUserPM = () => {
  const savedRole = localStorage.getItem('userRole');
  if (savedRole) {
    const normalized = savedRole.startsWith('ROLE_') ? savedRole.substring(5) : savedRole;
    if (normalized) return normalized.toUpperCase() === 'PM';
  }
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decoded = jwtDecode(token);
      let role = String(decoded.role || '');
      if (role.startsWith('ROLE_')) {
        role = role.substring(5);
      }
      return role.toUpperCase() === 'PM';
    }
  } catch {}
  return false;
};

const createNewCommentItem = (text) => ({
  id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  text,
  author: getCurrentUsername(),
  createdAt: new Date().toISOString(),
});

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return 'vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) {
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `Hôm qua lúc ${time}`;
  }
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatShortDateVi = (dateString) => {
  if (!dateString) return '';
  const cleanDate = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  const parts = cleanDate.split('-');
  if (parts.length < 3) return cleanDate;
  const [year, month, day] = parts;
  const currentYear = new Date().getFullYear();
  const base = `${Number(day)} thg ${Number(month)}`;
  return Number(year) !== currentYear ? `${base}, ${year}` : base;
};

const getDueStatus = ({ dueDate, dueTime, dueEnabled, completed }) => {
  if (!dueEnabled || !dueDate) return null;
  if (completed) {
    return { label: 'Hoàn tất', className: 'is-complete' };
  }
  const cleanDate = dueDate.includes('T') ? dueDate.split('T')[0] : dueDate;
  const cleanTime = dueTime ? (dueTime.length === 5 ? dueTime : dueTime.substring(0, 5)) : '23:59';
  const target = new Date(`${cleanDate}T${cleanTime}:00`);
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

function ArchiveIcon() {
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
      <rect x="2" y="4" width="20" height="5" rx="1" />
      <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
      <line x1="10" y1="13" x2="14" y2="13" />
    </svg>
  );
}

function MemberUserIcon() {
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
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const ROLE_CONFIG = {
  PM: { label: 'PM (Quản lý dự án)', shortLabel: 'PM', className: 'role-badge-pm' },
  LEADER: { label: 'Leader (Trưởng nhóm)', shortLabel: 'LEADER', className: 'role-badge-leader' },
  DEV: { label: 'Dev (Lập trình viên)', shortLabel: 'DEV', className: 'role-badge-dev' },
  TESTER: { label: 'Tester (Kiểm thử)', shortLabel: 'TESTER', className: 'role-badge-tester' },
  MEMBER: { label: 'Member (Thành viên)', shortLabel: 'MEMBER', className: 'role-badge-member' },
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getAvatarColor = (id = 0, name = '') => {
  const colors = ['#0c66e4', '#1f845a', '#e56910', '#6554c0', '#008da6', '#c9372c'];
  const hash = Number(id || 0) + (name ? name.charCodeAt(0) : 0);
  return colors[Math.abs(hash) % colors.length];
};

function CardMemberPopover({
  members = [],
  assigneeId,
  isPM,
  onSelectMember,
  onClose,
  search,
  onSearchChange,
}) {
  const filteredMembers = members.filter((m) => {
    const term = (search || '').toLowerCase();
    const fullName = (m.fullName || '').toLowerCase();
    const username = (m.username || '').toLowerCase();
    const role = (m.role || m.userRole || '').toLowerCase();
    return fullName.includes(term) || username.includes(term) || role.includes(term);
  });

  return (
    <div className="card-member-popover" role="dialog" aria-label="Thành viên">
      <header className="card-member-popover-header">
        <h3>Thành viên</h3>
        <button type="button" onClick={onClose} aria-label="Đóng bảng thành viên">
          ×
        </button>
      </header>

      <div className="card-member-body">
        <input
          type="text"
          className="card-member-search-input"
          placeholder="Tìm kiếm thành viên..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />

        {!isPM && (
          <div className="card-member-notice" role="alert">
            ⚠️ Chỉ PM (Quản lý dự án) mới có quyền giao nhiệm vụ cho thẻ.
          </div>
        )}

        <span className="card-member-subtitle">Thành viên ({filteredMembers.length})</span>
        <div className="card-member-list">
          {filteredMembers.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#626f86', margin: '8px 0' }}>
              Không tìm thấy thành viên phù hợp
            </p>
          ) : (
            filteredMembers.map((member) => {
              const isAssigned = String(assigneeId) === String(member.id);
              const roleKey = (member.role || member.userRole || 'MEMBER').toUpperCase();
              const roleInfo = ROLE_CONFIG[roleKey] || ROLE_CONFIG.MEMBER;
              const avatarColor = getAvatarColor(member.id, member.username);

              return (
                <button
                  type="button"
                  key={member.id}
                  disabled={!isPM}
                  className={`card-member-item ${isAssigned ? 'is-assigned' : ''}`}
                  onClick={() => onSelectMember(member)}
                  title={!isPM ? 'Chỉ PM mới có quyền giao nhiệm vụ' : (isAssigned ? 'Bấm để hủy giao nhiệm vụ' : 'Bấm để giao nhiệm vụ')}
                >
                  <div className="card-member-avatar" style={{ backgroundColor: avatarColor }}>
                    {getInitials(member.fullName || member.username)}
                  </div>
                  <div className="card-member-info">
                    <div className="card-member-name-row">
                      <span className="card-member-name">{member.fullName || member.username}</span>
                      <span className={`card-role-badge ${roleInfo.className}`}>
                        {roleInfo.shortLabel}
                      </span>
                    </div>
                    <span className="card-member-username">@{member.username}</span>
                  </div>
                  {isAssigned && <span className="card-member-check">✓</span>}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
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
  workspaceId = null,
  initialView = 'details',
  anchorRect = null,
  onClose,
  onSave,
  onUpdateCard,
  onMoveCard,
  onArchive,
  onDelete,
}) {
  const [activePanel, setActivePanel] = useState(initialView);
  const [activePopover, setActivePopover] = useState(null);
  const [title, setTitle] = useState(card.title || '');
  const [completed, setCompleted] = useState(Boolean(card.completed));
  const [description, setDescription] = useState(card.description || '');
  const [coverImage, setCoverImage] = useState(card.coverImage || '');
  const [isQuickCoverOpen, setIsQuickCoverOpen] = useState(false);
  const [isQuickMemberOpen, setIsQuickMemberOpen] = useState(false);
  const initialDue = useMemo(() => parseDateParts(card.dueDate), [card.dueDate]);
  const initialStart = useMemo(() => parseDateParts(card.startDate), [card.startDate]);

  const [startDate, setStartDate] = useState(() => initialStart.date);
  const [dueDate, setDueDate] = useState(() => initialDue.date);
  const [startEnabled, setStartEnabled] = useState(card.startDateEnabled ?? Boolean(card.startDate));
  const [dueEnabled, setDueEnabled] = useState(card.dueDateEnabled ?? Boolean(card.dueDate));
  const [startTime, setStartTime] = useState(() => initialStart.time || card.startTime || '09:00');
  const [dueTime, setDueTime] = useState(() => initialDue.time || card.dueTime || '17:00');
  const [recurrence, setRecurrence] = useState(card.recurrence || 'none');
  const [reminder, setReminder] = useState(card.reminder || '1-day');
  const [calendarMonth, setCalendarMonth] = useState(() => getMonthForDate(initialDue.date || initialStart.date));
  const [calendarTarget, setCalendarTarget] = useState(() => (card.startDate ? 'due' : 'start'));

  useEffect(() => {
    const dueParts = parseDateParts(card.dueDate);
    const startParts = parseDateParts(card.startDate);
    setDueDate(dueParts.date);
    setStartDate(startParts.date);
    if (dueParts.time) setDueTime(dueParts.time);
    if (startParts.time) setStartTime(startParts.time);
    setDueEnabled(card.dueDateEnabled ?? Boolean(card.dueDate));
    setStartEnabled(card.startDateEnabled ?? Boolean(card.startDate));
  }, [card.id, card.dueDate, card.startDate, card.dueDateEnabled, card.startDateEnabled]);
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

  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementError, setMovementError] = useState('');
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [activityTab, setActivityTab] = useState('all');
  const [moveComment, setMoveComment] = useState('');
  const [isMovingCard, setIsMovingCard] = useState(false);
  const commentListRef = useRef(null);
  const isPM = useMemo(() => isCurrentUserPM(), []);

  const [assigneeId, setAssigneeId] = useState(card.assigneeId || null);
  const [assigneeName, setAssigneeName] = useState(card.assigneeName || '');
  const [assigneeRole, setAssigneeRole] = useState(card.assigneeRole || '');
  const [assigneeUsername, setAssigneeUsername] = useState(card.assigneeUsername || '');
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        setLoadingMembers(true);
        let userList = [];
        try {
          const res = await api.get('/api/users');
          if (res?.data?.data && Array.isArray(res.data.data)) {
            userList = res.data.data;
          }
        } catch {
          if (workspaceId) {
            const wsMembers = await workspaceService.getMembers(workspaceId);
            if (Array.isArray(wsMembers)) {
              userList = wsMembers.map((m) => ({
                id: m.userId || m.id,
                username: m.username,
                fullName: m.fullName,
                email: m.email,
                role: m.userRole || 'MEMBER',
              }));
            }
          }
        }
        if (isMounted) {
          setMembers(userList);
        }
      } catch (err) {
        console.error('Failed to load members for card assignment:', err);
      } finally {
        if (isMounted) setLoadingMembers(false);
      }
    };
    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  const handleSelectMember = async (member) => {
    if (!isPM) return;
    const isCurrentlyAssigned = String(assigneeId) === String(member.id);
    const newAssigneeId = isCurrentlyAssigned ? null : member.id;
    const newAssigneeName = isCurrentlyAssigned ? '' : (member.fullName || member.username);
    const newAssigneeRole = isCurrentlyAssigned ? '' : (member.role || member.userRole || 'MEMBER');
    const newAssigneeUsername = isCurrentlyAssigned ? '' : member.username;

    setAssigneeId(newAssigneeId);
    setAssigneeName(newAssigneeName);
    setAssigneeRole(newAssigneeRole);
    setAssigneeUsername(newAssigneeUsername);

    const updated = getUpdatedCard({
      assigneeId: newAssigneeId ?? 0,
      assigneeName: newAssigneeName,
      assigneeRole: newAssigneeRole,
      assigneeUsername: newAssigneeUsername,
    });
    await onUpdateCard?.(updated);
    await reloadAllHistory();
  };

  const [isQuickMoveOpen, setIsQuickMoveOpen] = useState(false);
  const [openMoveDropdown, setOpenMoveDropdown] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(() => workspaceId ?? null);
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState('');
  const [availableColumns, setAvailableColumns] = useState(columns);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [moveTargetColumnId, setMoveTargetColumnId] = useState(
    () => String(currentColumnId ?? columns[0]?.id ?? '')
  );
  const [moveTargetPosition, setMoveTargetPosition] = useState(() => initialColumnPosition);

  const parseNumericId = (rawId) => {
    if (typeof rawId === 'number' && Number.isFinite(rawId) && rawId > 0) {
      return rawId;
    }
    const num = Number(String(rawId).replace(/\D/g, ''));
    return Number.isFinite(num) && num > 0 ? num : null;
  };

  const fetchMovements = useCallback(async (silent = false) => {
    const numericCardId = parseNumericId(card.id);
    if (!numericCardId) {
      setMovements([]);
      return;
    }
    try {
      if (!silent) setLoadingMovements(true);
      setMovementError('');
      const res = await cardApi.getCardMovementsApi(numericCardId);
      const data = res?.data?.data;
      if (Array.isArray(data)) {
        const deduped = Array.from(new Map(data.map((m) => [m.id, m])).values());
        deduped.sort(
          (a, b) => new Date(b.movedAt || 0).getTime() - new Date(a.movedAt || 0).getTime()
        );
        setMovements(deduped);
      } else {
        setMovements([]);
      }
    } catch (err) {
      setMovementError(err?.response?.data?.message || 'Không thể tải lịch sử di chuyển.');
    } finally {
      if (!silent) setLoadingMovements(false);
    }
  }, [card.id]);

  const fetchActivities = useCallback(async (silent = false) => {
    const numericCardId = parseNumericId(card.id);
    if (!numericCardId) {
      setActivities([]);
      return;
    }
    try {
      if (!silent) setLoadingActivities(true);
      setActivityError('');
      const res = await cardApi.getCardActivitiesApi(numericCardId);
      const data = res?.data?.data;
      if (Array.isArray(data)) {
        const deduped = Array.from(new Map(data.map((a) => [a.id, a])).values());
        deduped.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setActivities(deduped);
      } else {
        setActivities([]);
      }
    } catch (err) {
      setActivityError(err?.response?.data?.message || 'Không thể tải lịch sử hoạt động.');
    } finally {
      if (!silent) setLoadingActivities(false);
    }
  }, [card.id]);

  const reloadAllHistory = useCallback(async (silent = true) => {
    await Promise.allSettled([fetchMovements(silent), fetchActivities(silent)]);
  }, [fetchMovements, fetchActivities]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      const numericCardId = parseNumericId(card.id);
      if (!numericCardId) {
        if (active) {
          setMovements([]);
          setActivities([]);
        }
        return;
      }
      try {
        setLoadingMovements(true);
        setLoadingActivities(true);
        const [movRes, actRes] = await Promise.allSettled([
          cardApi.getCardMovementsApi(numericCardId),
          cardApi.getCardActivitiesApi(numericCardId),
        ]);
        if (!active) return;
        if (movRes.status === 'fulfilled' && Array.isArray(movRes.value?.data?.data)) {
          const mData = movRes.value.data.data;
          const dedupedM = Array.from(new Map(mData.map((m) => [m.id, m])).values());
          dedupedM.sort(
            (a, b) => new Date(b.movedAt || 0).getTime() - new Date(a.movedAt || 0).getTime()
          );
          setMovements(dedupedM);
        } else {
          setMovements([]);
        }
        if (actRes.status === 'fulfilled' && Array.isArray(actRes.value?.data?.data)) {
          const aData = actRes.value.data.data;
          const dedupedA = Array.from(new Map(aData.map((a) => [a.id, a])).values());
          dedupedA.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setActivities(dedupedA);
        } else {
          setActivities([]);
        }
      } catch (err) {
        if (active) {
          setMovementError(err?.response?.data?.message || 'Không thể tải lịch sử di chuyển.');
          setActivityError(err?.response?.data?.message || 'Không thể tải lịch sử hoạt động.');
        }
      } finally {
        if (active) {
          setLoadingMovements(false);
          setLoadingActivities(false);
        }
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [card.id]);

  useEffect(() => {
    let active = true;
    const loadWorkspaces = async () => {
      try {
        const list = await workspaceService.getAll();
        if (!active) return;
        if (Array.isArray(list)) {
          setWorkspaces(list);
          const currentWs = list.find((ws) => String(ws.id) === String(workspaceId));
          if (currentWs) {
            setSelectedWorkspaceId(currentWs.id);
            setSelectedWorkspaceName(currentWs.name);
          } else if (list.length > 0) {
            setSelectedWorkspaceId(list[0].id);
            setSelectedWorkspaceName(list[0].name);
          }
        }
      } catch {
        // Ignore fallback
      }
    };
    loadWorkspaces();
    return () => {
      active = false;
    };
  }, [workspaceId]);

  useEffect(() => {
    if (String(selectedWorkspaceId) === String(workspaceId) || !selectedWorkspaceId) {
      setAvailableColumns(columns);
    }
  }, [columns, selectedWorkspaceId, workspaceId]);

  const targetColumnObj =
    availableColumns.find((col) => String(col.id) === String(moveTargetColumnId)) || availableColumns[0];
  const totalBoardColumns = Math.max(1, availableColumns.length);

  const handleSelectWorkspace = async (ws) => {
    setSelectedWorkspaceId(ws.id);
    setSelectedWorkspaceName(ws.name);
    setOpenMoveDropdown(null);

    if (String(ws.id) === String(workspaceId)) {
      setAvailableColumns(columns);
      const defaultCol = columns.find((c) => String(c.id) !== String(currentColumnId)) || columns[0];
      if (defaultCol) {
        setMoveTargetColumnId(String(defaultCol.id));
        setMoveTargetPosition(1);
      }
    } else {
      try {
        setLoadingColumns(true);
        const res = await cardApi.getAreasApi(ws.id);
        const areas = res?.data?.data || [];
        const mappedCols = areas.map((a) => ({
          id: a.id,
          title: a.name,
        }));
        setAvailableColumns(mappedCols);
        if (mappedCols.length > 0) {
          setMoveTargetColumnId(String(mappedCols[0].id));
          setMoveTargetPosition(1);
        } else {
          setMoveTargetColumnId('');
          setMoveTargetPosition(1);
        }
      } catch {
        setAvailableColumns([]);
        setMoveTargetColumnId('');
      } finally {
        setLoadingColumns(false);
      }
    }
  };

  const handleMoveColumnSelect = (nextColId) => {
    const colIdx = availableColumns.findIndex((col) => String(col.id) === String(nextColId));
    setMoveTargetColumnId(String(nextColId));
    if (colIdx >= 0) {
      setMoveTargetPosition(colIdx + 1);
    }
    setOpenMoveDropdown(null);
  };

  const handleMovePositionSelect = (posNumber) => {
    const pos = Number(posNumber);
    setMoveTargetPosition(pos);
    const targetCol = availableColumns[pos - 1];
    if (targetCol) {
      setMoveTargetColumnId(String(targetCol.id));
    }
    setOpenMoveDropdown(null);
  };

  const handleExecuteMove = async () => {
    if (isMovingCard) return;

    const matchedCol =
      availableColumns.find((col) => String(col.id) === String(moveTargetColumnId)) ||
      availableColumns[moveTargetPosition - 1];
    const resolvedColId = matchedCol ? matchedCol.id : moveTargetColumnId;

    if (!resolvedColId) {
      alert('Vui lòng chọn danh sách cần chuyển đến.');
      return;
    }

    const isCrossWorkspace = String(selectedWorkspaceId) !== String(workspaceId);

    if (!isCrossWorkspace && String(resolvedColId) === String(currentColumnId)) {
      alert('Thẻ đã ở trong danh sách này. Vui lòng chọn danh sách khác.');
      return;
    }

    try {
      setIsMovingCard(true);
      const commentToSend = moveComment.trim() ? moveComment.trim() : null;
      const success = await onMoveCard?.(
        resolvedColId,
        moveTargetPosition,
        commentToSend,
        isCrossWorkspace
      );
      if (success) {
        setMoveComment('');
        setIsQuickMoveOpen(false);
        setIsQuickMemberOpen(false);
        setActivePopover(null);
        if (isCrossWorkspace) {
          onClose?.();
        } else {
          await reloadAllHistory();
        }
      }
    } finally {
      setIsMovingCard(false);
    }
  };

  const handleUploadCover = (dataUrl) => {
    setCoverImage(dataUrl);
    onUpdateCard?.(getUpdatedCard({ coverImage: dataUrl }));
  };

  const handleRemoveCover = () => {
    setCoverImage('');
    onUpdateCard?.(getUpdatedCard({ coverImage: '' }));
  };

  const getUpdatedCard = (overrides = {}) => {
    const nextOverrides = { ...overrides };
    if (!isPM && 'title' in nextOverrides) {
      nextOverrides.title = (card.title || '').trim();
    }
    if (!isPM && 'assigneeId' in nextOverrides) {
      nextOverrides.assigneeId = card.assigneeId || null;
      nextOverrides.assigneeName = card.assigneeName || '';
      nextOverrides.assigneeRole = card.assigneeRole || '';
      nextOverrides.assigneeUsername = card.assigneeUsername || '';
    }
    return {
      ...card,
      title: isPM ? title.trim() : (card.title || '').trim(),
      assigneeId: isPM ? (assigneeId || null) : (card.assigneeId || null),
      assigneeName: isPM ? (assigneeName || '') : (card.assigneeName || ''),
      assigneeRole: isPM ? (assigneeRole || '') : (card.assigneeRole || ''),
      assigneeUsername: isPM ? (assigneeUsername || '') : (card.assigneeUsername || ''),
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
      ...nextOverrides,
    };
  };

  const toggleCompletion = () => {
    const nextCompleted = !completed;
    setCompleted(nextCompleted);
    onUpdateCard?.(getUpdatedCard({ completed: nextCompleted }));
  };

  const [saveStatus, setSaveStatus] = useState('idle');

  const saveChanges = async () => {
    const effectiveTitle = isPM ? title.trim() : (card.title || '').trim();
    if (!effectiveTitle) return;

    const updated = getUpdatedCard({ title: effectiveTitle });
    if (activePanel === 'quick') {
      await onSave(updated);
    } else {
      setSaveStatus('saving');
      try {
        await onUpdateCard?.(updated);
        await reloadAllHistory(true);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('idle');
      } finally {
        setTimeout(() => {
          setSaveStatus('idle');
        }, 1500);
      }
    }
  };

  const savePopoverChanges = async () => {
    const effectiveTitle = isPM ? title.trim() : (card.title || '').trim();
    if (!effectiveTitle) return;

    const updated = getUpdatedCard({ title: effectiveTitle });
    await onUpdateCard?.(updated);
    setPopoverSnapshot(null);
    setActivePopover(null);
    await reloadAllHistory(true);
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
    if (popover === 'date' || popover === 'date-meta') {
      setCalendarTarget(!startEnabled ? 'start' : 'due');
    }
    if (popover === 'members' || popover === 'members-meta') {
      setMemberSearch('');
    }
    setActivePopover(popover);
  };

  const removeDate = async () => {
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

    if (activePopover === 'date' || activePopover === 'date-meta') {
      await onUpdateCard?.(clearedDate);
      setPopoverSnapshot(null);
      setActivePopover(null);
      await reloadAllHistory(true);
      return;
    }
    if (activePanel === 'details') {
      await onUpdateCard?.(clearedDate);
      await reloadAllHistory(true);
      return;
    }
    await onSave(clearedDate);
  };

  const handleCommentSubmit = (event) => {
    event.preventDefault();
    const text = commentDraft.trim();
    if (!text) return;

    const updatedComments = [
      ...comments,
      createNewCommentItem(text),
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

  const combinedActivities = useMemo(() => {
    const list = [];
    comments.forEach((comment, index) => {
      const commentText = typeof comment === 'string' ? comment : comment.text;
      const createdAt = typeof comment === 'string' ? null : comment.createdAt;
      const commentKey = comment.id || `c-${index}-${commentText}`;
      list.push({
        itemType: 'comment',
        id: commentKey,
        rawComment: comment,
        index,
        timestamp: createdAt ? new Date(createdAt).getTime() : 0,
      });
    });
    activities.forEach((act) => {
      const rawDesc = String(act.description || '').trim();
      if (/^đã cập nhật tiêu đề thành\s+".*"$/i.test(rawDesc)) {
        return;
      }
      const cleanedDesc = rawDesc.replace(/tiêu đề thành\s+"[^"]*",\s*/i, '');
      list.push({
        itemType: 'activity',
        id: `activity-${act.id}`,
        activity: { ...act, description: cleanedDesc },
        timestamp: act.createdAt ? new Date(act.createdAt).getTime() : 0,
      });
    });
    movements.forEach((m) => {
      const existsInAct = activities.some(
        (a) => a.actionType === 'MOVED' && Math.abs(new Date(a.createdAt).getTime() - new Date(m.movedAt).getTime()) < 5000
      );
      if (!existsInAct) {
        list.push({
          itemType: 'movement',
          id: `movement-${m.id}`,
          movement: m,
          timestamp: m.movedAt ? new Date(m.movedAt).getTime() : 0,
        });
      }
    });
    list.sort((a, b) => b.timestamp - a.timestamp);
    return list;
  }, [comments, activities, movements]);

  const renderActivityItem = (act) => {
    const userName = act.userName || (act.userId ? `Thành viên #${act.userId}` : 'Thành viên');
    const avatarColor = getAvatarColor(act.userId, userName);
    const initial = getInitials(userName);

    return (
      <article className="card-comment card-activity-record" key={`activity-${act.id}`}>
        <span
          className="card-comment-avatar"
          style={{ backgroundColor: avatarColor, color: '#ffffff', fontWeight: 600 }}
          aria-hidden="true"
          title={userName}
        >
          {initial}
        </span>
        <div className="card-comment-content">
          <p className="card-movement-text" style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.4' }}>
            <strong>{userName}</strong>{' '}
            <span>{act.description}</span>
          </p>
          {act.createdAt && (
            <time
              dateTime={act.createdAt}
              style={{ fontSize: '12px', color: '#626f86', marginTop: '2px', display: 'inline-block' }}
              title={new Date(act.createdAt).toLocaleString('vi-VN')}
            >
              {formatRelativeTime(act.createdAt)}
            </time>
          )}
        </div>
      </article>
    );
  };

  const renderMovementItem = (movement) => {
    const movedByName = movement.movedByName || `Người dùng #${movement.movedById || ''}`;
    const avatarColor = getAvatarColor(movement.movedById, movedByName);
    const initial = getInitials(movedByName);

    return (
      <article className="card-comment card-movement-record" key={`movement-${movement.id}`}>
        <span
          className="card-comment-avatar"
          style={{ backgroundColor: avatarColor, color: '#ffffff', fontWeight: 600 }}
          aria-hidden="true"
          title={movedByName}
        >
          {initial}
        </span>
        <div className="card-comment-content">
          <p className="card-movement-text" style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.4' }}>
            <strong>{movedByName}</strong>{' '}
            đã chuyển thẻ từ{' '}
            <span className="card-movement-area-badge">
              {movement.fromAreaName || (movement.fromAreaId ? `Cột #${movement.fromAreaId}` : 'Chưa phân cột')}
            </span>{' '}
            sang{' '}
            <span className="card-movement-area-badge">
              {movement.toAreaName || (movement.toAreaId ? `Cột #${movement.toAreaId}` : 'Cột đích')}
            </span>
          </p>
          {movement.comment && (
            <div className="card-movement-comment-quote">
              “{movement.comment}”
            </div>
          )}
          {movement.movedAt && (
            <time
              dateTime={movement.movedAt}
              style={{ fontSize: '12px', color: '#626f86', marginTop: '2px', display: 'inline-block' }}
              title={new Date(movement.movedAt).toLocaleString('vi-VN')}
            >
              {formatRelativeTime(movement.movedAt)}
            </time>
          )}
        </div>
      </article>
    );
  };

  const renderCommentItem = (comment, index) => {
    const commentText = typeof comment === 'string' ? comment : comment.text;
    const createdAt = typeof comment === 'string' ? null : comment.createdAt;
    const commentKey = comment.id || `${index}-${commentText}`;
    const isMenuOpen = openCommentMenuKey === commentKey;
    const isEditing = editingCommentKey === commentKey;
    const authorName = typeof comment === 'object' && comment.author ? comment.author : 'Bạn';
    const avatarLetter = authorName ? authorName.charAt(0).toUpperCase() : 'B';

    return (
      <article className="card-comment" key={commentKey}>
        <span className="card-comment-avatar" aria-hidden="true">{avatarLetter}</span>
        <div className="card-comment-content">
          <div className="card-comment-header">
            <strong>{authorName}</strong>
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

  const renderLabelPopover = () => (
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
  );

  const renderDatePopover = () => (
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
  );

    const isQuickAnchored = activePanel === 'quick' && Boolean(anchorRect);
  const quickCardWidth = anchorRect?.width ? Math.round(anchorRect.width) : 252;
  const quickModalStyle = isQuickAnchored
    ? {
        position: 'absolute',
        top: `${Math.max(12, Math.min(anchorRect.top, window.innerHeight - 280))}px`,
        left: `${Math.max(12, Math.min(anchorRect.left, window.innerWidth - (quickCardWidth + 190)))}px`,
        margin: 0,
        paddingBottom: '60px',
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
                    readOnly={!isPM}
                    title={!isPM ? 'Chỉ PM mới có quyền thay đổi tiêu đề thẻ' : undefined}
                    onChange={(event) => {
                      if (isPM) setTitle(event.target.value);
                    }}
                    onFocus={(event) => {
                      if (isPM) event.target.select();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        saveChanges();
                      }
                    }}
                    aria-label="Tiêu đề thẻ"
                    autoFocus={isPM}
                    rows={3}
                  />
                  {(description || comments.length > 0 || (assigneeId && assigneeName)) && (
                    <div className="card-quick-badges" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                      {assigneeId && assigneeName && (
                        <span
                          className="board-card-assignee"
                          style={{ marginLeft: 'auto' }}
                          title={`Được giao cho: ${assigneeName}${assigneeRole ? ` (${assigneeRole})` : ''}`}
                          aria-label={`Người thực hiện: ${assigneeName}`}
                        >
                          {getInitials(assigneeName)}
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
                setIsQuickMemberOpen(false);
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
                    setIsQuickMemberOpen(false);
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
              <div className="card-quick-move-anchor">
                <button
                  type="button"
                  className={isQuickMemberOpen ? 'is-active-move' : ''}
                  aria-expanded={isQuickMemberOpen}
                  onClick={() => {
                    setIsQuickMoveOpen(false);
                    setIsQuickCoverOpen(false);
                    setMemberSearch('');
                    setIsQuickMemberOpen((open) => !open);
                  }}
                >
                  <MemberUserIcon /> Thành viên
                </button>
                {isQuickMemberOpen && (
                  <CardMemberPopover
                    members={members}
                    assigneeId={assigneeId}
                    isPM={isPM}
                    onSelectMember={handleSelectMember}
                    onClose={() => setIsQuickMemberOpen(false)}
                    search={memberSearch}
                    onSearchChange={setMemberSearch}
                  />
                )}
              </div>
              <button type="button" onClick={() => {
                setActivePopover(null);
                setIsQuickMoveOpen(false);
                setIsQuickMemberOpen(false);
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
                    setIsQuickMemberOpen(false);
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

                      <span className="card-move-field-label">Bảng (Không gian làm việc)</span>
                      <div className="card-move-dropdown-wrapper">
                        <button
                          type="button"
                          className={`card-move-select-trigger ${openMoveDropdown === 'board' ? 'is-open' : ''}`}
                          onClick={() =>
                            setOpenMoveDropdown((cur) => (cur === 'board' ? null : 'board'))
                          }
                        >
                          <span>{selectedWorkspaceName || 'Chọn bảng...'}</span>
                          <DropdownChevron />
                        </button>
                        {openMoveDropdown === 'board' && (
                          <div className="card-move-select-menu" role="listbox">
                            {workspaces.map((ws) => {
                              const isSelected = String(ws.id) === String(selectedWorkspaceId);
                              return (
                                <button
                                  type="button"
                                  key={ws.id}
                                  className={`card-move-select-option ${isSelected ? 'is-selected' : ''}`}
                                  onClick={() => handleSelectWorkspace(ws)}
                                >
                                  {ws.name}
                                </button>
                              );
                            })}
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
                              <span>{loadingColumns ? 'Đang tải...' : (targetColumnObj?.title || 'Chưa có danh sách')}</span>
                              <DropdownChevron />
                            </button>
                            {openMoveDropdown === 'list' && (
                              <div className="card-move-select-menu" role="listbox">
                                {availableColumns.length === 0 ? (
                                  <div style={{ padding: '8px 12px', color: '#626f86', fontSize: '13px' }}>
                                    Không có danh sách nào
                                  </div>
                                ) : (
                                  availableColumns.map((col) => {
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
                                  })
                                )}
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

                      <span className="card-move-field-label">Lý do / Bình luận (tùy chọn)</span>
                      <input
                        type="text"
                        className="card-modal-input card-move-comment-input"
                        placeholder="Nhập lý do di chuyển thẻ..."
                        value={moveComment}
                        onChange={(e) => setMoveComment(e.target.value)}
                        disabled={isMovingCard}
                      />

                      <button
                        type="button"
                        className="card-move-submit-btn"
                        onClick={handleExecuteMove}
                        disabled={isMovingCard}
                      >
                        {isMovingCard ? 'Đang di chuyển...' : 'Di chuyển'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {onArchive && (
                <button type="button" onClick={onArchive}>
                  <ArchiveIcon /> {card.archived ? 'Bỏ lưu trữ' : 'Lưu trữ'}
                </button>
              )}
            </nav>
          </div>
        ) : (
          <>
            <header className="card-modal-header">
              {activePanel !== 'details' && (
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
              )}
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
                  {card.archived && (
                    <div className="card-detail-archived-banner">
                      <span className="card-detail-archived-text">
                        <ArchiveIcon /> Thẻ này đã được lưu trữ.
                      </span>
                      {onArchive && (
                        <button
                          type="button"
                          className="card-detail-unarchive-btn"
                          onClick={onArchive}
                        >
                          Bỏ lưu trữ
                        </button>
                      )}
                    </div>
                  )}
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
                      readOnly={!isPM}
                      title={!isPM ? 'Chỉ PM mới có quyền thay đổi tiêu đề thẻ' : undefined}
                      onChange={(event) => {
                        if (isPM) setTitle(event.target.value);
                      }}
                      aria-label="Tiêu đề thẻ"
                      autoFocus={isPM}
                    />
                  </div>

                  <div className="card-detail-shortcuts">
                    <div className={`card-popover-anchor ${activePopover === 'labels' ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        aria-expanded={activePopover === 'labels'}
                        onClick={() => openPopover('labels')}
                      >
                        <LabelTagIcon /> Nhãn
                      </button>
                      {activePopover === 'labels' && renderLabelPopover()}
                    </div>
                    <div className={`card-popover-anchor ${activePopover === 'date' ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        aria-expanded={activePopover === 'date'}
                        onClick={() => openPopover('date')}
                      >
                        <ClockIcon /> Ngày
                      </button>
                      {activePopover === 'date' && renderDatePopover()}
                    </div>
                    <div className={`card-popover-anchor ${activePopover === 'cover' ? 'is-open' : ''}`}>
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

                    <div className={`card-popover-anchor ${activePopover === 'members' ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        aria-expanded={activePopover === 'members'}
                        onClick={() => openPopover('members')}
                      >
                        <MemberUserIcon /> Thành viên
                      </button>
                      {activePopover === 'members' && (
                        <CardMemberPopover
                          members={members}
                          assigneeId={assigneeId}
                          isPM={isPM}
                          onSelectMember={handleSelectMember}
                          onClose={cancelPopoverChanges}
                          search={memberSearch}
                          onSearchChange={setMemberSearch}
                        />
                      )}
                    </div>

                    <div className={`card-popover-anchor ${activePopover === 'move' ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        aria-expanded={activePopover === 'move'}
                        onClick={() => openPopover('move')}
                      >
                        <MoveArrowIcon /> Di chuyển
                      </button>
                      {activePopover === 'move' && (
                        <div className="card-editor-popover card-move-popover" role="dialog" aria-label="Di chuyển thẻ">
                          <header className="card-editor-popover-header">
                            <h3>Di chuyển thẻ</h3>
                            <button type="button" onClick={cancelPopoverChanges} aria-label="Đóng di chuyển thẻ">
                              ×
                            </button>
                          </header>

                          <div className="card-move-body">
                            <span className="card-move-subtitle">Chọn đích đến</span>

                            <span className="card-move-field-label">Bảng (Không gian làm việc)</span>
                            <div className="card-move-dropdown-wrapper">
                              <button
                                type="button"
                                className={`card-move-select-trigger ${openMoveDropdown === 'board' ? 'is-open' : ''}`}
                                onClick={() =>
                                  setOpenMoveDropdown((cur) => (cur === 'board' ? null : 'board'))
                                }
                              >
                                <span>{selectedWorkspaceName || 'Chọn bảng...'}</span>
                                <DropdownChevron />
                              </button>
                              {openMoveDropdown === 'board' && (
                                <div className="card-move-select-menu" role="listbox">
                                  {workspaces.map((ws) => {
                                    const isSelected = String(ws.id) === String(selectedWorkspaceId);
                                    return (
                                      <button
                                        type="button"
                                        key={ws.id}
                                        className={`card-move-select-option ${isSelected ? 'is-selected' : ''}`}
                                        onClick={() => handleSelectWorkspace(ws)}
                                      >
                                        {ws.name}
                                      </button>
                                    );
                                  })}
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
                                    <span>{loadingColumns ? 'Đang tải...' : (targetColumnObj?.title || 'Chưa có danh sách')}</span>
                                    <DropdownChevron />
                                  </button>
                                  {openMoveDropdown === 'list' && (
                                    <div className="card-move-select-menu" role="listbox">
                                      {availableColumns.length === 0 ? (
                                        <div style={{ padding: '8px 12px', color: '#626f86', fontSize: '13px' }}>
                                          Không có danh sách nào
                                        </div>
                                      ) : (
                                        availableColumns.map((col) => {
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
                                        })
                                      )}
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

                            <span className="card-move-field-label">Lý do / Bình luận (tùy chọn)</span>
                            <input
                              type="text"
                              className="card-modal-input card-move-comment-input"
                              placeholder="Nhập lý do di chuyển thẻ..."
                              value={moveComment}
                              onChange={(e) => setMoveComment(e.target.value)}
                              disabled={isMovingCard}
                            />

                            <button
                              type="button"
                              className="card-move-submit-btn"
                              onClick={handleExecuteMove}
                              disabled={isMovingCard}
                            >
                              {isMovingCard ? 'Đang di chuyển...' : 'Di chuyển'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {(labels.length > 0 || (startEnabled && startDate) || (dueEnabled && dueDate) || Boolean(assigneeId && assigneeName)) && (
                    <div className="card-detail-meta">
                      {Boolean(assigneeId && assigneeName) && (
                        <div className={`card-detail-meta-group card-popover-anchor ${activePopover === 'members-meta' ? 'is-open' : ''}`}>
                          <span className="card-detail-meta-title">Thành viên</span>
                          <div className="card-detail-labels-row" style={{ alignItems: 'center' }}>
                            <button
                              type="button"
                              className="card-detail-member-badge"
                              onClick={() => openPopover('members-meta')}
                              title={`Người thực hiện: ${assigneeName}${assigneeRole ? ` (${assigneeRole})` : ''}`}
                            >
                              <div
                                className="card-detail-member-avatar"
                                style={{ backgroundColor: getAvatarColor(assigneeId, assigneeUsername) }}
                              >
                                {getInitials(assigneeName)}
                              </div>
                              <span className="card-detail-member-name">{assigneeName}</span>
                              {assigneeRole && (
                                <span className={`card-role-badge ${ROLE_CONFIG[assigneeRole]?.className || 'role-badge-member'}`}>
                                  {assigneeRole}
                                </span>
                              )}
                            </button>
                            {isPM && (
                              <button
                                type="button"
                                className="card-detail-member-add"
                                aria-label="Thay đổi thành viên"
                                onClick={() => openPopover('members-meta')}
                                title="Thay đổi thành viên"
                              >
                                ＋
                              </button>
                            )}
                          </div>
                          {activePopover === 'members-meta' && (
                            <CardMemberPopover
                              members={members}
                              assigneeId={assigneeId}
                              isPM={isPM}
                              onSelectMember={handleSelectMember}
                              onClose={cancelPopoverChanges}
                              search={memberSearch}
                              onSearchChange={setMemberSearch}
                            />
                          )}
                        </div>
                      )}

                      {labels.length > 0 && (
                        <div className={`card-detail-meta-group card-popover-anchor ${activePopover === 'labels-meta' ? 'is-open' : ''}`}>
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
                                onClick={() => openPopover('labels-meta')}
                              />
                            ))}
                            <button
                              type="button"
                              className="card-detail-label-add"
                              aria-label="Thêm nhãn"
                              onClick={() => openPopover('labels-meta')}
                            >
                              ＋
                            </button>
                          </div>
                          {activePopover === 'labels-meta' && renderLabelPopover()}
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
                          <div className={`card-detail-meta-group card-popover-anchor ${activePopover === 'date-meta' ? 'is-open' : ''}`}>
                            <span className="card-detail-meta-title">Ngày</span>
                            <button
                              type="button"
                              className="card-detail-date-badge"
                              onClick={() => openPopover('date-meta')}
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
                            {activePopover === 'date-meta' && renderDatePopover()}
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
                    <div className="card-modal-footer-left">
                      {onArchive && (
                        <button
                          type="button"
                          className="card-archive-button"
                          onClick={onArchive}
                        >
                          <ArchiveIcon /> {card.archived ? 'Bỏ lưu trữ' : 'Lưu trữ'}
                        </button>
                      )}
                    </div>
                    <div className="card-modal-footer-right">
                      <button
                        type="button"
                        className={`card-save-button ${saveStatus === 'saved' ? 'is-saved' : ''}`}
                        onClick={saveChanges}
                        disabled={saveStatus === 'saving'}
                      >
                        {saveStatus === 'saving' ? 'Đang lưu...' : saveStatus === 'saved' ? '✓ Đã lưu' : 'Lưu'}
                      </button>
                    </div>
                  </footer>
                </div>

                <aside
                  className="card-activity-panel"
                  onWheel={(e) => {
                    if (commentListRef.current && !e.target.closest('.card-comment-list')) {
                      commentListRef.current.scrollTop += e.deltaY;
                    }
                  }}
                >
                  <h3><CommentIcon size={18} /> Nhận xét và hoạt động</h3>
                  <div className="card-activity-tabs" role="tablist" aria-label="Bộ lọc hoạt động">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activityTab === 'all'}
                      className={`card-activity-tab-btn ${activityTab === 'all' ? 'is-active' : ''}`}
                      onClick={() => setActivityTab('all')}
                    >
                      Tất cả
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activityTab === 'movements'}
                      className={`card-activity-tab-btn ${activityTab === 'movements' ? 'is-active' : ''}`}
                      onClick={() => setActivityTab('movements')}
                    >
                      Lịch sử di chuyển
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activityTab === 'comments'}
                      className={`card-activity-tab-btn ${activityTab === 'comments' ? 'is-active' : ''}`}
                      onClick={() => setActivityTab('comments')}
                    >
                      Nhận xét
                    </button>
                  </div>

                  {(activityTab === 'all' || activityTab === 'comments') && (
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
                  )}

                  {(loadingActivities || loadingMovements) && activities.length === 0 && movements.length === 0 && (
                    <p className="card-activity-status">Đang tải lịch sử hoạt động...</p>
                  )}

                  {(activityError || movementError) && (
                    <div className="card-activity-error" role="alert">
                      <span>{activityError || movementError}</span>
                      <button type="button" onClick={reloadAllHistory}>
                        Thử lại
                      </button>
                    </div>
                  )}

                  <div className="card-comment-list" ref={commentListRef} aria-live="polite">
                    {activityTab === 'comments' && (
                      comments.length === 0 ? (
                        <p className="card-comment-empty">Chưa có nhận xét nào.</p>
                      ) : (
                        comments.map((comment, index) => renderCommentItem(comment, index))
                      )
                    )}

                    {activityTab === 'movements' && (
                      movements.length === 0 && !loadingMovements ? (
                        <p className="card-comment-empty">Chưa có lịch sử di chuyển nào cho thẻ này.</p>
                      ) : (
                        movements.map((movement) => renderMovementItem(movement))
                      )
                    )}

                    {activityTab === 'all' && (
                      combinedActivities.length === 0 && !loadingActivities && !loadingMovements ? (
                        <p className="card-comment-empty">Chưa có hoạt động nào.</p>
                      ) : (
                        combinedActivities.map((item) => {
                          if (item.itemType === 'activity') {
                            return renderActivityItem(item.activity);
                          }
                          if (item.itemType === 'movement') {
                            return renderMovementItem(item.movement);
                          }
                          return renderCommentItem(item.rawComment, item.index);
                        })
                      )
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
