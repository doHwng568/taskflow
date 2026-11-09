import Button from "react-bootstrap/Button";
import useThemeStore from "../../store/themeStore";

function ThemeToggle() {
    const theme = useThemeStore((state) => state.theme);
    const toggleTheme = useThemeStore((state) => state.toggleTheme);

    const isDark = theme === "dark";

    return (
        <Button
            type="button"
            variant={isDark ? "outline-light" : "outline-dark"}
            size="sm"
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
        >
            {isDark ? "☀ Light" : "☾ Dark"}
        </Button>
    );
}

export default ThemeToggle;