// Este archivo centraliza las opciones para los selects y otros controles.

// Opciones para el género de los modelos
export const genderOptions = [
  { value: 'Female', label: 'Femenino' },
  { value: 'Male', label: 'Masculino' },
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

// Opciones para tallas de pantalón masculinas (US/Internacional)
// Incluye tallas regulares y extendidas
export const malePantsSizeOptions = [
  { value: '28', label: '28' },
  { value: '29', label: '29' },
  { value: '30', label: '30' },
  { value: '31', label: '31' },
  { value: '32', label: '32' },
  { value: '33', label: '33' },
  { value: '34', label: '34' },
  { value: '36', label: '36' },
  { value: '38', label: '38' },
  { value: '40', label: '40' },
  { value: '42', label: '42' },
  { value: '44', label: '44' },
];

// Opciones para tallas de pantalón femeninas (US)
// Incluye tallas regulares y curvy/plus size pero muestra solo números
export const femalePantsSizeOptions = [
  { value: '0', label: '0' },
  { value: '2', label: '2' },
  { value: '4', label: '4' },
  { value: '6', label: '6' },
  { value: '8', label: '8' },
  { value: '10', label: '10' },
  { value: '12', label: '12' },
  { value: '14', label: '14' },
  { value: '16', label: '16' },
  { value: '18', label: '18' },
  { value: '20', label: '20' },
  { value: '22', label: '22' },
  { value: '24', label: '24' },
];