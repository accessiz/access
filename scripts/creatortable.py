import pandas as pd
import os
import re

def normalize_name(name):
    """Convierte un nombre a formato Title Case de forma inteligente."""
    if pd.isna(name):
        return ""
    # Maneja preposiciones y artículos comunes en español para que queden en minúsculas
    name_lower = str(name).lower()
    words = []
    for word in name_lower.split():
        if word in ['de', 'del', 'la', 'las', 'los', 'y']:
            words.append(word)
        else:
            words.append(word.capitalize())
    return ' '.join(words).strip()

def normalize_phone_number(phone, nationality):
    """Convierte un número de teléfono al formato E.164 (+502xxxxxxxx)."""
    if pd.isna(phone):
        return ""
    # Elimina todo excepto números y el signo '+'
    cleaned_phone = re.sub(r'[^\d+]', '', str(phone))
    
    if nationality == 'Guatemalteca':
        # Si es de GT, tiene 8 dígitos y no tiene prefijo, se lo añadimos
        if len(cleaned_phone) == 8 and not cleaned_phone.startswith('+'):
            return f"+502{cleaned_phone}"
    
    # Si ya empieza con '+', se asume que está bien formateado
    if cleaned_phone.startswith('+'):
        return cleaned_phone
        
    # Para otros casos, simplemente devolvemos el número limpio (puede requerir revisión manual)
    return cleaned_phone

def clean_numeric_value(value):
    """Extrae el primer número válido de un string y lo convierte a float."""
    if pd.isna(value):
        return None
    match = re.search(r'(\d+\.?\d*)', str(value))
    return float(match.group(1)) if match else None

def normalize_text_column(series):
    """Normaliza una columna de texto a mayúsculas, limpia los rangos y quita espacios."""
    if series is None:
        return series
    series_str = series.astype(str).str.strip().str.upper()
    series_str = series_str.str.replace(r'\s*-\s*', '-', regex=True)
    return series_str.replace('NAN', '').replace('NONE', '')

def get_column_by_keyword(df, keywords):
    """Encuentra la primera columna en el DataFrame que coincide con una lista de palabras clave."""
    for col in df.columns:
        col_cleaned = col.lower().strip().replace('-', '').replace('_', '')
        for keyword in keywords:
            if keyword in col_cleaned:
                return df[col]
    return pd.Series([None] * len(df))

