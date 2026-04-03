import { Link, Outlet } from 'react-router-dom'
import { useThemeStore } from '../store/themeStore'
import styles from './Layout.module.css'

export function Layout() {
  const { theme, toggle } = useThemeStore()

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/ads" className={styles.brand}>
          Авито · кабинет продавца
        </Link>
        <nav className={styles.nav}>
          <Link to="/ads">Мои объявления</Link>
        </nav>
        <button
          type="button"
          className={styles.themeBtn}
          onClick={toggle}
          aria-label="Переключить тему"
        >
          {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        </button>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
