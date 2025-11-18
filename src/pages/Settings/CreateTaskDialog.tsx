import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2,
  Typography,
} from '@mui/material';

const DurationButton = ({
  duration,
  selectedDuration,
  onSelect,
}: {
  duration: string;
  selectedDuration: string;
  onSelect: (duration: string) => void;
}) => {
  return (
    <Grid2 size={6}>
      <Button
        fullWidth
        variant={selectedDuration === duration ? 'contained' : 'outlined'}
        onClick={() => onSelect(duration)}
        sx={{ textTransform: 'none' }}
      >
        {duration}
      </Button>
    </Grid2>
  );
};

const CreateTaskDialog = ({
  open,
  onClose,
  onConfirm,
  selectedDuration,
  onDurationSelect,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedDuration: string;
  onDurationSelect: (duration: string) => void;
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Создать новую задачу</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>Выберите длительность задачи:</Typography>

        <Grid2 container spacing={1}>
          {[
            '1 минута',
            '3 минуты',
            '5 минут',
            '10 минут',
            '15 минут',
            '20 минут',
            '25 минут',
            '30 минут',
            '1 час',
            '2 часа',
            '3 часа',
            '4 часа',
          ].map((duration) => (
            <DurationButton
              key={duration}
              duration={duration}
              selectedDuration={selectedDuration}
              onSelect={onDurationSelect}
            />
          ))}
        </Grid2>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={onConfirm} variant="contained" autoFocus>
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTaskDialog;
