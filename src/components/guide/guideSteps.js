// In-app guide content, one tour per role.
// step: { route?, target?, title, body }
//   route  — page the step lives on (the tour navigates there)
//   target — value of a data-tour="..." attribute to highlight; omitted = centered card

export const GUIDE_STEPS = {
  student: [
    {
      route: '/student/dashboard',
      title: 'Добро пожаловать!',
      body: 'Здесь видно, сколько у вас баллов и за что их начислили. Короткий тур покажет, где что находится. Листайте кнопками «Далее» и «Назад».',
    },
    {
      route: '/student/dashboard',
      target: 'student-profile',
      title: 'Ваши баллы',
      body: 'Имя, класс и текущая сумма баллов. 100–130 это стандартный уровень, от 131 мериты, ниже 100 демериты.',
    },
    {
      route: '/student/dashboard',
      target: 'student-history',
      title: 'История начислений',
      body: 'Каждая запись: кто поставил, за какое правило, комментарий учителя и дата. Плюс зелёный, минус красный.',
    },
    {
      route: '/student/dashboard',
      target: 'logout',
      title: 'Выход',
      body: 'Если заходили в браузере на чужом устройстве, нажмите Log out. В Telegram выходить не нужно.',
    },
    {
      route: '/student/dashboard',
      title: 'Готово',
      body: 'Ошибочный балл? Подойдите к учителю, который его поставил: имя есть в истории. Гид можно открыть снова кнопкой «?» вверху.',
    },
  ],

  teacher: [
    {
      route: '/teacher/dashboard',
      title: 'Добро пожаловать!',
      body: 'Покажем, как ставить мериты и демериты, смотреть свой класс и исправлять ошибки. Это займёт минуту.',
    },
    {
      route: '/teacher/dashboard',
      target: 'nav-students',
      title: 'Вкладка Students',
      body: 'Главная вкладка для работы: отсюда выставляются баллы. Внизу ещё Dashboard (ваша история) и Rules (список правил).',
    },
    {
      route: '/teacher/students',
      target: 'teacher-modes',
      title: 'Все классы или мой класс',
      body: 'All Classes показывает все классы школы. My Class показывает только ваш класс как классного руководителя, с полной историей каждого ученика.',
    },
    {
      route: '/teacher/students',
      target: 'teacher-search',
      title: 'Поиск ученика',
      body: 'Начните вводить имя или фамилию, и ученик найдётся без выбора класса.',
    },
    {
      route: '/teacher/students',
      target: 'teacher-classes',
      title: 'Как поставить баллы',
      body: 'Выберите класс и нажмите на ученика. В панели отметьте правила, напишите комментарий (он обязателен, ученик его увидит) и нажмите Assign.',
    },
    {
      route: '/teacher/rules',
      target: 'rules-list',
      title: 'Правила',
      body: 'Все правила школы с баллами: зелёные дают плюс, красные минус. Нажмите на правило, чтобы сразу выбрать учеников для него.',
    },
    {
      route: '/teacher/dashboard',
      target: 'teacher-history',
      title: 'Ваша история и исправления',
      body: 'Все ваши начисления. Ошибочную запись можно удалить: баллы и место ученика в рейтинге вернутся.',
    },
    {
      route: '/teacher/dashboard',
      title: 'Готово',
      body: 'Если приём баллов закрыт администрацией или вышел срок по таймеру, приложение покажет это сверху. Гид можно открыть снова кнопкой «?» вверху.',
    },
  ],

  admin: [
    {
      route: '/admin/dashboard',
      title: 'Добро пожаловать!',
      body: 'Покажем, где статистика школы, пользователи, правила и настройки. Листайте кнопками «Далее» и «Назад».',
    },
    {
      route: '/admin/dashboard',
      target: 'admin-stats',
      title: 'Ученики и учителя',
      body: 'Сколько всего учеников и учителей и сколько из них активны, то есть уже вошли через Telegram.',
    },
    {
      route: '/admin/dashboard',
      target: 'admin-analytics',
      title: 'Аналитика',
      body: 'Сколько всего начислений и сумма меритов и демеритов по школе.',
    },
    {
      route: '/admin/dashboard',
      target: 'admin-ranking',
      title: 'Рейтинг',
      body: 'Переключайте 6–8 классы, 9–12 классы и рейтинг классов. Стрелки показывают, кто поднялся или опустился.',
    },
    {
      route: '/admin/users',
      target: 'users-toggle',
      title: 'Пользователи',
      body: 'Ученики и учителя: добавление, изменение, логины и пароли, классный руководитель. Пустое поле пароля при редактировании оставляет старый пароль. Зелёная точка: Telegram привязан.',
    },
    {
      route: '/admin/codes',
      target: 'codes-add',
      title: 'Новое правило',
      body: 'Создайте правило: название, сколько баллов (минус для демерита), кому доступно и лимит использований за период.',
    },
    {
      route: '/admin/codes',
      target: 'codes-list',
      title: 'Список правил',
      body: 'Здесь правила редактируются и удаляются. Учителя видят изменения сразу.',
    },
    {
      route: '/admin/settings',
      target: 'settings-sections',
      title: 'Настройки и контроль',
      body: 'Таймер приёма баллов для всей школы, модерация истории с экспортом, статистика учителей, отстранения, меры реагирования и реестр рисков.',
    },
    {
      route: '/admin/dashboard',
      title: 'Готово',
      body: 'При 50 баллах и ниже система сама создаёт меру реагирования, она появится в Settings → Interventions & Alerts. Гид можно открыть снова кнопкой «?» вверху.',
    },
  ],
};

export const roleKey = (role) => (role === 'superadmin' ? 'admin' : role);
