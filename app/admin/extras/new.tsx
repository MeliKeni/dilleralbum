import { router } from 'expo-router';
import { useEffect } from 'react';

// Reutiliza el formulario de nueva figurita con is_extra=true por defecto
// Redirige a la pantalla de nueva figurita
export default function NewExtraScreen() {
  useEffect(() => {
    router.replace('/admin/stickers/new');
  }, []);
  return null;
}
