# DocAssist-CleanLine

Веб-приложение (SPA), работает целиком в браузере, без сервера.

- **Онлайн-версия** — GitHub Pages: https://tost2q7.github.io/DocAssist-CleanLine/ (обновляется при каждом пуше в `main`).
- **Версия-файл** — один HTML-файл `docassist-cleanline-vX.Y.Z.html`: открывается двойным кликом, работает офлайн. Лежит на странице Releases. Вход через Google в ней работать не будет: Google OAuth не разрешает вход со страниц, открытых как файл (`file://`).

## Команды

```bash
npm install
npm run dev         # локальный сервер разработки
npm run check       # все проверки: типы, линтер, границы модулей, форматирование, тесты
npm run build       # сборка для Pages → dist/
npm run build:file  # версия-файл → dist-file/
```

## Настройка GitHub (один раз)

Settings → Pages → Build and deployment → Source: **GitHub Actions**.

## Выпуск версии

1. Поднять `version` в `package.json`, влить в `main`.
2. Создать тег `vX.Y.Z` с той же версией (Releases → Draft a new release, или `git tag v0.2.0 && git push origin v0.2.0`).
3. CI сам приложит версию-файл к релизу.

## Структура

- `src/app/` — оболочка приложения: связывает модули между собой.
- `src/modules/<имя>/` — функциональные области (шифрование, Google Drive и т. д.). Снаружи модуль доступен только через свой `index.ts`; это проверяет `npm run check`.
- `src/shared/` — общее без бизнес-логики: дизайн-токены, UI-кит, утилиты.
- `CLAUDE.md` в корне и в модулях — инструкции для Claude (короткие, на английском).

## Сторонние материалы

- Иконки: [Solar Icon Set](https://github.com/480-Design/Solar-Icon-Set) от 480 Design, лицензия [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Шрифты: Montserrat, Onest, Unbounded — SIL Open Font License.

## Как работать с Claude

- В начале сессии называй область: «Модуль crypto: добавить …». Тогда Claude читает только её.
- Одна задача — одна сессия. Между несвязанными задачами в одной сессии — `/clear`.
- Дизайн-документацию клади в `docs/design/`: Claude один раз перенесёт её в токены (`src/shared/design/tokens.css`), дальше читает только токены.
