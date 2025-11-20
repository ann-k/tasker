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

import { DURATION_OPTIONS } from './duration';

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
        {mode === 'create' ? 'Создать новую задачу' : 'Поменять длительность'}
      </DialogTitle>
      <DialogContent>
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ mb: 2 }}>
            Выберите длительность задачи:
          </FormLabel>
          <RadioGroup value={selectedDuration} onChange={(e) => onDurationSelect(e.target.value)}>
            {DURATION_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.label}
                value={option.label}
                control={<Radio />}
                label={option.label}
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
