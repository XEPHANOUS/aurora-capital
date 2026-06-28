import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSubmit: (value: string) => Promise<void> | void;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    await onSubmit(trimmed);
    setValue('');
  };

  return (
    <div className="border-t border-border/60 p-4 sm:p-5 bg-background/20 space-y-3">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void submit();
          }
        }}
        placeholder="Escribe tu consulta... Usa @director, @riesgo, @tecnico o pregunta sin mención para consenso global."
        className="min-h-[90px] resize-none bg-background/60"
        disabled={disabled}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Enter para enviar, Shift+Enter para nueva linea</p>
        <Button onClick={() => void submit()} disabled={disabled || !value.trim()}>
          {disabled ? 'Analizando...' : 'Enviar'}
        </Button>
      </div>
    </div>
  );
}
