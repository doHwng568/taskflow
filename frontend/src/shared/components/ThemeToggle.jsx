import useThemeStore from "../../store/themeStore";

function ThemeToggle() {
    const theme = useThemeStore((state) => state.theme);
    const toggleTheme = useThemeStore((state) => state.toggleTheme);

    const isDark = theme === "dark";

    return (
        <button
            type="button"
            className="tf-header-btn"
            onClick={toggleTheme}
            title={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
            aria-label="Toggle theme"
        >
            {isDark ? "☀ Light" : "☾ Dark"}
        </button>
    );
}

export default ThemeToggle;