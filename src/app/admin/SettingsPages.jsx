import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Grid,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import {
  Delete,
  Settings,
  Assessment,
  History,
  TrendingUp,
  Person,
  FilterList,
  FilterListOff,
  Search,
  CalendarToday,
  Clear,
  FileDownload,
  TableChart,
  Timer,
  NotificationsActive,
  Report,
  AlarmOn,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import { useCommonStore } from '../../store/commonStore';
import toast from 'react-hot-toast';
import DetentionManager from './components/DetentionManager';
import InterventionsManager from './components/InterventionsManager';
import RiskRegistryPage from './RiskRegistryPage';
import ScoringDeadlineManager from './components/ScoringDeadlineManager';
import DeleteConfirmationDialog from '../components/dialogs/DeleteConfirmationDialog';
import AssignmentTable from '../components/AssignmentTable';
import TeachersStatTable from '../components/TeachersStatTable';
import CommonRankingTable from '../components/CommonRankingTable';

const parseFilterDate = (value, endOfDay = false) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return date;
};

export function SettingsPages() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuthStore();
  const {
    history,
    loadingHistoryFull,
    totalHistoryCount,
    fetchHistory,
    deleteHistoryRecord,
    downloadHistoryHtml,
    downloadHistoryCsv,
    rankings,
    fetchAdminRanking,
    teacherStats,
    fetchTeacherStats,
    teachers,
    fetchTeachers,
  } = useAdminStore();
  const { students, fetchStudents, classes, fetchClasses } = useCommonStore();

  useEffect(() => {
    fetchTeachers();
    fetchStudents();
    fetchClasses();
  }, [fetchTeachers, fetchStudents, fetchClasses]);

  const studentOptions = useMemo(() => {
    const set = new Set();
    (history || []).forEach((item) => {
      if (item.student_name) set.add(item.student_name);
    });
    (students || []).forEach((s) => {
      const name = `${s.first_name || ''} ${s.last_name || ''}`.trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [history, students]);

  const teacherOptions = useMemo(() => {
    const set = new Set();
    (history || []).forEach((item) => {
      if (item.teacher_name) set.add(item.teacher_name);
    });
    (teachers || []).forEach((t) => {
      const name = `${t.first_name || ''} ${t.last_name || ''}`.trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [history, teachers]);

  const classOptions = useMemo(() => {
    const set = new Set();
    (history || []).forEach((item) => {
      const cls = item.student_class || item.class_name;
      if (cls) set.add(cls);
    });
    (classes || []).forEach((c) => {
      if (c.name) set.add(c.name);
    });
    return Array.from(set).sort();
  }, [history, classes]);

  const [activeTab, setActiveTab] = useState('moderation');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [exportingHistory, setExportingHistory] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorHistory, setErrorHistory] = useState(null);
  const [errorStats, setErrorStats] = useState(null);

  // Фильтры истории
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    student: '',
    schoolClass: '',
    teacher: '',
    rule: '',
    type: 'all', // 'all', 'merit', 'demerit'
  });
  const [exportFilters, setExportFilters] = useState(filters);

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      student: '',
      schoolClass: '',
      teacher: '',
      rule: '',
      type: 'all',
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.student.trim()) count++;
    if (filters.schoolClass.trim()) count++;
    if (filters.teacher.trim()) count++;
    if (filters.rule.trim()) count++;
    if (filters.type !== 'all') count++;
    return count;
  }, [filters]);

  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      setErrorHistory(null);
      const data = await fetchHistory();
      if (!data) {
        setErrorHistory('Failed to load history');
      }
      setLoadingHistory(false);
    };
    loadHistory();
  }, [fetchHistory]);

  const handleModeration = async () => {
    setActiveTab('moderation');
    setLoadingHistory(true);
    setErrorHistory(null);
    const data = await fetchHistory();
    if (!data) {
      setErrorHistory('Failed to load history');
    }
    setLoadingHistory(false);
  };

  const handleStatistics = async () => {
    setActiveTab('statistics');
    setLoadingStats(true);
    setErrorStats(null);
    const [stats, ranks] = await Promise.all([
      fetchTeacherStats(),
      fetchAdminRanking(),
    ]);
    if (!stats) {
      setErrorStats('Failed to load teacher statistics');
    } else if (!ranks) {
      setErrorStats('Failed to load rankings');
    }
    setLoadingStats(false);
  };

  const handleDeleteRecord = (record) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedRecord) {
      try {
        await deleteHistoryRecord(selectedRecord.id);
        toast.success('Record deleted');
        const data = await fetchHistory();
        if (!data) {
          setErrorHistory('Failed to reload history');
        }
      } catch {
        toast.error('Failed to delete record');
      } finally {
        setDeleteDialogOpen(false);
        setSelectedRecord(null);
      }
    }
  };

  const openExportDialog = () => {
    setExportFilters(filters);
    setExportDialogOpen(true);
  };

  const resetExportFilters = () => {
    setExportFilters({
      startDate: '',
      endDate: '',
      student: '',
      schoolClass: '',
      teacher: '',
      rule: '',
      type: 'all',
    });
  };

  const getItemDateString = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const filterHistoryItems = (items = [], criteria = {}) => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => {
      if (criteria.student?.trim() && !item.student_name?.toLowerCase().includes(criteria.student.trim().toLowerCase())) {
        return false;
      }
      if (criteria.schoolClass?.trim()) {
        const className = (item.student_class || item.class_name || '').toLowerCase();
        if (!className.includes(criteria.schoolClass.trim().toLowerCase())) return false;
      }
      if (criteria.teacher?.trim() && !item.teacher_name?.toLowerCase().includes(criteria.teacher.trim().toLowerCase())) {
        return false;
      }
      if (criteria.rule?.trim() && !item.rule_description?.toLowerCase().includes(criteria.rule.trim().toLowerCase())) {
        return false;
      }
      if (criteria.startDate) {
        const itemDateStr = getItemDateString(item.created_at);
        if (itemDateStr && itemDateStr < criteria.startDate) return false;
      }
      if (criteria.endDate) {
        const itemDateStr = getItemDateString(item.created_at);
        if (itemDateStr && itemDateStr > criteria.endDate) return false;
      }
      if (criteria.type === 'merit' && (item.points_changed || 0) <= 0) return false;
      if (criteria.type === 'demerit' && (item.points_changed || 0) >= 0) return false;

      return true;
    });
  };

  const ensureFullHistory = async () => {
    const store = useAdminStore.getState();
    if (store.loadingHistoryFull || (store.totalHistoryCount > 0 && store.history.length < store.totalHistoryCount) || !store.history.length) {
      toast.loading('Загрузка полной истории школы...', { id: 'history-fetch-toast' });
      await fetchHistory();
      toast.dismiss('history-fetch-toast');
    }
  };

  const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const generateHistoryHtmlReport = (items = [], criteria = {}) => {
    const generatedAt = new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const totalCount = items.length;
    let meritsCount = 0;
    let meritsPoints = 0;
    let demeritsCount = 0;
    let demeritsPoints = 0;

    items.forEach((item) => {
      const pts = Number(item.points_changed || 0);
      if (pts > 0) {
        meritsCount += 1;
        meritsPoints += pts;
      } else if (pts < 0) {
        demeritsCount += 1;
        demeritsPoints += pts;
      }
    });

    const netBalance = meritsPoints + demeritsPoints;

    const activeFilters = [];
    if (criteria.student?.trim()) activeFilters.push(`Ученик: ${escapeHtml(criteria.student.trim())}`);
    if (criteria.schoolClass?.trim()) activeFilters.push(`Класс: ${escapeHtml(criteria.schoolClass.trim())}`);
    if (criteria.teacher?.trim()) activeFilters.push(`Учитель/Админ: ${escapeHtml(criteria.teacher.trim())}`);
    if (criteria.rule?.trim()) activeFilters.push(`Правило: ${escapeHtml(criteria.rule.trim())}`);
    if (criteria.startDate) activeFilters.push(`От: ${escapeHtml(criteria.startDate)}`);
    if (criteria.endDate) activeFilters.push(`До: ${escapeHtml(criteria.endDate)}`);
    if (criteria.type && criteria.type !== 'all') {
      activeFilters.push(`Тип: ${criteria.type === 'merit' ? 'Только Merit (+)' : 'Только Demerit (-)'}`);
    }

    const filtersHtml = activeFilters.length > 0
      ? `<div class="filters-box"><strong>Примененные фильтры:</strong> ${activeFilters.map(f => `<span class="filter-tag">${f}</span>`).join(' ')}</div>`
      : `<div class="filters-box"><strong>Фильтры:</strong> <span class="filter-tag">Вся история школы (без ограничений)</span></div>`;

    const rowsHtml = items.map((item, idx) => {
      const isMerit = (item.points_changed || 0) > 0;
      const isDemerit = (item.points_changed || 0) < 0;
      const typeLabel = isMerit ? 'Merit' : isDemerit ? 'Demerit' : 'Neutral';
      const typeClass = isMerit ? 'badge-merit' : isDemerit ? 'badge-demerit' : 'badge-neutral';
      const pointsFormatted = isMerit ? `+${item.points_changed}` : `${item.points_changed || 0}`;
      const dateFormatted = item.created_at ? new Date(item.created_at).toLocaleString('ru-RU') : '-';

      return `
        <tr>
          <td class="col-num">${idx + 1}</td>
          <td class="col-date">${escapeHtml(dateFormatted)}</td>
          <td class="col-student"><strong>${escapeHtml(item.student_name || '-')}</strong></td>
          <td class="col-class">${escapeHtml(item.student_class || item.class_name || '-')}</td>
          <td class="col-teacher">${escapeHtml(item.teacher_name || '-')}</td>
          <td class="col-type"><span class="badge ${typeClass}">${typeLabel}</span></td>
          <td class="col-points ${typeClass}-text">${pointsFormatted}</td>
          <td class="col-rule">${escapeHtml(item.rule_description || '-')}</td>
          <td class="col-comment">${escapeHtml(item.comment || '')}</td>
        </tr>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MeritDemerit — Отчет по истории баллов</title>
  <style>
    :root {
      --bg: #0F0E26;
      --card-bg: #1A1935;
      --text: #F4F4FF;
      --text-muted: #9E9DB5;
      --border: rgba(146, 102, 255, 0.25);
      --merit: #10B981;
      --demerit: #EF4444;
      --primary: #9266FF;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      padding: 32px 24px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--border);
      padding-bottom: 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header h1 {
      font-size: 26px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: -0.5px;
    }
    .header p {
      color: var(--text-muted);
      font-size: 14px;
      margin-top: 4px;
    }
    .meta-box {
      text-align: right;
      font-size: 13px;
      color: var(--text-muted);
    }
    .meta-box strong { color: var(--text); }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
    }
    .stat-title {
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 800;
      color: #FFFFFF;
    }
    .stat-sub {
      font-size: 12px;
      margin-top: 4px;
      color: var(--text-muted);
    }
    .filters-box {
      background: rgba(146, 102, 255, 0.08);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 13px;
      margin-bottom: 24px;
      color: var(--text-muted);
    }
    .filter-tag {
      display: inline-block;
      background: rgba(146, 102, 255, 0.25);
      color: #FFFFFF;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 12px;
      margin: 2px 4px 2px 0;
      border: 1px solid rgba(146, 102, 255, 0.4);
    }
    .table-container {
      overflow-x: auto;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    th {
      background: rgba(146, 102, 255, 0.15);
      color: #D6D5E6;
      font-weight: 700;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    td {
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: var(--text);
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(146, 102, 255, 0.05); }
    .col-num { width: 40px; color: var(--text-muted); text-align: center; }
    .col-date { white-space: nowrap; font-size: 12px; color: var(--text-muted); }
    .col-points { font-weight: 800; font-size: 14px; white-space: nowrap; }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-merit { background: rgba(16, 185, 129, 0.18); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.35); }
    .badge-demerit { background: rgba(239, 68, 68, 0.18); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.35); }
    .badge-neutral { background: rgba(107, 114, 128, 0.18); color: #9CA3AF; border: 1px solid rgba(107, 114, 128, 0.35); }
    .badge-merit-text { color: #10B981; }
    .badge-demerit-text { color: #EF4444; }
    .footer {
      margin-top: 32px;
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
    }
    @media print {
      body { background: #FFFFFF; color: #111827; padding: 12px; }
      .header { border-bottom: 2px solid #E5E7EB; }
      .header h1 { color: #111827; }
      .header p, .meta-box { color: #4B5563; }
      .stat-card { background: #F9FAFB; border: 1px solid #E5E7EB; }
      .stat-title { color: #6B7280; }
      .stat-value { color: #111827; }
      .filters-box { background: #F3F4F6; border: 1px solid #E5E7EB; color: #374151; }
      .filter-tag { background: #E5E7EB; color: #111827; border: 1px solid #D1D5DB; }
      .table-container { background: #FFFFFF; border: 1px solid #E5E7EB; }
      th { background: #F3F4F6; color: #111827; border-bottom: 2px solid #E5E7EB; }
      td { border-bottom: 1px solid #E5E7EB; color: #1F2937; }
      .badge-merit { background: #D1FAE5; color: #065F46; border: none; }
      .badge-demerit { background: #FEE2E2; color: #991B1B; border: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>MeritDemerit System</h1>
      <p>Полный отчет по истории начисления и списания баллов</p>
    </div>
    <div class="meta-box">
      <div>Сгенерировано: <strong>${generatedAt}</strong></div>
      <div>Всего записей: <strong>${totalCount}</strong></div>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-title">Всего записей</div>
      <div class="stat-value">${totalCount}</div>
      <div class="stat-sub">в текущем отчете</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">Поощрения (Merit)</div>
      <div class="stat-value" style="color: #10B981;">+${meritsPoints} б.</div>
      <div class="stat-sub">${meritsCount} начислений</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">Замечания (Demerit)</div>
      <div class="stat-value" style="color: #EF4444;">${demeritsPoints} б.</div>
      <div class="stat-sub">${demeritsCount} взысканий</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">Итоговый баланс</div>
      <div class="stat-value" style="color: ${netBalance >= 0 ? '#10B981' : '#EF4444'};">
        ${netBalance > 0 ? `+${netBalance}` : netBalance} б.
      </div>
      <div class="stat-sub">нетто за период</div>
    </div>
  </div>

  ${filtersHtml}

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Дата и время</th>
          <th>Ученик</th>
          <th>Класс</th>
          <th>Учитель / Администратор</th>
          <th>Тип</th>
          <th>Баллы</th>
          <th>Правило / Причина</th>
          <th>Комментарий</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="9" style="text-align:center; padding: 32px; color: var(--text-muted);">Нет записей по заданным фильтрам</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="footer">
    Сгенерировано системой MeritDemerit System · Единый реестр школы
  </div>
</body>
</html>`;
  };

  const handleDownloadHistoryHtml = async () => {
    setExportingHistory(true);
    try {
      await ensureFullHistory();
      const currentFullHistory = useAdminStore.getState().history || [];
      const itemsToExport = filterHistoryItems(currentFullHistory, exportFilters);

      let blob = null;
      try {
        const remoteBlob = await downloadHistoryHtml(exportFilters);
        if (remoteBlob instanceof Blob && remoteBlob.type && !remoteBlob.type.includes('json') && remoteBlob.size > 200) {
          blob = remoteBlob;
        }
      } catch {
        // Fallback to client-side generator
      }

      if (!blob) {
        const htmlContent = generateHistoryHtmlReport(itemsToExport, exportFilters);
        blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      }

      const filename = `students-points-history-${new Date().toISOString().slice(0, 10)}.html`;
      const file = new File([blob], filename, { type: 'text/html' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Students Points History',
        });
        toast.success(`HTML экспортирован (${itemsToExport.length} записей)`);
        setExportDialogOpen(false);
        return;
      }

      const url = URL.createObjectURL(blob);
      const isDesktopWebView = /Electron|WebView|Telegram|TWA|desktop/i.test(navigator.userAgent || '') || !!window?.ReactNativeWebView;

      if (isDesktopWebView) {
        const newTab = window.open('', '_blank', 'noopener,noreferrer');
        if (newTab) {
          newTab.location.href = url;
        } else {
          window.location.href = url;
        }
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.rel = 'noopener';
        link.style.display = 'none';
        document.body.appendChild(link);

        try {
          link.click();
        } catch {
          window.open(url, '_blank', 'noopener,noreferrer');
        }

        link.remove();
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success(`HTML скачан (${itemsToExport.length} записей)`);
      setExportDialogOpen(false);
    } catch (err) {
      if (import.meta.env.DEV) console.error('handleDownloadHistoryHtml error', err);
      toast.error('Не удалось скачать историю');
    } finally {
      setExportingHistory(false);
    }
  };

  const handleDownloadHistoryCsv = async (customFilters = exportFilters) => {
    setExportingHistory(true);
    try {
      await ensureFullHistory();
      const currentFullHistory = useAdminStore.getState().history || [];
      const itemsToExport = filterHistoryItems(currentFullHistory, customFilters);

      let blob = null;
      try {
        const remoteBlob = await downloadHistoryCsv(customFilters);
        if (remoteBlob instanceof Blob && remoteBlob.type && !remoteBlob.type.includes('json') && remoteBlob.size > 100) {
          blob = remoteBlob;
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Backend CSV export endpoint fallback', e);
      }

      if (!(blob instanceof Blob)) {
        const headers = ['ID', 'Date', 'Student', 'Class', 'Teacher/Admin', 'Type', 'Points', 'Rule', 'Comment'];
        const rows = (itemsToExport || []).map((item) => [
          item.id,
          item.created_at ? new Date(item.created_at).toLocaleString('ru-RU') : '',
          `"${(item.student_name || '').replace(/"/g, '""')}"`,
          `"${(item.student_class || item.class_name || '').replace(/"/g, '""')}"`,
          `"${(item.teacher_name || '').replace(/"/g, '""')}"`,
          (item.points_changed || 0) > 0 ? 'Merit' : (item.points_changed || 0) < 0 ? 'Demerit' : 'Neutral',
          item.points_changed || 0,
          `"${(item.rule_description || '').replace(/"/g, '""')}"`,
          `"${(item.comment || '').replace(/"/g, '""')}"`,
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      }

      const filename = `students-points-history-${new Date().toISOString().slice(0, 10)}.csv`;
      const file = new File([blob], filename, { type: 'text/csv' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Students Points History CSV',
        });
        toast.success(`CSV экспортирован (${itemsToExport.length} записей)`);
        setExportDialogOpen(false);
        return;
      }

      const url = URL.createObjectURL(blob);
      const isDesktopWebView = /Electron|WebView|Telegram|TWA|desktop/i.test(navigator.userAgent || '') || !!window?.ReactNativeWebView;

      if (isDesktopWebView) {
        const newTab = window.open('', '_blank', 'noopener,noreferrer');
        if (newTab) {
          newTab.location.href = url;
        } else {
          window.location.href = url;
        }
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.rel = 'noopener';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success(`CSV скачан (${itemsToExport.length} записей)`);
      setExportDialogOpen(false);
    } catch (err) {
      if (import.meta.env.DEV) console.error('handleDownloadHistoryCsv error', err);
      toast.error('Не удалось скачать CSV');
    } finally {
      setExportingHistory(false);
    }
  };

  // Фильтрация истории
  const filteredHistory = useMemo(() => {
    return filterHistoryItems(history, filters);
  }, [history, filters]);

  // Модульные кнопки настроек
  const navTabs = [
    { id: 'scoring_deadline', label: 'Scoring Timer & Deadline', icon: <AlarmOn />, action: () => setActiveTab('scoring_deadline') },
    { id: 'moderation', label: 'Moderation', icon: <History />, action: handleModeration },
    { id: 'statistics', label: 'Statistics', icon: <Assessment />, action: handleStatistics },
    { id: 'detention', label: 'Detention Management', icon: <Timer />, action: () => setActiveTab('detention') },
    { id: 'interventions', label: 'Interventions & Alerts', icon: <NotificationsActive />, action: () => setActiveTab('interventions') },
    { id: 'risk', label: 'Risk Registry & Re-enrollment', icon: <Report />, action: () => setActiveTab('risk') },
  ];

  return (
    <Box sx={{ minHeight: '100vh', pb: 4 }}>
      {/* Header Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4a1d63 0%, #343355 50%, #4a1d63 100%)',
          backdropFilter: 'blur(50px)',
          boxShadow: '0 20px 100px #4a1d63',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          p: 2,
          pt: 'calc(var(--tg-safe-area-inset-top, 0px) + 80px)',
          pb: 2,
          mt: 0,
          mb: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" alignItems="center">
            <Settings sx={{ fontSize: 32, color: '#9266FF', mr: 2 }} />
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                Settings & Analytics
              </Typography>
              <Typography variant="body2" sx={{ color: '#5A5984' }}>
                Moderation, stats and administrative tools
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: 2 }}>
        {/* Модульные вкладки навигации (вертикальный стек) */}
        <Grid container spacing={1.5} direction="column" sx={{ mb: 2 }}>
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Grid item xs={12} key={tab.id}>
                <Button
                  fullWidth
                  variant={isActive ? 'contained' : 'outlined'}
                  startIcon={tab.icon}
                  onClick={tab.action}
                  sx={{
                    height: 50,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    px: 2.5,
                    ...(isActive
                      ? {
                          background: 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
                          color: '#FFFFFF',
                          boxShadow: '0 4px 14px rgba(146, 102, 255, 0.4)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #8152FF 0%, #5824DB 100%)',
                          },
                        }
                      : {
                          borderColor: 'rgba(146, 102, 255, 0.4)',
                          color: '#F4F4FF',
                          backgroundColor: 'rgba(146, 102, 255, 0.05)',
                          '&:hover': {
                            borderColor: '#9266FF',
                            backgroundColor: 'rgba(146, 102, 255, 0.15)',
                          },
                        }),
                  }}
                >
                  {tab.label}
                </Button>
              </Grid>
            );
          })}
        </Grid>
        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <Card
            sx={{
              background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              border: '1px solid rgba(146, 102, 255, 0.2)',
              mt: 2,
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Points History Moderation ({filteredHistory.length} / {totalHistoryCount || history?.length || 0})
                  </Typography>
                  {loadingHistoryFull && (
                    <Chip
                      size="small"
                      icon={<CircularProgress size={12} sx={{ color: '#9266FF' }} />}
                      label="Loading full history..."
                      sx={{
                        backgroundColor: 'rgba(146, 102, 255, 0.15)',
                        color: '#C7C6E2',
                        border: '1px solid rgba(146, 102, 255, 0.3)',
                        fontSize: '0.75rem',
                      }}
                    />
                  )}
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={<FileDownload />}
                    onClick={openExportDialog}
                    disabled={exportingHistory}
                    sx={{
                      color: '#9266FF',
                      borderColor: 'rgba(146,102,255,0.4)',
                      textTransform: 'none',
                      minWidth: 80,
                    }}
                    variant="outlined"
                  >
                    Экспорт
                  </Button>
                  <Button
                    size="small"
                    startIcon={<FilterList />}
                    onClick={() => setShowFilters(!showFilters)}
                    sx={{
                      color: activeFilterCount > 0 ? '#00D377' : '#9266FF',
                      borderColor: activeFilterCount > 0 ? 'rgba(0,211,119,0.4)' : 'rgba(146,102,255,0.4)',
                      textTransform: 'none',
                    }}
                    variant="outlined"
                  >
                    Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                  </Button>
                </Stack>
              </Box>

              {/* Панель интерактивных фильтров */}
              <Collapse in={showFilters}>
                <Box
                  sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: 'rgba(146, 102, 255, 0.06)',
                    border: '1px solid rgba(146, 102, 255, 0.18)',
                  }}
                >
                  <Grid container spacing={1.5}>
                    {/* Фильтр по студенту */}
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        freeSolo
                        options={studentOptions}
                        value={filters.student}
                        onChange={(e, newValue) => setFilters({ ...filters, student: newValue || '' })}
                        onInputChange={(e, newValue) => setFilters({ ...filters, student: newValue || '' })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            size="small"
                            label="Student Name"
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={filterFieldStyle}
                          />
                        )}
                      />
                    </Grid>

                    {/* Фильтр по классу */}
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        freeSolo
                        options={classOptions}
                        value={filters.schoolClass}
                        onChange={(e, newValue) => setFilters({ ...filters, schoolClass: newValue || '' })}
                        onInputChange={(e, newValue) => setFilters({ ...filters, schoolClass: newValue || '' })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            size="small"
                            label="Class / Grade (e.g. 9A)"
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={filterFieldStyle}
                          />
                        )}
                      />
                    </Grid>

                    {/* Фильтр по учителю */}
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        freeSolo
                        options={teacherOptions}
                        value={filters.teacher}
                        onChange={(e, newValue) => setFilters({ ...filters, teacher: newValue || '' })}
                        onInputChange={(e, newValue) => setFilters({ ...filters, teacher: newValue || '' })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            size="small"
                            label="Teacher / Admin"
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={filterFieldStyle}
                          />
                        )}
                      />
                    </Grid>

                    {/* Фильтр по правилу */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Rule Description"
                        value={filters.rule}
                        onChange={(e) => setFilters({ ...filters, rule: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={filterFieldStyle}
                      />
                    </Grid>

                    {/* Тип баллов */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: '#5A5984' }}>Type</InputLabel>
                        <Select
                          value={filters.type}
                          label="Type"
                          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                          sx={{
                            color: '#F4F4FF',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(146, 102, 255, 0.3)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(146, 102, 255, 0.5)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#9266FF' },
                          }}
                        >
                          <MenuItem value="all">All Types</MenuItem>
                          <MenuItem value="merit">Merit (+ Points)</MenuItem>
                          <MenuItem value="demerit">Demerit (- Points)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Дата От */}
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="From Date"
                        InputLabelProps={{ shrink: true }}
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        sx={filterFieldStyle}
                      />
                    </Grid>

                    {/* Дата До */}
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="To Date"
                        InputLabelProps={{ shrink: true }}
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        sx={filterFieldStyle}
                      />
                    </Grid>
                  </Grid>

                  {/* Кнопка сброса */}
                  {activeFilterCount > 0 && (
                    <Box display="flex" justifyContent="flex-end" mt={1.5}>
                      <Button
                        size="small"
                        startIcon={<Clear />}
                        onClick={resetFilters}
                        sx={{ color: '#EB2B4B', textTransform: 'none' }}
                      >
                        Reset Filters
                      </Button>
                    </Box>
                  )}
                </Box>
              </Collapse>

              {errorHistory && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorHistory}
                </Alert>
              )}

              {loadingHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#9266FF' }} />
                </Box>
              ) : !filteredHistory || filteredHistory.length === 0 ? (
                <Box textAlign="center" py={3}>
                  <History sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                  <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                    {activeFilterCount > 0 ? 'No records match selected filters' : 'No history records found'}
                  </Typography>
                </Box>
              ) : (
                <AssignmentTable 
                  assignments={filteredHistory} 
                  onDelete={handleDeleteRecord}
                  isLoading={loadingHistory}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <Box sx={{ mt: 2 }}>
            {/* Teacher Statistics */}
            <Card
              sx={{
                background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(146, 102, 255, 0.2)',
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                  Teacher Statistics ({teacherStats?.length || 0})
                </Typography>
                {errorStats && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errorStats}
                  </Alert>
                )}
                {loadingStats ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: '#9266FF' }} />
                  </Box>
                ) : !teacherStats || teacherStats.length === 0 ? (
                  <Box textAlign="center" py={3}>
                    <Person sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                    <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                      Teacher statistics unavailable
                    </Typography>
                  </Box>
                ) : (
                  <TeachersStatTable teachersStats={teacherStats} />
                )}
              </CardContent>
            </Card>

            {/* Rankings */}
            <Card
              sx={{
                background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(146, 102, 255, 0.2)',
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                  Student Rankings ({rankings?.length || 0})
                </Typography>
                {loadingStats ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: '#9266FF' }} />
                  </Box>
                ) : !rankings || rankings.length === 0 ? (
                  <Box textAlign="center" py={3}>
                    <TrendingUp sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                    <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                      Rankings unavailable
                    </Typography>
                  </Box>
                ) : (
                  <CommonRankingTable rankings={rankings} />
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Scoring Timer & Deadline Tab */}
        {activeTab === 'scoring_deadline' && <ScoringDeadlineManager />}

        {/* Detention Management Tab */}
        {activeTab === 'detention' && <DetentionManager />}

        {/* Interventions & Alerts Tab */}
        {activeTab === 'interventions' && <InterventionsManager />}

        {/* Risk Registry & Re-enrollment Tab */}
        {activeTab === 'risk' && <RiskRegistryPage />}
      </Container>

      <Dialog
        open={exportDialogOpen}
        onClose={() => !exportingHistory && setExportDialogOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 100%)',
            border: '1px solid rgba(146, 102, 255, 0.25)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700, pb: 1 }}>
          Export History Data
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Grid container spacing={1.5} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={studentOptions}
                value={exportFilters.student}
                onChange={(e, newValue) => setExportFilters({ ...exportFilters, student: newValue || '' })}
                onInputChange={(e, newValue) => setExportFilters({ ...exportFilters, student: newValue || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    label="Student Name"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={filterFieldStyle}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={classOptions}
                value={exportFilters.schoolClass || ''}
                onChange={(e, newValue) => setExportFilters({ ...exportFilters, schoolClass: newValue || '' })}
                onInputChange={(e, newValue) => setExportFilters({ ...exportFilters, schoolClass: newValue || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    label="Class / Grade (e.g. 9A)"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={filterFieldStyle}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={teacherOptions}
                value={exportFilters.teacher}
                onChange={(e, newValue) => setExportFilters({ ...exportFilters, teacher: newValue || '' })}
                onInputChange={(e, newValue) => setExportFilters({ ...exportFilters, teacher: newValue || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    label="Teacher / Admin"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={filterFieldStyle}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Rule Description"
                value={exportFilters.rule}
                onChange={(e) => setExportFilters({ ...exportFilters, rule: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={filterFieldStyle}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#5A5984' }}>Type</InputLabel>
                <Select
                  value={exportFilters.type}
                  label="Type"
                  onChange={(e) => setExportFilters({ ...exportFilters, type: e.target.value })}
                  sx={selectFieldStyle}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="merit">Merit (+ Points)</MenuItem>
                  <MenuItem value="demerit">Demerit (- Points)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From Date"
                InputLabelProps={{ shrink: true }}
                value={exportFilters.startDate}
                onChange={(e) => setExportFilters({ ...exportFilters, startDate: e.target.value })}
                sx={filterFieldStyle}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To Date"
                InputLabelProps={{ shrink: true }}
                value={exportFilters.endDate}
                onChange={(e) => setExportFilters({ ...exportFilters, endDate: e.target.value })}
                sx={filterFieldStyle}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0, gap: 1, flexWrap: 'wrap' }}>
          <Button
            onClick={resetExportFilters}
            disabled={exportingHistory}
            sx={{ color: '#EB2B4B', textTransform: 'none', mr: 'auto' }}
          >
            Сбросить
          </Button>
          <Button
            onClick={() => setExportDialogOpen(false)}
            disabled={exportingHistory}
            sx={{ color: '#B8B7D9', textTransform: 'none' }}
          >
            Отмена
          </Button>
          <Button
            onClick={() => handleDownloadHistoryCsv(exportFilters)}
            disabled={exportingHistory}
            startIcon={exportingHistory ? <CircularProgress size={16} color="inherit" /> : <TableChart />}
            variant="outlined"
            sx={{
              borderColor: 'rgba(0, 211, 119, 0.4)',
              color: '#00D377',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#00D377',
                backgroundColor: 'rgba(0, 211, 119, 0.1)',
              },
            }}
          >
            Скачать CSV
          </Button>
          <Button
            onClick={handleDownloadHistoryHtml}
            disabled={exportingHistory}
            startIcon={exportingHistory ? <CircularProgress size={16} color="inherit" /> : <FileDownload />}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
              color: '#F4F4FF',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #A880FF 0%, #7942F5 100%)',
              },
            }}
          >
            Скачать HTML
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Record"
        message="Are you sure you want to delete this history record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </Box>
  );
}

const filterFieldStyle = {
  '& .MuiOutlinedInput-root': {
    color: '#F4F4FF',
    '& fieldset': {
      borderColor: 'rgba(146, 102, 255, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(146, 102, 255, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#9266FF',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#5A5984',
  },
};

const selectFieldStyle = {
  color: '#F4F4FF',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(146, 102, 255, 0.3)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(146, 102, 255, 0.5)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#9266FF' },
};
