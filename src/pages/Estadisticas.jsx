import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import ExcelJS from 'exceljs';
import logopases from '../assets/logopases.png';
import { API_ENDPOINTS, PASES_GOOGLE_CALENDAR_ID, apiCall } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const ACTION_TYPES = ['Ataque', 'Recepción', 'Bloqueo', 'Armada', 'Saque'];
const ACTION_RESULTS = ['EXITOSO', 'FALLIDO'];
const STORAGE_KEY = 'estadisticas_acciones_v1';

const normalizeUserName = (user) => user.nickname || user.name || user.email || 'Sin nombre';

const toBase64 = (arrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return window.btoa(binary);
};

const formatEventDate = (event) => {
  const rawDate = event?.start?.dateTime || event?.start?.date;
  if (!rawDate) return 'Sin fecha';
  const date = new Date(rawDate);
  return date.toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getEventDate = (event) => {
  const rawDate = event?.start?.dateTime || event?.start?.date;
  if (!rawDate) return null;
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const createEmptyActionCounter = () => ({
  Ataque: { successful: 0, total: 0 },
  Recepción: { successful: 0, total: 0 },
  Bloqueo: { successful: 0, total: 0 },
  Armada: { successful: 0, total: 0 },
  Saque: { successful: 0, total: 0 },
});

const formatActionStat = (successful, total) => {
  if (total === 0) return '0/0 (0%)';
  const percentage = Math.round((successful / total) * 100);
  return `${successful}/${total} (${percentage}%)`;
};

const sanitizeFileName = (value) => {
  if (!value) return 'Sin nombre';
  return value
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const getImageDimensions = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => {
    resolve({
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    });
  };
  image.onerror = () => reject(new Error('No se pudo leer el tamano del logo'));
  image.src = src;
});

const Estadisticas = () => {
  const { authenticatedApiCall } = useAuth();

  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('');
  const [selectedResult, setSelectedResult] = useState('');
  const [hasInitializedMatch, setHasInitializedMatch] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setActions(parsed);
      }
    } catch (e) {
      console.error('No se pudieron cargar acciones locales:', e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  }, [actions]);

  useEffect(() => {
    // Evitar limpiar al primer render.
    if (!hasInitializedMatch) {
      setHasInitializedMatch(true);
      return;
    }

    // Al cambiar partido, limpiar acciones y cache local.
    setActions([]);
    localStorage.removeItem(STORAGE_KEY);
  }, [selectedMatchId, hasInitializedMatch]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError('');

        // Misma estrategia que Ranking: consulta con fechas definidas en endpoint.
        const year = new Date().getFullYear();
        const startDate = `${year}-03-20`;
        const endDate = `${year}-06-20`;
        const eventosEndpoint = `${API_ENDPOINTS.EVENTOS(PASES_GOOGLE_CALENDAR_ID)}?start_date=${startDate}&end_date=${endDate}`;

        const [usersResponse, eventsResponse] = await Promise.all([
          authenticatedApiCall('/admin/users', { method: 'GET' }),
          apiCall(eventosEndpoint),
        ]);

        const usersData = await usersResponse.json();
        const eventsData = await eventsResponse.json();

        const ligaOrienteUsers = (usersData.users || [])
          .filter((user) => user?.tipo_eventos?.includes('oriente'))
          .sort((a, b) => normalizeUserName(a).localeCompare(normalizeUserName(b), 'es', { sensitivity: 'base' }));

        const rawEvents = eventsData.items || eventsData || [];
        const orienteMatches = rawEvents
          .filter((event) => {
            const eventDate = getEventDate(event);
            if (!eventDate) return false;
            if (!event?.summary?.toUpperCase()?.includes('ORIENTE')) return false;
            return true;
          })
          .sort((a, b) => {
            const dateA = getEventDate(a);
            const dateB = getEventDate(b);
            return dateA - dateB;
          });

        setUsers(ligaOrienteUsers);
        setMatches(orienteMatches);
      } catch (err) {
        console.error('Error cargando datos de estadisticas:', err);
        setError('No se pudieron cargar usuarios o partidos. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [authenticatedApiCall]);

  const actionsByUser = useMemo(() => {
    return actions.reduce((acc, action) => {
      const key = action.userName;
      if (!acc[key]) {
        acc[key] = {
          total: 0,
          exitosas: 0,
          fallidas: 0,
          ataque: 0,
          recepcion: 0,
          bloqueo: 0,
          armada: 0,
          saque: 0,
        };
      }

      acc[key].total += 1;
      if (action.result === 'EXITOSO') acc[key].exitosas += 1;
      if (action.result === 'FALLIDO') acc[key].fallidas += 1;

      if (action.actionType === 'Ataque') acc[key].ataque += 1;
      if (action.actionType === 'Recepción') acc[key].recepcion += 1;
      if (action.actionType === 'Bloqueo') acc[key].bloqueo += 1;
      if (action.actionType === 'Armada') acc[key].armada += 1;
      if (action.actionType === 'Saque') acc[key].saque += 1;

      return acc;
    }, {});
  }, [actions]);

  const playerActionStats = useMemo(() => {
    const grouped = actions.reduce((acc, action) => {
      if (!acc[action.userName]) {
        acc[action.userName] = createEmptyActionCounter();
      }

      if (acc[action.userName][action.actionType]) {
        acc[action.userName][action.actionType].total += 1;
        if (action.result === 'EXITOSO') {
          acc[action.userName][action.actionType].successful += 1;
        }
      }

      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([playerName, stats]) => ({ playerName, stats }))
      .sort((a, b) => a.playerName.localeCompare(b.playerName, 'es', { sensitivity: 'base' }));
  }, [actions]);

  const teamTotals = useMemo(() => {
    const totals = createEmptyActionCounter();
    actions.forEach((action) => {
      if (!totals[action.actionType]) return;
      totals[action.actionType].total += 1;
      if (action.result === 'EXITOSO') {
        totals[action.actionType].successful += 1;
      }
    });
    return totals;
  }, [actions]);

  const isRegisterEnabled = Boolean(selectedUserId && selectedMatchId && selectedActionType && selectedResult);

  const handleRegisterAction = () => {
    const selectedUser = users.find((user) => user._id === selectedUserId);
    const selectedMatch = matches.find((match) => match.id === selectedMatchId);
    if (!selectedUser || !selectedMatch) return;

    const newAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: selectedUser._id,
      userName: normalizeUserName(selectedUser),
      matchId: selectedMatch.id,
      matchName: selectedMatch.summary || 'Partido sin nombre',
      matchDate: selectedMatch.start?.dateTime || selectedMatch.start?.date || '',
      actionType: selectedActionType,
      result: selectedResult,
    };

    setActions((prev) => [newAction, ...prev]);
    setSelectedActionType('');
    setSelectedResult('');
  };

  const handleDownloadExcel = async () => {
    try {
      setSaving(true);

      const workbook = new ExcelJS.Workbook();
      const selectedMatch = matches.find((match) => match.id === selectedMatchId);
      const selectedMatchName = selectedMatch?.summary || 'Sin partido seleccionado';
      const excelTitle = `Estadísticas Partido ${selectedMatchName}`;
      const safeSheetName = excelTitle.length > 31 ? excelTitle.slice(0, 31) : excelTitle;
      const sheet = workbook.addWorksheet(safeSheetName);

      const imageResponse = await fetch(logopases);
      const imageBuffer = await imageResponse.arrayBuffer();
      const logoDimensions = await getImageDimensions(logopases);
      const imageId = workbook.addImage({
        base64: `data:image/png;base64,${toBase64(imageBuffer)}`,
        extension: 'png',
      });

      // Ajustar el logo dentro de una caja maxima manteniendo proporcion.
      const maxWidth = 180;
      const maxHeight = 90;
      const widthRatio = maxWidth / logoDimensions.width;
      const heightRatio = maxHeight / logoDimensions.height;
      const scale = Math.min(widthRatio, heightRatio);
      const renderWidth = Math.round(logoDimensions.width * scale);
      const renderHeight = Math.round(logoDimensions.height * scale);

      sheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: renderWidth, height: renderHeight },
      });

      sheet.getCell('A6').value = excelTitle;
      sheet.getCell('A6').font = { bold: true, size: 20 };
      sheet.addRow([]);

      const header = sheet.addRow([
        'Jugador(a)',
        'Ataque',
        'Recepción',
        'Bloqueo',
        'Armada',
        'Saque',
        'TOTAL PARTIDO',
      ]);
      header.font = { bold: true, size: 16 };

      playerActionStats.forEach(({ playerName, stats }) => {
        const playerTotalSuccessful =
          stats.Ataque.successful +
          stats.Recepción.successful +
          stats.Bloqueo.successful +
          stats.Armada.successful +
          stats.Saque.successful;
        const playerTotalActions =
          stats.Ataque.total +
          stats.Recepción.total +
          stats.Bloqueo.total +
          stats.Armada.total +
          stats.Saque.total;

        sheet.addRow([
          playerName,
          formatActionStat(stats.Ataque.successful, stats.Ataque.total),
          formatActionStat(stats.Recepción.successful, stats.Recepción.total),
          formatActionStat(stats.Bloqueo.successful, stats.Bloqueo.total),
          formatActionStat(stats.Armada.successful, stats.Armada.total),
          formatActionStat(stats.Saque.successful, stats.Saque.total),
          formatActionStat(playerTotalSuccessful, playerTotalActions),
        ]);
      });

      const teamTotalSuccessful =
        teamTotals.Ataque.successful +
        teamTotals.Recepción.successful +
        teamTotals.Bloqueo.successful +
        teamTotals.Armada.successful +
        teamTotals.Saque.successful;
      const teamTotalActions =
        teamTotals.Ataque.total +
        teamTotals.Recepción.total +
        teamTotals.Bloqueo.total +
        teamTotals.Armada.total +
        teamTotals.Saque.total;

      const totalsRow = sheet.addRow([
        'Totales equipo',
        formatActionStat(teamTotals.Ataque.successful, teamTotals.Ataque.total),
        formatActionStat(teamTotals.Recepción.successful, teamTotals.Recepción.total),
        formatActionStat(teamTotals.Bloqueo.successful, teamTotals.Bloqueo.total),
        formatActionStat(teamTotals.Armada.successful, teamTotals.Armada.total),
        formatActionStat(teamTotals.Saque.successful, teamTotals.Saque.total),
        formatActionStat(teamTotalSuccessful, teamTotalActions),
      ]);
      totalsRow.font = { bold: true, size: 16 };

      sheet.columns = [
        { width: 26 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 22 },
      ];

      // Aumentar el tamano base de tipografia para toda la hoja.
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          const currentFont = cell.font || {};
          cell.font = {
            ...currentFont,
            size: currentFont.size || 14,
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const matchDate = selectedMatch
        ? new Date(selectedMatch.start?.dateTime || selectedMatch.start?.date || Date.now())
          .toLocaleDateString('es-CL')
        : new Date().toLocaleDateString('es-CL');
      const matchNameForFile = sanitizeFileName(selectedMatchName);
      const dateForFile = sanitizeFileName(matchDate);
      link.download = `Estadísticas ${matchNameForFile} - ${dateForFile}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando Excel:', err);
      setError('No se pudo generar el Excel. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Estadisticas
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Registra acciones por jugador para partidos de Liga Oriente.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Registrar accion
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="match-select-label">Partido</InputLabel>
          <Select
            labelId="match-select-label"
            value={selectedMatchId}
            label="Partido"
            onChange={(e) => setSelectedMatchId(e.target.value)}
          >
            {matches.map((match) => (
              <MenuItem key={match.id} value={match.id}>
                {`${match.summary || 'Partido'} - ${formatEventDate(match)}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Jugadores Liga Oriente
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 1,
            mb: 2,
          }}
        >
          {users.map((user) => {
            const userLabel = normalizeUserName(user);
            const isSelected = selectedUserId === user._id;

            return (
              <Button
                key={user._id}
                variant={isSelected ? 'contained' : 'outlined'}
                onClick={() => setSelectedUserId(user._id)}
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                {userLabel}
              </Button>
            );
          })}
        </Box>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Tipo de accion
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 1,
            mb: 2,
          }}
        >
          {ACTION_TYPES.map((action) => (
            <Button
              key={action}
              variant={selectedActionType === action ? 'contained' : 'outlined'}
              onClick={() => setSelectedActionType(action)}
              sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
            >
              {action}
            </Button>
          ))}
        </Box>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Resultado
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: 'repeat(2, minmax(0, 1fr))',
            },
            gap: 1,
            mb: 2,
          }}
        >
          {ACTION_RESULTS.map((result) => (
            <Button
              key={result}
              variant={selectedResult === result ? 'contained' : 'outlined'}
              color={result === 'EXITOSO' ? 'success' : 'error'}
              onClick={() => setSelectedResult(result)}
              sx={{ textTransform: 'none' }}
            >
              {result}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleRegisterAction}
            disabled={!isRegisterEnabled}
          >
            REGISTRAR ACCION
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadExcel}
            disabled={actions.length === 0 || saving}
          >
            {saving ? 'Generando...' : 'Descargar Excel'}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Totalizadores por usuario
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {Object.entries(actionsByUser).map(([userName, totals]) => (
            <Chip
              key={userName}
              label={`${userName}: ${totals.total} (${totals.exitosas} exitosas / ${totals.fallidas} fallidas)`}
              color="primary"
              variant="outlined"
            />
          ))}
          {Object.keys(actionsByUser).length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Aun no hay acciones registradas.
            </Typography>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Acciones registradas
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Jugador(a)</TableCell>
                <TableCell>Ataque</TableCell>
                <TableCell>Recepción</TableCell>
                <TableCell>Bloqueo</TableCell>
                <TableCell>Armada</TableCell>
                <TableCell>Saque</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {playerActionStats.map(({ playerName, stats }) => (
                <TableRow key={playerName}>
                  <TableCell>{playerName}</TableCell>
                  <TableCell>{formatActionStat(stats.Ataque.successful, stats.Ataque.total)}</TableCell>
                  <TableCell>{formatActionStat(stats.Recepción.successful, stats.Recepción.total)}</TableCell>
                  <TableCell>{formatActionStat(stats.Bloqueo.successful, stats.Bloqueo.total)}</TableCell>
                  <TableCell>{formatActionStat(stats.Armada.successful, stats.Armada.total)}</TableCell>
                  <TableCell>{formatActionStat(stats.Saque.successful, stats.Saque.total)}</TableCell>
                </TableRow>
              ))}
              {playerActionStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">
                      Sin acciones registradas.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {playerActionStats.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Totales equipo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {formatActionStat(teamTotals.Ataque.successful, teamTotals.Ataque.total)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {formatActionStat(teamTotals.Recepción.successful, teamTotals.Recepción.total)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {formatActionStat(teamTotals.Bloqueo.successful, teamTotals.Bloqueo.total)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {formatActionStat(teamTotals.Armada.successful, teamTotals.Armada.total)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {formatActionStat(teamTotals.Saque.successful, teamTotals.Saque.total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Estadisticas;
