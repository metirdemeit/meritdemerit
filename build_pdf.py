import sys
import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

def build_pdf():
    pdf_path = "/home/mq/meritdemerit/user_manual.pdf"

    # Register Ubuntu Fonts
    pdfmetrics.registerFont(TTFont('Ubuntu', '/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf'))
    pdfmetrics.registerFont(TTFont('Ubuntu-Bold', '/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf'))
    pdfmetrics.registerFont(TTFont('Ubuntu-Italic', '/usr/share/fonts/truetype/ubuntu/Ubuntu-RI.ttf'))
    pdfmetrics.registerFont(TTFont('Ubuntu-BoldItalic', '/usr/share/fonts/truetype/ubuntu/Ubuntu-BI.ttf'))

    # Color Palette
    PRIMARY = colors.HexColor('#9266FF')
    PRIMARY_DARK = colors.HexColor('#6932EB')
    DARK_BG = colors.HexColor('#0C0B21')
    ACCENT_GREEN = colors.HexColor('#00D377')
    ACCENT_RED = colors.HexColor('#FF5252')
    ACCENT_ORANGE = colors.HexColor('#FF9800')
    TEXT_MAIN = colors.HexColor('#2A2944')
    CARD_BG = colors.HexColor('#F5F3FC')
    WARNING_BG = colors.HexColor('#FFF2F2')

    # Page setup
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=2.0*cm,
        rightMargin=2.0*cm,
        topMargin=2.0*cm,
        bottomMargin=2.0*cm
    )

    styles = getSampleStyleSheet()

    # Custom Paragraph Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Ubuntu-Bold',
        fontSize=28,
        leading=34,
        textColor=PRIMARY,
        alignment=1, # Center
        spaceAfter=15
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Ubuntu-Italic',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#5A5984'),
        alignment=1,
        spaceAfter=30
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Ubuntu-Bold',
        fontSize=18,
        leading=22,
        textColor=PRIMARY_DARK,
        spaceBefore=20,
        spaceAfter=10,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Ubuntu-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#2A2944'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Ubuntu',
        fontSize=10,
        leading=14,
        textColor=TEXT_MAIN,
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Ubuntu',
        fontSize=10,
        leading=14,
        textColor=TEXT_MAIN,
        leftIndent=15,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Ubuntu',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#2A2944')
    )

    story = []

    # --- COVER PAGE ---
    story.append(Spacer(1, 3*cm))
    story.append(Paragraph("MeritDemerit System", title_style))
    story.append(Paragraph("Единая платформа учета дисциплины и успеваемости", subtitle_style))
    story.append(HRFlowable(width="80%", thickness=2, color=PRIMARY, spaceAfter=40))
    
    story.append(Paragraph("<b>РУКОВОДСТВО ПОЛЬЗОВАТЕЛЯ</b>", ParagraphStyle(
        'CoverDocType', fontName='Ubuntu-Bold', fontSize=16, leading=20, alignment=1, textColor=TEXT_MAIN, spaceAfter=30
    )))

    roles_data = [
        [Paragraph("<b>Инструкция предназначена для:</b>", body_style)],
        [Paragraph("• <b>Учеников</b> (Students) — личный кабинет и баланс баллов", bullet_style)],
        [Paragraph("• <b>Учителей</b> (Teachers) — Homeroom дашборд и начисление баллов", bullet_style)],
        [Paragraph("• <b>Администраторов</b> (Admins) — управление пользователями, правилами и отчетами", bullet_style)],
    ]
    t_roles = Table(roles_data, colWidths=[15*cm])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('PADDING', (0,0), (-1,-1), 12),
        ('BOX', (0,0), (-1,-1), 1, PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_roles)

    story.append(Spacer(1, 4*cm))

    meta_text = """
    <font color="#5A5984" size="9">
    <b>Версия системы:</b> 2.4.0 (Production Rollout)<br/>
    <b>Дата обновления:</b> 14 Августа 2026 г.<br/>
    <b>Официальная сборка:</b> Production Verified
    </font>
    """
    story.append(Paragraph(meta_text, ParagraphStyle('Meta', alignment=1, leading=14)))
    story.append(PageBreak())

    # --- SECTION 1: ОБЩИЕ СВЕДЕНИЯ ---
    story.append(Paragraph("1. Общие сведения о системе", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=10))

    story.append(Paragraph(
        "Платформа <b>MeritDemerit System</b> предназначена для комплексной автоматизации учёта академических достижений (Merit) и дисциплинарных замечаний (Demerit) учащихся учебного заведения.",
        body_style
    ))

    story.append(Paragraph("<b>Ключевые концепции балльной системы:</b>", h2_style))
    story.append(Paragraph("• <b>Стартовый баланс:</b> Каждый ученик начинает учебный период с базовым балансом в <b>100 баллов</b>.", bullet_style))
    story.append(Paragraph("• <b>Merit (Поощрения):</b> Баллы за академические успехи, активное участие и дисциплину (+1 ... +50 баллов).", bullet_style))
    story.append(Paragraph("• <b>Demerit (Замечания):</b> Списание баллов за нарушения порядка и правила школы (-1 ... -50 баллов).", bullet_style))

    story.append(Paragraph("<b>Категории статусов и зоны риска:</b>", h2_style))

    table_data = [
        [Paragraph("<b>Зона статуса</b>", body_style), Paragraph("<b>Баллы</b>", body_style), Paragraph("<b>Описание и порядок действий</b>", body_style)],
        [Paragraph("<font color='#00D377'><b>Merit Zone</b></font>", body_style), Paragraph("131+", body_style), Paragraph("Высокие результаты, академические и дисциплинарные поощрения.", body_style)],
        [Paragraph("<b>Standard Zone</b>", body_style), Paragraph("100 – 130", body_style), Paragraph("Нормальный уровень дисциплины и успеваемости.", body_style)],
        [Paragraph("<font color='#FF9800'><b>Warning Zone</b></font>", body_style), Paragraph("41 – 50", body_style), Paragraph("Письменное предупреждение ученику (Formal Warning).", body_style)],
        [Paragraph("<font color='#FF9800'><b>Homeroom Zone</b></font>", body_style), Paragraph("31 – 40", body_style), Paragraph("Разбор ситуации классным руководителем (Homeroom Action).", body_style)],
        [Paragraph("<font color='#FF5252'><b>Counselor Zone</b></font>", body_style), Paragraph("≤ 30", body_style), Paragraph("Обязательный вызов к психологу и директору с родителями.", body_style)],
    ]
    t_status = Table(table_data, colWidths=[4*cm, 3*cm, 9*cm])
    t_status.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ECE8FC')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D1C7F7')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_status)
    story.append(Spacer(1, 15))

    # --- SECTION 2: ДЛЯ УЧЕНИКОВ ---
    story.append(Paragraph("2. Инструкция для Ученика (Student Guide)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=10))

    story.append(Paragraph("<b>1. Вход в систему:</b>", h2_style))
    story.append(Paragraph("Перейдите на страницу авторизации в браузере или Telegram WebApp. Введите выданный <b>Username</b> (например, <i>s_ivanov</i>) и ваш <b>Пароль</b>.", body_style))

    story.append(Paragraph("<b>2. Разделы личного кабинета:</b>", h2_style))
    story.append(Paragraph("• <b>Текущий баланс:</b> Отображается в центре экрана с соответствующей цветовой подсветкой вашей категории статуса.", bullet_style))
    story.append(Paragraph("• <b>My History (История):</b> Полный список всех начислений и списаний баллов с указанием правила, ФИО учителя, комментария и даты.", bullet_style))
    story.append(Paragraph("• <b>Rankings (Рейтинг):</b> Показывает вашу позицию среди одноклассников и учеников параллели.", bullet_style))

    # Callout Box Info
    info_callout = [
        [Paragraph("<b>💡 Совет ученику:</b><br/>Если вы заметите запись в истории, вызывающую вопросы, обратитесь к вашему классному руководителю для уточнения деталей.", callout_style)]
    ]
    t_info = Table(info_callout, colWidths=[16*cm])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F0EBFF')),
        ('BOX', (0,0), (-1,-1), 1, PRIMARY),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(Spacer(1, 5))
    story.append(t_info)
    story.append(Spacer(1, 15))

    # --- SECTION 3: ДЛЯ УЧИТЕЛЕЙ ---
    story.append(Paragraph("3. Инструкция для Учителя (Teacher Guide)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=10))

    story.append(Paragraph("<b>1. Homeroom Dashboard (Дашборд класса):</b>", h2_style))
    story.append(Paragraph("Учитель видит статистику своего закреплённого класса (например, <b>Class 6A</b>): общее количество учеников, средний балл класса, отличников и группу риска (<100 баллов).", body_style))
    story.append(Paragraph("Кнопка <b>Filter Demerit Risk</b> позволяет моментально отфильтровать учеников, требующих внимания.", body_style))

    story.append(Paragraph("<b>2. Процесс выставления баллов (Assign Rules):</b>", h2_style))
    story.append(Paragraph("1. Переключитесь на вкладку <b>My Class</b> (свой класс) или <b>All Classes</b> (любой класс школы).", bullet_style))
    story.append(Paragraph("2. Выберите одного или нескольких учеников, кликнув на их карточки.", bullet_style))
    story.append(Paragraph("3. Выберите нужное правило (Merit или Demerit) из доступных.", bullet_style))
    story.append(Paragraph("4. Введите текстовый комментарий (например: <i>«Победа на олимпиаде»</i>) и нажмите <b>Submit</b>.", bullet_style))

    # Callout Box Warning LimitMD
    warn_callout = [
        [Paragraph("<b>⚠️ Обратите внимание на лимиты правил (LimitMD)!</b><br/>Если при выходе появляется сообщение: <i>«Студент X достиг лимита для правила Y (максимум N раз за период)»</i>, значит у правила установлен лимит применения. Нужно дождаться сброса периода (дня/недели) или выбрать другое правило.", callout_style)]
    ]
    t_warn = Table(warn_callout, colWidths=[16*cm])
    t_warn.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), WARNING_BG),
        ('BOX', (0,0), (-1,-1), 1, ACCENT_RED),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(Spacer(1, 5))
    story.append(t_warn)
    story.append(Spacer(1, 15))

    # --- SECTION 4: ДЛЯ АДМИНИСТРАТОРОВ ---
    story.append(Paragraph("4. Инструкция для Администратора (Admin Guide)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=10))

    story.append(Paragraph("<b>1. Управление пользователями (Users Management):</b>", h2_style))
    story.append(Paragraph("• <b>Add Student / Add Teacher:</b> Создание аккаунтов. Поле логина поддерживает авто-подсказку (<i>f_lastname</i>), а кнопка <b>Generate</b> создает стойкий 8-значный пароль.", body_style))
    story.append(Paragraph("• <b>Классное руководство:</b> При редактировании учителя можно назначить/изменить его закрепленный класс в поле <b>Homeroom Class</b>.", body_style))

    story.append(Paragraph("<b>2. Настройка правил и лимитов (Codes & Rules):</b>", h2_style))
    story.append(Paragraph("• <b>Уровни доступа:</b> <i>All Users</i> (все), <i>Teachers & Admins</i> (учителя), <i>Admin Only 🔒</i> (только админы).", bullet_style))
    story.append(Paragraph("• <b>Лимиты LimitMD:</b> Можно включить макс. применений <i>Max Uses</i> и тип сброса (<i>daily, weekly, monthly, none</i> или <i>until_date</i>).", bullet_style))

    story.append(Paragraph("<b>3. Центр интервенций и отчетов:</b>", h2_style))
    story.append(Paragraph("В разделе <b>Interventions</b> админ отслеживает учеников с падающим баллом (≤50, ≤40, ≤30), ставит отметку <b>Parent Notified</b> и переводит записи в статус <b>Resolved</b>. В разделе <b>Export Data</b> доступна выгрузка статистических файлов за четверти.", body_style))

    story.append(Spacer(1, 15))

    # --- SECTION 5: FAQ ---
    story.append(Paragraph("5. Часто задаваемые вопросы (FAQ)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=10))

    story.append(Paragraph("<b>Q: Что делать, если ученик забыл пароль?</b>", h2_style))
    story.append(Paragraph("A: Администратор может зайти в <i>Users Management</i>, открыть карточку ученика и нажатием кнопки <b>Generate</b> выдать новый пароль.", body_style))

    story.append(Paragraph("<b>Q: Удаляется ли история при сбросе лимита периода?</b>", h2_style))
    story.append(Paragraph("A: Нет. История хранится бессрочно. Сбрасывается только окно подсчета баллов за новый временной период.", body_style))

    story.append(Paragraph("<b>Q: Как сменить классного руководителя?</b>", h2_style))
    story.append(Paragraph("A: Откройте <i>Users Management -> Teachers</i>, отредактируйте поле <i>Homeroom Class</i> нужного преподавателя.", body_style))

    # Footer generator
    def add_page_number(canvas, doc):
        canvas.saveState()
        canvas.setFont('Ubuntu', 9)
        canvas.setFillColor(colors.HexColor('#5A5984'))
        if doc.page > 1:
            canvas.drawString(2.0*cm, 28.0*cm, "MeritDemerit System — Руководство пользователя")
            canvas.setStrokeColor(PRIMARY)
            canvas.setLineWidth(0.5)
            canvas.line(2.0*cm, 27.8*cm, 19.0*cm, 27.8*cm)
            
            page_text = f"Страница {doc.page}"
            canvas.drawRightString(19.0*cm, 1.2*cm, page_text)
        canvas.restoreState()

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print("PDF generated successfully at:", pdf_path)

if __name__ == '__main__':
    build_pdf()
