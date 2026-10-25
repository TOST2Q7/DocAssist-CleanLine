import { APP_VERSION, SOURCE_URL } from '@/shared/env';
import { IconLink } from '@/shared/ui/icons';
import styles from './App.module.css';

export function App() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>DocAssist</span>
      </header>
      <main className={styles.main}>
        <p>Каркас приложения. Модули подключаются здесь.</p>
      </main>
      <footer className={styles.footer}>
        <span>{`v${APP_VERSION}`}</span>
        {/* AGPL-3.0: users of the hosted app get a link to the source. */}
        <a className={styles.link} href={SOURCE_URL} target="_blank" rel="noreferrer">
          <IconLink aria-hidden />
          Исходный код
        </a>
      </footer>
    </div>
  );
}
