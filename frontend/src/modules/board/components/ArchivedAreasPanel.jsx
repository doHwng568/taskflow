import { useEffect, useState } from 'react';
import areaService from '../services/areaService';

// Bảng liệt kê các area đã lưu trữ: khôi phục hoặc xóa hẳn
export default function ArchivedAreasPanel({ workspaceId, refreshKey, onClose, onRestored }) {
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
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không khôi phục được danh sách');
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
      setAreas((current) => current.filter((item) => item.id !== area.id));
    } catch (err) {
      setError(err.response?.data?.message ?? 'Không xóa được danh sách');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <aside className="archived-panel" aria-label="Danh sách đã lưu trữ">
      <div className="archived-panel-header">
        <span>Danh sách đã lưu trữ</span>
        <button
          type="button"
          className="archived-panel-close"
          onClick={onClose}
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      <div className="archived-panel-body">
        {loading && <p className="archived-panel-note">Đang tải...</p>}
        {error && <p className="archived-panel-error">{error}</p>}
        {!loading && !error && areas.length === 0 && (
          <p className="archived-panel-note">Chưa có danh sách nào được lưu trữ.</p>
        )}

        {areas.map((area) => (
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
      </div>
    </aside>
  );
}