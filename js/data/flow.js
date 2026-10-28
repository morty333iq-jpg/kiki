// Script for the "How a work is born" block on the home page.
// nodes = steps around the artboard; chat = messages (from: 'client' | 'kiki'); tasks light up nodes.
window.KIKI_FLOW = {
  ru: {
    kicker: 'Процесс / в реальном времени',
    title: 'Как рождается работа <span>— от сообщения до готовых файлов</span>',
    lead: 'Слева — что я делаю с дизайном, справа — как мы общаемся. Так обычно и проходит заказ: ты пишешь, я показываю шаги, вместе доводим до результата.',
    tabs: ['Чат', 'Файлы', 'Правки'],
    board: 'Постер · джаз-вечер',
    input: 'Напиши kiki в Telegram…',
    running: 'В работе',
    queued: 'В очереди',
    done: 'Готово',
    nodes: ['Бриф', 'Референсы', 'Скетч', 'Композиция', 'Шрифты', 'Цвет', 'Обработка', 'Экспорт'],
    chat: [
      { from: 'client', text: 'Привет! Нужен постер для джазового вечера в баре 🎷' },
      {
        from: 'kiki',
        text: 'Привет! Люблю такие задачи. Расскажи про настроение — и скинь примеры, если есть.',
        tasks: [[0, 'Разбираю задачу и формат']],
      },
      { from: 'client', text: 'Хочется ретро, тёплые цвета и саксофон крупно.' },
      {
        from: 'kiki',
        text: 'Понял! Собираю референсы и делаю скетч. <b>Покажу пару вариантов композиции.</b>',
        tasks: [
          [1, 'Ищу ретро-постеры'],
          [2, 'Рисую быстрый скетч'],
          [3, 'Строю композицию'],
        ],
      },
      {
        from: 'kiki',
        text: 'Подбираю шрифты и тёплую палитру — как на старых афишах.',
        tasks: [
          [4, 'Пары шрифтов'],
          [5, 'Ретро-палитра'],
        ],
      },
      { from: 'client', text: 'Круто! А можно саксофон ещё крупнее и поярче?' },
      {
        from: 'kiki',
        text: 'Конечно. Увеличил, поправил свет, контраст и цветокоррекцию. <b>Смотри, что вышло 👀</b>',
        tasks: [[6, 'Обработка и коррекция']],
      },
      { from: 'client', text: 'Огонь 🔥 То, что нужно!' },
      { from: 'kiki', text: 'Ура! Отправляю файлы для печати и для соцсетей.', tasks: [[7, 'PNG, PDF, сторис']] },
    ],
  },
  en: {
    kicker: 'Process / live',
    title: 'How a work is born <span>— from a message to final files</span>',
    lead: 'On the left — what I do with the design, on the right — how we talk. That’s how an order usually goes: you write, I show the steps, and together we get to the result.',
    tabs: ['Chat', 'Files', 'Edits'],
    board: 'Poster · jazz night',
    input: 'Message kiki on Telegram…',
    running: 'Running',
    queued: 'Queued',
    done: 'Done',
    nodes: ['Brief', 'References', 'Sketch', 'Layout', 'Fonts', 'Color', 'Retouch', 'Export'],
    chat: [
      { from: 'client', text: 'Hi! I need a poster for a jazz night at a bar 🎷' },
      {
        from: 'kiki',
        text: 'Hi! I love tasks like this. Tell me about the mood — and send examples if you have any.',
        tasks: [[0, 'Reading the task and format']],
      },
      { from: 'client', text: 'Something retro, warm colors and a big saxophone.' },
      {
        from: 'kiki',
        text: 'Got it! Collecting references and making a sketch. <b>I’ll show a couple of layouts.</b>',
        tasks: [
          [1, 'Looking at retro posters'],
          [2, 'Quick sketch'],
          [3, 'Building the layout'],
        ],
      },
      {
        from: 'kiki',
        text: 'Picking fonts and a warm palette — like old concert posters.',
        tasks: [
          [4, 'Font pairs'],
          [5, 'Retro palette'],
        ],
      },
      { from: 'client', text: 'Cool! Can the sax be even bigger and brighter?' },
      {
        from: 'kiki',
        text: 'Sure. Made it bigger, fixed light, contrast and color. <b>Take a look 👀</b>',
        tasks: [[6, 'Retouch and correction']],
      },
      { from: 'client', text: 'Fire 🔥 Exactly what I wanted!' },
      { from: 'kiki', text: 'Yay! Sending files for print and social media.', tasks: [[7, 'PNG, PDF, stories']] },
    ],
  },
};
