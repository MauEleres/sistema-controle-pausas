import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  PlayArrow as PlayIcon, 
  Stop as StopIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = 'http://localhost:5000/api';

interface PauseType {
  id: number;
  name: string;
  description: string;
  maxDuration: number;
}

interface ActivePause {
  id: number;
  startTime: string;
  pauseTypeId: number;
  status: string;
  PauseType: {
    name: string;
    maxDuration: number;
  };
}

const AtendenteDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pauseTypes, setPauseTypes] = useState<PauseType[]>([]);
  const [activePause, setActivePause] = useState<ActivePause | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estado para o diálogo de iniciar pausa
  const [openStartDialog, setOpenStartDialog] = useState(false);
  const [selectedPauseType, setSelectedPauseType] = useState<number | ''>('');
  const [pauseNotes, setPauseNotes] = useState('');
  
  // Estado para o diálogo de finalizar pausa
  const [openEndDialog, setOpenEndDialog] = useState(false);
  const [endNotes, setEndNotes] = useState('');
  
  // Tempo decorrido da pausa atual
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Buscar tipos de pausa e verificar se há pausa ativa
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar tipos de pausa
        const typesResponse = await axios.get(`${API_URL}/pauses/types`);
        setPauseTypes(typesResponse.data.pauseTypes);
        
        // Verificar se há pausa ativa
        const historyResponse = await axios.get(`${API_URL}/pauses/history?status=em_andamento`);
        const activePauses = historyResponse.data.pauseHistory;
        
        if (activePauses && activePauses.length > 0) {
          setActivePause(activePauses[0]);
        }
        
        setLoading(false);
      } catch (err: any) {
        setError('Erro ao carregar dados: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Atualizar o tempo decorrido da pausa ativa
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activePause) {
      interval = setInterval(() => {
        const startTime = new Date(activePause.startTime).getTime();
        const currentTime = new Date().getTime();
        const elapsed = Math.floor((currentTime - startTime) / (1000 * 60)); // em minutos
        setElapsedTime(elapsed);
      }, 60000); // Atualizar a cada minuto
      
      // Calcular o tempo inicial
      const startTime = new Date(activePause.startTime).getTime();
      const currentTime = new Date().getTime();
      const elapsed = Math.floor((currentTime - startTime) / (1000 * 60)); // em minutos
      setElapsedTime(elapsed);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activePause]);
  
  // Manipuladores para o diálogo de iniciar pausa
  const handleOpenStartDialog = () => {
    setOpenStartDialog(true);
  };
  
  const handleCloseStartDialog = () => {
    setOpenStartDialog(false);
    setSelectedPauseType('');
    setPauseNotes('');
  };
  
  // Manipuladores para o diálogo de finalizar pausa
  const handleOpenEndDialog = () => {
    setOpenEndDialog(true);
  };
  
  const handleCloseEndDialog = () => {
    setOpenEndDialog(false);
    setEndNotes('');
  };
  
  // Iniciar uma pausa
  const handleStartPause = async () => {
    if (selectedPauseType === '') {
      setError('Por favor, selecione um tipo de pausa');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await axios.post(`${API_URL}/pauses/start`, {
        pauseTypeId: selectedPauseType,
        notes: pauseNotes
      });
      
      setActivePause(response.data.pauseRecord);
      setSuccess('Pausa iniciada com sucesso!');
      handleCloseStartDialog();
      
      // Limpar a mensagem de sucesso após 5 segundos
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      
      setLoading(false);
    } catch (err: any) {
      setError('Erro ao iniciar pausa: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };
  
  // Finalizar uma pausa
  const handleEndPause = async () => {
    if (!activePause) return;
    
    try {
      setLoading(true);
      
      const response = await axios.post(`${API_URL}/pauses/end/${activePause.id}`, {
        notes: endNotes
      });
      
      setActivePause(null);
      setElapsedTime(0);
      setSuccess('Pausa finalizada com sucesso!');
      handleCloseEndDialog();
      
      // Limpar a mensagem de sucesso após 5 segundos
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      
      setLoading(false);
    } catch (err: any) {
      setError('Erro ao finalizar pausa: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };
  
  // Verificar se a pausa atual excedeu o tempo máximo
  const isOvertime = activePause && activePause.PauseType.maxDuration && elapsedTime > activePause.PauseType.maxDuration;
  
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard do Atendente
      </Typography>
      
      <Typography variant="h6" gutterBottom>
        Bem-vindo(a), {user?.name}!
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Status Atual
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : activePause ? (
              <Card variant="outlined" sx={{ mb: 2, bgcolor: isOvertime ? '#fff8e1' : 'inherit' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" color="primary">
                      Em Pausa
                    </Typography>
                    <Chip 
                      icon={<TimeIcon />} 
                      label={`${elapsedTime} min`} 
                      color={isOvertime ? "warning" : "primary"} 
                    />
                  </Box>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Tipo:</strong> {activePause.PauseType.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Início:</strong> {new Date(activePause.startTime).toLocaleString()}
                  </Typography>
                  
                  {activePause.PauseType.maxDuration && (
                    <Typography variant="body2" color={isOvertime ? "error" : "text.secondary"}>
                      <strong>Duração máxima:</strong> {activePause.PauseType.maxDuration} min
                      {isOvertime && " (Excedido)"}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    startIcon={<StopIcon />}
                    onClick={handleOpenEndDialog}
                    fullWidth
                  >
                    Finalizar Pausa
                  </Button>
                </CardActions>
              </Card>
            ) : (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Disponível
                  </Typography>
                  <Typography variant="body1">
                    Você não está em pausa no momento.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<PlayIcon />}
                    onClick={handleOpenStartDialog}
                    fullWidth
                  >
                    Iniciar Pausa
                  </Button>
                </CardActions>
              </Card>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Tipos de Pausa Disponíveis
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : pauseTypes.length > 0 ? (
              <Grid container spacing={2}>
                {pauseTypes.map((type) => (
                  <Grid item xs={12} key={type.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" color="primary" gutterBottom>
                          {type.name}
                        </Typography>
                        
                        {type.description && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {type.description}
                          </Typography>
                        )}
                        
                        {type.maxDuration && (
                          <Typography variant="body2">
                            <strong>Duração máxima:</strong> {type.maxDuration} minutos
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" color="text.secondary">
                Nenhum tipo de pausa disponível.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Diálogo para iniciar pausa */}
      <Dialog open={openStartDialog} onClose={handleCloseStartDialog}>
        <DialogTitle>Iniciar Pausa</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Selecione o tipo de pausa que deseja iniciar:
          </DialogContentText>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="pause-type-label">Tipo de Pausa</InputLabel>
            <Select
              labelId="pause-type-label"
              value={selectedPauseType}
              label="Tipo de Pausa"
              onChange={(e) => setSelectedPauseType(e.target.value as number)}
            >
              {pauseTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name} {type.maxDuration ? `(Máx: ${type.maxDuration} min)` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Observações (opcional)"
            multiline
            rows={3}
            fullWidth
            value={pauseNotes}
            onChange={(e) => setPauseNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStartDialog}>Cancelar</Button>
          <Button 
            onClick={handleStartPause} 
            variant="contained" 
            color="primary"
            disabled={loading || selectedPauseType === ''}
          >
            {loading ? <CircularProgress size={24} /> : 'Iniciar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para finalizar pausa */}
      <Dialog open={openEndDialog} onClose={handleCloseEndDialog}>
        <DialogTitle>Finalizar Pausa</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Deseja finalizar sua pausa atual?
          </DialogContentText>
          
          <TextField
            label="Observações (opcional)"
            multiline
            rows={3}
            fullWidth
            value={endNotes}
            onChange={(e) => setEndNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEndDialog}>Cancelar</Button>
          <Button 
            onClick={handleEndPause} 
            variant="contained" 
            color="secondary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Finalizar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AtendenteDashboard;
