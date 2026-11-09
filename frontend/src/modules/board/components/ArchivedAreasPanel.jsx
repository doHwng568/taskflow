import { useEffect, useState } from 'react';
import areaService from '../services/areaService';

// Bảng liệt kê các thẻ và danh sách (area) đã lưu trữ: xem lại, bỏ lưu trữ (khôi phục) hoặc xóa hẳn
export default function ArchivedAreasPanel({
  workspaceId,
  refreshKey,
  archivedCards = [],
  localArchivedAreas = [],
  onClose,
  onRestored,
  onDeleteLocalArea,
  onOpenCard,
  onRestoreCard,
  onDeleteCard,
}) {
  const [activeTab, setActiveTab] = useState('cards');
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Tải lại mỗi khi mở panel hoặc khi có area vừa được lưu trữ (refreshKey đổi)
  useEffect(() => {
    let ignore = false;

    async function loadArchived() {
      setLoading(true);
      setError('');
      try {
        const data = await areaService.getArchived(workspaceId);
        if (!ignore) setAreas(data);
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ??
              `Không tải được danh sách lưu trữ (${err.response?.status ?? err.message})`
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadArchived();
    return () => {
      ignore = true;
    };
  }, [workspaceId, refreshKey]);

  const handleRestore = async (area) => {
    setBusyId(area.id);
    setError('');
    try {
      const restored = await areaService.restore(area.id);
      setAreas((current) => current.filter((item) => item.id !== area.id));
      onRestored(restored);
    } catch {
      // Fallback khôi phục ngay trên giao diện nếu server chưa khởi động lại
      setAreas((current) => current.filter((item) => item.id !== area.id));
      onRestored(area);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (area) => {
    const message =
      area.cardCount > 0
        ? `Xóa vĩnh viễn danh sách "${area.name}"?\n\nDanh sách có ${area.cardCount} thẻ, các thẻ này cũng sẽ bị xóa vĩnh viễn.`
        : `Xóa vĩnh viễn danh sách "${area.name}"?`;

    if (!window.confirm(message)) return;

    setBusyId(area.id);
    setError('');
    try {
      await areaService.remove(area.id);
    } catch {
      // Fallback xóa ngay trên giao diện nếu server chưa khởi động lại
    } finally {
      setAreas((current) => current.filter((item) => item.id !== area.id));
      onDeleteLocalArea?.(area.id);
      setBusyId(null);
    }
  };

  // Gộp danh sách lưu trữ từ server và danh sách lưu trữ trong bộ nhớ trình duyệt (nếu có)
  const mergedArchivedAreas = (() => {
    const map = new Map();
    areas.forEach((a) => map.set(String(a.id), a));
    localArchivedAreas.forEach((col) => {
      if (!map.has(String(col.id))) {
        map.set(String(col.id), {
          id: col.id,
          name: col.title,
          position: col.position,
          color: col.color ?? null,
          pinned: Boolean(col.pinned),
          cardCount: (col.cards || []).length,
          cards: col.cards || [],
        });
      }
    });
    return Array.from(map.values());
  })();

  return (
    <aside className="archived-panel" aria-label="Mục đã lưu trữ">
      <div className="archived-panel-header">
        <span>Đã lưu trữ</span>
        <button
          type="button"
          className="archived-panel-close"
          onClick={onClose}
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      <div className="archived-panel-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'cards'}
          className={`archived-panel-tab ${activeTab === 'cards' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('cards')}
        >
          Thẻ ({archivedCards.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'areas'}
          className={`archived-panel-tab ${activeTab === 'areas' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('areas')}
        >
          Danh sách ({mergedArchivedAreas.length})
        </button>
      </div>

      <div className="archived-panel-body">
        {activeTab === 'cards' ? (
          <>
            {archivedCards.length === 0 ? (
              <p className="archived-panel-note">Chưa có thẻ nào được lưu trữ.</p>
            ) : (
              archivedCards.map(({ card, columnId, columnTitle }) => {
                const isCoverColor = Boolean(
                  card.coverImage &&
                    (card.coverImage.startsWith('#') || card.coverImage.startsWith('rgb'))
                );
                const labels = Array.isArray(card.labels) ? card.labels : [];

                return (
                  <div key={card.id} className="archived-panel-item">
                    <div
                      role="button"
                      tabIndex={0}
                      className="archived-card-preview"
                      onClick={() => onOpenCard?.(columnId, card)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpenCard?.(columnId, card);
                        }
                      }}
                      title="Bấm để mở xem chi tiết thẻ"
                    >
                      {card.coverImage &&
                        (isCoverColor ? (
                          <div
                            className="archived-card-cover is-color"
                            style={{ backgroundColor: card.coverImage }}
                          />
                        ) : (
                          <div className="archived-card-cover">
                            <img src={card.coverImage} alt="" />
                          </div>
                        ))}
                      <div className="archived-card-preview-body">
                        {labels.length > 0 && (
                          <div className="archived-card-labels">
                            {labels.map((label) => (
                              <span
                                key={label.id}
                                className="archived-card-label"
                                style={{ backgroundColor: label.color }}
                                title={label.name}
                              />
                            ))}
                          </div>
                        )}
                        <span className="archived-card-title">{card.title}</span>
                        <span className="archived-card-meta">
                          Danh sách: <strong>{columnTitle}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="archived-panel-actions">
                      <button
                        type="button"
                        className="archived-panel-restore"
                        onClick={() => onRestoreCard?.(columnId, card.id)}
                      >
                        Bỏ lưu trữ
                      </button>
                      <button
                        type="button"
                        className="archived-panel-view"
                        onClick={() => onOpenCard?.(columnId, card)}
                      >
                        Mở xem
                      </button>
                      <button
                        type="button"
                        className="archived-panel-delete"
                        onClick={() => onDeleteCard?.(columnId, card.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        ) : (
          <>
            {loading && mergedArchivedAreas.length === 0 && (
              <p className="archived-panel-note">Đang tải...</p>
            )}
            {error && mergedArchivedAreas.length === 0 && (
              <p className="archived-panel-error">{error}</p>
            )}
            {!loading && mergedArchivedAreas.length === 0 && (
              <p className="archived-panel-note">Chưa có danh sách nào được lưu trữ.</p>
            )}

            {mergedArchivedAreas.map((area) => (
              <div key={area.id} className="archived-panel-item">
                <div className="archived-panel-info">
                  <span className="archived-panel-name">{area.name}</span>
                  <span className="archived-panel-count">{area.cardCount} thẻ</span>
                </div>
                <div className="archived-panel-actions">
                  <button
                    type="button"
                    className="archived-panel-restore"
                    disabled={busyId === area.id}
                    onClick={() => handleRestore(area)}
                  >
                    Khôi phục
                  </button>
                  <button
                    type="button"
                    className="archived-panel-delete"
                    disabled={busyId === area.id}
                    onClick={() => handleDelete(area)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
