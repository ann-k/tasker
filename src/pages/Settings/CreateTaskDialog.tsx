import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';

const CreateTaskDialog = ({
  open,
  onClose,
  onConfirm,
  selectedDuration,
  onDurationSelect,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedDuration: string;
  onDurationSelect: (duration: string) => void;
  mode: 'create' | 'edit';
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Создать новую задачу' : 'Задать длительность'}
      </DialogTitle>
      <DialogContent>
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ mb: 2 }}>
            Выберите длительность задачи:
          </FormLabel>
          <RadioGroup value={selectedDuration} onChange={(e) => onDurationSelect(e.target.value)}>
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
              <FormControlLabel
                key={duration}
                value={duration}
                control={<Radio />}
                label={duration}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={onConfirm} variant="contained" autoFocus>
          {mode === 'create' ? 'Создать' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTaskDialog;