def clean_and_transform_data(df, nationality):
    """Limpia y transforma un DataFrame de modelos para que coincida con la estructura de Supabase."""
    
    data = {
        'full_name': get_column_by_keyword(df, ['nombre']),
        'alias': get_column_by_keyword(df, ['alias']),
        'birth_date': get_column_by_keyword(df, ['fecha', 'nacimiento']),
        'height_cm': get_column_by_keyword(df, ['estatura']),
        'shoulders_cm': get_column_by_keyword(df, ['hombros', 'espalda']),
        'chest_cm': get_column_by_keyword(df, ['pecho']),
        'bust_cm': get_column_by_keyword(df, ['busto']),
        'waist_cm': get_column_by_keyword(df, ['cintura']),
        'hips_cm': get_column_by_keyword(df, ['cadera']),
        'top_size': get_column_by_keyword(df, ['blusa', 'playera']),
        'pants_size': get_column_by_keyword(df, ['pantalon']),
    'shoe_size_us': get_column_by_keyword(df, ['zapato']),
        'email': get_column_by_keyword(df, ['correo', 'email']),
        'instagram': get_column_by_keyword(df, ['instagram']),
        'tiktok': get_column_by_keyword(df, ['tiktok']),
        'phone_number': get_column_by_keyword(df, ['telefono']),
        'national_id': get_column_by_keyword(df, ['dpi', 'dui']),
    }
    
    clean_df = pd.DataFrame(data)
    
    # --- Aplicar Estandarización ---
    clean_df['full_name'] = clean_df['full_name'].apply(normalize_name)
    clean_df['alias'] = clean_df['alias'].apply(normalize_name)
    clean_df['phone_number'] = clean_df.apply(lambda row: normalize_phone_number(row['phone_number'], nationality), axis=1)

    # Crear alias si está vacío
    clean_df['alias'] = clean_df.apply(
        lambda row: row['full_name'].split()[0] + ' ' + row['full_name'].split()[-1] if row['full_name'] and not row['alias'] else row['alias'],
        axis=1
    )

    numeric_cols = ['height_cm', 'shoulders_cm', 'chest_cm', 'bust_cm', 'waist_cm', 'hips_cm', 'shoe_size_us']
    for col in numeric_cols:
        clean_df[col] = clean_df[col].apply(clean_numeric_value)
        if col == 'height_cm':
            clean_df.loc[clean_df['height_cm'] < 10, 'height_cm'] *= 100

    for col in ['top_size', 'pants_size']:
        clean_df[col] = normalize_text_column(clean_df[col])

    for col in ['instagram', 'tiktok', 'national_id']:
        clean_df[col] = clean_df[col].astype(str).str.replace('@', '', regex=False).str.strip()
        clean_df[col] = clean_df[col].replace({'nan': '', 'MENOR DE EDAD': ''}, regex=False)

    clean_df['birth_date'] = pd.to_datetime(clean_df['birth_date'], errors='coerce').dt.strftime('%Y-%m-%d')
    clean_df['birth_date'] = clean_df['birth_date'].replace({pd.NaT: None, 'NaT': None})

    clean_df['nationality'] = nationality
    clean_df['status'] = 'active'
    
    final_columns = [
        'alias', 'full_name', 'national_id', 'status', 'gender', 'birth_date', 'nationality',
        'height_cm', 'shoulders_cm', 'chest_cm', 'bust_cm', 'waist_cm', 'hips_cm',
    'top_size', 'pants_size', 'shoe_size_us', 'eye_color', 'hair_color',
        'instagram', 'tiktok', 'email', 'phone_number', 'date_joined_agency'
    ]
    
    return clean_df.reindex(columns=final_columns)

def main():
    try:
        downloads_path = os.path.join(os.path.expanduser('~'), 'Downloads')
        excel_file_path = os.path.join(downloads_path, 'LISTADO GENERAL IZ.xlsx')

        if not os.path.exists(excel_file_path):
            print(f"❌ Error: No se encontró el archivo '{excel_file_path}'.")
            return
            
        print(f"✅ Archivo Excel encontrado: {excel_file_path}")

        xls = pd.ExcelFile(excel_file_path)
        sheets_to_process = {
            'LISTADO GENERAL GT': 'Guatemalteca',
            'LISTADO GENERAL SV': 'Salvadoreña',
            'LISTADO GENERAL CR': 'Costarricense'
        }
        
        all_models_df = pd.DataFrame()
        
        for sheet_name, nationality in sheets_to_process.items():
            if sheet_name in xls.sheet_names:
                print(f"📄 Procesando hoja: '{sheet_name}'...")
                df = pd.read_excel(xls, sheet_name=sheet_name, dtype=str)
                df.dropna(subset=[df.columns[0]], how='all', inplace=True)
                
                if not df.empty:
                    clean_df = clean_and_transform_data(df, nationality)
                    all_models_df = pd.concat([all_models_df, clean_df], ignore_index=True)
        
        all_models_df.dropna(subset=['full_name'], inplace=True)
        
        output_path = os.path.join(downloads_path, 'models_database_final.csv')
        all_models_df.to_csv(output_path, index=False, encoding='utf-8')
        
        print("\n🎉 ¡Proceso completado con éxito!")
        print(f"📊 Se procesaron un total de {len(all_models_df)} modelos.")
        print(f"💾 Tu archivo CSV limpio y estandarizado ha sido guardado en: {output_path}")

    except Exception as e:
        print(f"\n❌ Ocurrió un error inesperado: {e}")

if __name__ == '__main__':
    main()