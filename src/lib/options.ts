// Este archivo centraliza las opciones para los selects y otros controles.

// Opciones para el género de los modelos
export const genderOptions = [
  { value: 'Female', label: 'Femenino' },
  { value: 'Male', label: 'Masculino' },
  // CORRECCIÓN: Se actualiza 'Other' por 'Non-binary' para coincidir con el tipo.
  { value: 'Non-binary', label: 'No binario' },
];

// Opciones para el estado del modelo en la agencia
export const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'archived', label: 'Archivado' },
];

// Opciones para el color de ojos
export const eyeColorOptions = [
  { value: 'Café claro', label: 'Café claro' },
  { value: 'Café oscuro', label: 'Café oscuro' },
  { value: 'Miel', label: 'Miel' },
  { value: 'Verde', label: 'Verde' },
  { value: 'Azul', label: 'Azul' },
  { value: 'Gris', label: 'Gris' },
  { value: 'Ámbar', label: 'Ámbar' },
  { value: 'Otro', label: 'Otro' },
];

// Opciones para el color de cabello
export const hairColorOptions = [
  { value: 'Castaño', label: 'Castaño' },
  { value: 'Negro', label: 'Negro' },
  { value: 'Rubio', label: 'Rubio' },
  { value: 'Rojizo', label: 'Rojizo' },
  { value: 'Gris', label: 'Gris' },
  { value: 'Blanco', label: 'Blanco' },
  { value: 'Teñido / Fantasía', label: 'Teñido / Fantasía' },
  { value: 'Otro', label: 'Otro' },
];

// Opciones para tallas superiores
export const topSizeOptions = [
  { value: 'XXS', label: 'XXS' },
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXL', label: 'XXL' },
];