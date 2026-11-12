// In-app guide content, one tour per role.
// step: { route?, target?, title, body }
//   route  — page the step lives on (the tour navigates there)
//   target — value of a data-tour="..." attribute to highlight; omitted = centered card

export const GUIDE_STEPS = {
  student: [
    {
      route: '/student/dashboard',
      title: 'Welcome!',
      body: 'Here you can see your points and what you got them for. This short tour shows where everything is. Use Next and Back to move through it.',
    },
    {
      route: '/student/dashboard',
      target: 'student-profile',
      title: 'Your points',
      body: 'Your name, class and current points. 100–130 is the Standard level, 131 and above is Merit, below 100 is Demerit.',
    },
    {
      route: '/student/dashboard',
      target: 'student-progress',
      title: 'Your progress',
      body: 'How many points you need for the next level, how your points changed over the term, and your merits and demerits in total.',
    },
    {
      route: '/student/dashboard',
      target: 'student-history',
      title: 'Points history',
      body: 'Every entry shows who gave the points, for which rule, the teacher’s comment and the date. Green is a plus, red is a minus.',
    },
    {
      route: '/student/dashboard',
      target: 'logout',
      title: 'Log out',
      body: 'If you signed in on someone else’s device in a browser, tap Log out when you are done. In Telegram you don’t need to.',
    },
    {
      route: '/student/dashboard',
      title: 'All set',
      body: 'Think a point was given by mistake? Talk to the teacher who gave it — their name is in your history. You can replay this tour with the “?” button at the top, or open the full illustrated guide below.',
    },
  ],

  teacher: [
    {
      route: '/teacher/dashboard',
      title: 'Welcome!',
      body: 'This tour shows how to give merits and demerits, check your homeroom class and fix mistakes. It takes about a minute.',
    },
    {
      route: '/teacher/dashboard',
      target: 'nav-students',
      title: 'Students tab',
      body: 'This is where you assign points. The other tabs are Dashboard (your history) and Rules (the list of rules).',
    },
    {
      route: '/teacher/students',
      target: 'teacher-modes',
      title: 'All classes or my class',
      body: 'All Classes shows every class in the school. My Class shows only your homeroom class, with each student’s full history.',
    },
    {
      route: '/teacher/students',
      target: 'teacher-search',
      title: 'Find a student',
      body: 'Start typing a first or last name to find a student without picking a class.',
    },
    {
      route: '/teacher/students',
      target: 'teacher-classes',
      title: 'How to assign points',
      body: 'Pick a class and tap a student. In the panel, tick the rules, write a comment (required — the student will see it) and tap Assign.',
    },
    {
      route: '/teacher/rules',
      target: 'rules-list',
      title: 'Rules',
      body: 'All school rules with their points: green adds, red subtracts. Tap a rule to pick students for it straight away.',
    },
    {
      route: '/teacher/dashboard',
      target: 'teacher-history',
      title: 'Your history and corrections',
      body: 'Everything you have assigned. Delete a wrong entry and the student’s points and ranking go back to what they were.',
    },
    {
      route: '/teacher/dashboard',
      title: 'All set',
      body: 'If the administration closes point assignment or the deadline passes, you will see it at the top of the page. You can replay this tour with the “?” button at the top, or open the full illustrated guide below.',
    },
  ],

  admin: [
    {
      route: '/admin/dashboard',
      title: 'Welcome!',
      body: 'This tour shows where to find school stats, users, rules and settings. Use Next and Back to move through it.',
    },
    {
      route: '/admin/dashboard',
      target: 'admin-stats',
      title: 'Students and teachers',
      body: 'Total students and teachers, and how many are active — that is, have linked their Telegram.',
    },
    {
      route: '/admin/dashboard',
      target: 'admin-analytics',
      title: 'Analytics',
      body: 'Total assignments and the sum of merits and demerits across the school.',
    },
    {
      route: '/admin/dashboard',
      target: 'admin-ranking',
      title: 'Ranking',
      body: 'Switch between grades 6–8, grades 9–12 and the class ranking. Arrows show who moved up or down.',
    },
    {
      route: '/admin/users',
      target: 'users-toggle',
      title: 'Users',
      body: 'Students and teachers: add and edit them, set usernames, passwords and homeroom teachers. Leave the password empty when editing to keep the old one. A green dot means Telegram is linked.',
    },
    {
      route: '/admin/codes',
      target: 'codes-add',
      title: 'New rule',
      body: 'Create a rule: its name, how many points (negative for a demerit), who can use it and an optional usage limit per period.',
    },
    {
      route: '/admin/codes',
      target: 'codes-list',
      title: 'Rule list',
      body: 'Edit or delete rules here. Teachers see changes right away.',
    },
    {
      route: '/admin/settings',
      target: 'settings-sections',
      title: 'Settings and oversight',
      body: 'School-wide scoring timer, history moderation with export, teacher statistics, detentions, interventions and the risk registry.',
    },
    {
      route: '/admin/dashboard',
      title: 'All set',
      body: 'When a student drops to 50 points or below, an intervention is created automatically — find it in Settings → Interventions & Alerts. You can replay this tour with the “?” button at the top, or open the full illustrated guide below.',
    },
  ],
};

export const roleKey = (role) => (role === 'superadmin' ? 'admin' : role);
