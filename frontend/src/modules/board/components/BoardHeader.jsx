import { Link } from "react-router-dom";
import ThemeToggle from "../../../shared/components/ThemeToggle";

export default function BoardHeader({
    onOpenArchived,
    workspaceId,
}) {
    return (
        <header className="board-header">
            <div className="board-header-left">
                <Link to="/home" className="board-nav-link">
                    Home
                </Link>

                <Link to="/workspace" className="board-nav-link">
                    Workspaces
                </Link>

                <Link
                    to={`/workspace/${workspaceId}`}
                    className="board-nav-link"
                >
                    Workspace Detail
                </Link>
            </div>

            <div className="board-header-actions">
                <button
                    type="button"
                    className="board-archive-button"
                    onClick={onOpenArchived}
                >
                    Đã lưu trữ
                </button>

                <ThemeToggle />
            </div>
        </header>
    );
}