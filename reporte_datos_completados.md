# Reporte de Datos Completados: Actualización Manual de Perfiles Incompletos

**Fecha de Actualización Manual:** 2 de junio de 2026 (Hora local)
**Origen de Datos:** `LISTADO GENERAL IZ.xlsx - LISTADO GENERAL SV.csv` (El Salvador)

Se realizó una revisión manual de los perfiles incompletos solicitados por el usuario en base a los nuevos listados de El Salvador (SV) y Costa Rica (CR), logrando emparejar y actualizar 4 de ellos de forma segura y no destructiva:

### 1. Fernando Navarro (id: `ee158c45-bc49-4090-bde0-a23264bc188c`)
*   **Completitud:** subió de **14%** a **30%**.
*   **Campos Completados:**
    *   `full_name`: `'Fernando Jose Navarro Machuca'` (Estaba como 'Fernando ')
    *   `national_id` (DUI): `'06660363-8'`
    *   `phone_e164`: `'+50371027978'`

### 2. Grace Hasbun (id: `18be6041-bc8c-4890-8ca8-ce35f82eac4f`)
*   **Completitud:** subió de **28%** a **87%**.
*   **Campos Completados:**
    *   `email`: `'gracehasbunb@gmail.com'`
    *   `phone_e164`: `'+447787031011'`
    *   `height_cm`: `167`
    *   `shoulders_cm`: `33`
    *   `bust_cm`: `84.5`
    *   `waist_cm`: `65`
    *   `hips_cm`: `93`
    *   `top_size`: `'S'`
    *   `pants_size`: `'2'`
    *   `shoe_size_us`: `7.25`
    *   `instagram`: `'gracielahasbun'`

### 3. Gabriel Portillo (id: `51c81b42-5346-41f4-a12b-48726bfae131`)
*   **Completitud:** subió de **30%** a **87%**.
*   **Campos Completados:**
    *   `country`: `'El Salvador'` (Estaba vacío)
    *   `birth_date`: `'2005-07-27'`
    *   `national_id`: `'W1889310'`
    *   `height_cm`: `175`
    *   `shoulders_cm`: `46`
    *   `chest_cm`: `83`
    *   `waist_cm`: `73`
    *   `hips_cm`: `92`
    *   `top_size`: `'S'`
    *   `pants_size`: `'29-30'`
    *   `shoe_size_us`: `9`
    *   `instagram`: `'gabriel_portilloo'`
    *   `tiktok`: `'gabe_portilloo'`

### 4. Brandon Lee (id: `aa858117-d536-4085-be00-ccc37d3b3631`)
*   **Completitud:** subió de **30%** a **75%**.
*   **Campos Completados:**
    *   `birth_date`: `'2002-08-08'`
    *   `national_id` (DUI): `'064022496'`
    *   `height_cm`: `173`
    *   `top_size`: `'M'`
    *   `pants_size`: `'30 - 32'`
    *   `shoe_size_us`: `8.5`
    *   `instagram`: `'088brandonlee'`
    *   `tiktok`: `'Brandonlee1023'`

### 5. Melissa Morales (id: `e18be7cd-6146-4c27-a8b5-e5199efd190d`)
*   **Estado:** No se encontraron coincidencias en los archivos CSV de Guatemala (GT), El Salvador (SV) o Costa Rica (CR).
*   **Nota de Auditoría:** El número de teléfono registrado de Melissa Morales (`+50588844736`) corresponde a **Nicaragua** (código de país `+505`). Al no contar con un documento CSV correspondiente a Nicaragua en el proyecto, su perfil no ha podido ser completado mediante esta migración.

---

# Reporte de Datos Completados de Modelos

Este documento detalla la auditoría y actualización del listado de modelos de Supabase utilizando los datos provenientes de `LISTADO GENERAL IZ.xlsx - LISTADO GENERAL GT.csv`. La carga ha sido realizada con **priorización de los modelos más incompletos** y verificación estricta de identidades.

*   **Fecha de Ejecución:** 2/6/2026, 6:30:17 p. m. (Hora de Guatemala)
*   **Total de Modelos en la Base de Datos:** 364
*   **Total de Registros en el CSV:** 318
*   **Modelos Coincidentes Encontrados (Seguros):** 310
*   **Campos Vacíos que se Completaron:** 228

## Resumen de Campos Completados

| Campo en DB | Cantidad de Registros Completados | Descripción |
| :--- | :--- | :--- |
| `full_name` | **4** | Datos importados desde el listado general CSV |
| `birth_date` | **4** | Datos importados desde el listado general CSV |
| `national_id` | **25** | Datos importados desde el listado general CSV |
| `phone_e164` | **13** | Datos importados desde el listado general CSV |
| `email` | **4** | Datos importados desde el listado general CSV |
| `height_cm` | **3** | Datos importados desde el listado general CSV |
| `shoulders_cm` | **11** | Datos importados desde el listado general CSV |
| `chest_cm` | **17** | Datos importados desde el listado general CSV |
| `waist_cm` | **13** | Datos importados desde el listado general CSV |
| `hips_cm` | **12** | Datos importados desde el listado general CSV |
| `top_size` | **3** | Datos importados desde el listado general CSV |
| `pants_size` | **62** | Datos importados desde el listado general CSV |
| `shoe_size_us` | **47** | Datos importados desde el listado general CSV |
| `instagram` | **4** | Datos importados desde el listado general CSV |
| `tiktok` | **3** | Datos importados desde el listado general CSV |
| `bust_cm` | **3** | Datos importados desde el listado general CSV |

---

## Detalle de Modelos Actualizados (Priorizando los más Vacíos)

A continuación se listan los modelos que presentaban campos vacíos y que fueron completados, ordenados de menor a mayor grado de completitud inicial.

### 1. Santiago Penagos 
*   **ID en Base de Datos:** `4ffb3001-cf04-4e1e-ae4c-71ae2df1ccf6`
*   **Completitud Inicial:** `25%`
*   **Método de Coincidencia:** Coincidió por `Alias (Exacto)`
*   **Datos Completados:**
    *   **`full_name`:** `Santiago Penagos Hernández` (Estaba vacío)
    *   **`birth_date`:** `2000-12-15` (Estaba vacío)
    *   **`national_id`:** `3022479980101` (Estaba vacío)
    *   **`phone_e164`:** `+50256997410` (Estaba vacío)
    *   **`email`:** `santiago.penagos2000@gmail.com` (Estaba vacío)
    *   **`height_cm`:** `185` (Estaba vacío)
    *   **`shoulders_cm`:** `43` (Estaba vacío)
    *   **`chest_cm`:** `93` (Estaba vacío)
    *   **`waist_cm`:** `74` (Estaba vacío)
    *   **`hips_cm`:** `95` (Estaba vacío)
    *   **`top_size`:** `M` (Estaba vacío)
    *   **`pants_size`:** `30` (Estaba vacío)
    *   **`shoe_size_us`:** `12` (Estaba vacío)
    *   **`instagram`:** `spenagos__` (Estaba vacío)
    *   **`tiktok`:** `santiago_penagos` (Estaba vacío)

### 2. Brandon Molina 
*   **ID en Base de Datos:** `43437848-8314-41f3-8c60-b7caa532ab12`
*   **Completitud Inicial:** `25%`
*   **Método de Coincidencia:** Coincidió por `Alias (Exacto)`
*   **Datos Completados:**
    *   **`full_name`:** `Brandon Steve Molina de León` (Estaba vacío)
    *   **`birth_date`:** `2005-08-29` (Estaba vacío)
    *   **`national_id`:** `3551755090101` (Estaba vacío)
    *   **`phone_e164`:** `+50259537719` (Estaba vacío)
    *   **`email`:** `molinadeleonbrandon@gmail.com` (Estaba vacío)
    *   **`height_cm`:** `184` (Estaba vacío)
    *   **`shoulders_cm`:** `40` (Estaba vacío)
    *   **`chest_cm`:** `93` (Estaba vacío)
    *   **`waist_cm`:** `76` (Estaba vacío)
    *   **`hips_cm`:** `95` (Estaba vacío)
    *   **`top_size`:** `M` (Estaba vacío)
    *   **`pants_size`:** `31` (Estaba vacío)
    *   **`shoe_size_us`:** `11` (Estaba vacío)
    *   **`instagram`:** `molina_deleon` (Estaba vacío)

### 3. Rodrigo Ruiz
*   **ID en Base de Datos:** `bc3e60fd-6e59-435e-8981-f21135e2b527`
*   **Completitud Inicial:** `25%`
*   **Método de Coincidencia:** Coincidió por `Alias (Exacto)`
*   **Datos Completados:**
    *   **`full_name`:** `Juan Rodrigo Ruiz Gaitan` (Estaba vacío)
    *   **`birth_date`:** `2006-01-05` (Estaba vacío)
    *   **`national_id`:** `3834636370101` (Estaba vacío)
    *   **`phone_e164`:** `+50255717543` (Estaba vacío)
    *   **`email`:** `ruizrg5826@gmail.com` (Estaba vacío)
    *   **`height_cm`:** `179` (Estaba vacío)
    *   **`shoulders_cm`:** `42` (Estaba vacío)
    *   **`chest_cm`:** `99` (Estaba vacío)
    *   **`waist_cm`:** `79` (Estaba vacío)
    *   **`hips_cm`:** `100` (Estaba vacío)
    *   **`top_size`:** `M` (Estaba vacío)
    *   **`pants_size`:** `30` (Estaba vacío)
    *   **`shoe_size_us`:** `10.5` (Estaba vacío)
    *   **`instagram`:** `roruizz._` (Estaba vacío)
    *   **`tiktok`:** `roruizzzzz` (Estaba vacío)

### 4. Damian Albarracin 
*   **ID en Base de Datos:** `10a4d911-5177-4a52-8281-5d2bc81ee5eb`
*   **Completitud Inicial:** `56%`
*   **Método de Coincidencia:** Coincidió por `Alias (Exacto)`
*   **Datos Completados:**
    *   **`national_id`:** `AT936268` (Estaba vacío)
    *   **`phone_e164`:** `+56931457461` (Estaba vacío)
    *   **`pants_size`:** `31 - 32` (Estaba vacío)

### 5. Juan Martin Boesenberg
*   **ID en Base de Datos:** `0afddba5-6cf4-413f-b163-c56aa85cc0a7`
*   **Completitud Inicial:** `69%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `YN6496626` (Estaba vacío)
    *   **`phone_e164`:** `+5493517143763` (Estaba vacío)
    *   **`pants_size`:** `31 - 32` (Estaba vacío)

### 6. Yaretzi De Leon 
*   **ID en Base de Datos:** `32b52cf8-f298-4d68-b66e-31501893c319`
*   **Completitud Inicial:** `75%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`full_name`:** `Adriana Yaretzi de Leon Salguero` (Estaba vacío)
    *   **`birth_date`:** `2007-01-31` (Estaba vacío)
    *   **`national_id`:** `3224642421001` (Estaba vacío)
    *   **`phone_e164`:** `+50256795893` (Estaba vacío)

### 7. Carol Veliz 
*   **ID en Base de Datos:** `ef188b4c-8aaa-4860-b1be-7eab55e07787`
*   **Completitud Inicial:** `75%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `BD499575` (Estaba vacío)
    *   **`phone_e164`:** `+573154705065` (Estaba vacío)
    *   **`pants_size`:** `0 - 1` (Estaba vacío)
    *   **`shoe_size_us`:** `5.25` (Estaba vacío)

### 8. Isabel Quiñonez
*   **ID en Base de Datos:** `3c5529b8-4a3c-47e6-bcd9-163d3587e19d`
*   **Completitud Inicial:** `75%`
*   **Método de Coincidencia:** Coincidió por `DPI`
*   **Datos Completados:**
    *   **`pants_size`:** `2 - 4` (Estaba vacío)

### 9. Louis Paley 
*   **ID en Base de Datos:** `d7645682-ced6-4ee0-876f-b365f5000793`
*   **Completitud Inicial:** `75%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `122462664` (Estaba vacío)
    *   **`pants_size`:** `32 - 33` (Estaba vacío)

### 10. Meile Kuliesiute
*   **ID en Base de Datos:** `f08f337b-38c8-461b-9ba6-88de02543384`
*   **Completitud Inicial:** `75%`
*   **Método de Coincidencia:** Coincidió por `Alias (Exacto)`
*   **Datos Completados:**
    *   **`national_id`:** `26289222` (Estaba vacío)
    *   **`phone_e164`:** `+37068924290` (Estaba vacío)
    *   **`pants_size`:** `2 - 4` (Estaba vacío)

### 11. Robinsson Ruiz
*   **ID en Base de Datos:** `16e7aae9-adfc-4f5b-b873-cf6ef71dd65e`
*   **Completitud Inicial:** `75%`
*   **Método de Coincidencia:** Coincidió por `DPI`
*   **Datos Completados:**
    *   **`pants_size`:** `28 - 30` (Estaba vacío)

### 12. Santiago Escamilla 
*   **ID en Base de Datos:** `f79037af-4766-4d75-9623-bb25554cd8c7`
*   **Completitud Inicial:** `75%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `29 - 30` (Estaba vacío)

### 13. Santiago Herrera
*   **ID en Base de Datos:** `7763c8a2-0d43-40a0-a5c6-10ad813c3fe3`
*   **Completitud Inicial:** `75%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `30 - 31` (Estaba vacío)
    *   **`shoe_size_us`:** `9.75` (Estaba vacío)

### 14. Stefany Robleto
*   **ID en Base de Datos:** `cefaaaf4-5fc8-4b81-8c99-5cc01815b2a5`
*   **Completitud Inicial:** `75%`
*   **Método de Coincidencia:** Coincidió por `Teléfono`
*   **Datos Completados:**
    *   **`shoulders_cm`:** `37` (Estaba vacío)
    *   **`chest_cm`:** `80` (Estaba vacío)
    *   **`bust_cm`:** `81` (Estaba vacío)
    *   **`waist_cm`:** `64` (Estaba vacío)
    *   **`hips_cm`:** `91` (Estaba vacío)
    *   **`pants_size`:** `00 - 0` (Estaba vacío)

### 15. Sofia Saravia 
*   **ID en Base de Datos:** `ab364267-84ee-4ff2-a52e-56b8f265489c`
*   **Completitud Inicial:** `81%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `5.75` (Estaba vacío)

### 16. Cam Mcdonald 
*   **ID en Base de Datos:** `ac3763ba-de02-45bb-9f9c-8d5cb2f48142`
*   **Completitud Inicial:** `81%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `669321804` (Estaba vacío)
    *   **`phone_e164`:** `+18012101381` (Estaba vacío)

### 17. Diana Miftakhova
*   **ID en Base de Datos:** `7cd752eb-4b74-46a2-af34-b581891220be`
*   **Completitud Inicial:** `81%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `755142066` (Estaba vacío)
    *   **`shoe_size_us`:** `8.75` (Estaba vacío)

### 18. Diego Rodas
*   **ID en Base de Datos:** `49be0ec4-ed71-4416-9d2f-c9e29901501d`
*   **Completitud Inicial:** `81%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `30 - 32` (Estaba vacío)

### 19. Diego Oddi
*   **ID en Base de Datos:** `860b3ce4-80b3-466b-9466-05dd58741fb0`
*   **Completitud Inicial:** `81%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `30 - 32` (Estaba vacío)

### 20. Fernando Barillas
*   **ID en Base de Datos:** `8b1a8c4c-f62b-4322-9bd2-73aeb7b9d3e3`
*   **Completitud Inicial:** `81%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoulders_cm`:** `42` (Estaba vacío)
    *   **`chest_cm`:** `104` (Estaba vacío)
    *   **`waist_cm`:** `82` (Estaba vacío)
    *   **`hips_cm`:** `104` (Estaba vacío)
    *   **`shoe_size_us`:** `10.5` (Estaba vacío)

### 21. Franco Garcia
*   **ID en Base de Datos:** `4b64515f-5422-4b70-8977-0cfc7b4311e0`
*   **Completitud Inicial:** `81%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoulders_cm`:** `36` (Estaba vacío)
    *   **`chest_cm`:** `86` (Estaba vacío)
    *   **`waist_cm`:** `69` (Estaba vacío)
    *   **`hips_cm`:** `88` (Estaba vacío)

### 22. Gibran Farach
*   **ID en Base de Datos:** `ad9bfb5e-c319-493b-801e-3e99c190075a`
*   **Completitud Inicial:** `81%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoulders_cm`:** `39` (Estaba vacío)
    *   **`chest_cm`:** `94` (Estaba vacío)
    *   **`waist_cm`:** `74` (Estaba vacío)
    *   **`hips_cm`:** `89` (Estaba vacío)
    *   **`instagram`:** `gibranfarach` (Estaba vacío)
    *   **`tiktok`:** `gibranfarach` (Estaba vacío)

### 23. Jose Castañeda
*   **ID en Base de Datos:** `5d8bda3b-9171-4596-a1d1-f95ca1480a83`
*   **Completitud Inicial:** `81%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoulders_cm`:** `38` (Estaba vacío)
    *   **`chest_cm`:** `97` (Estaba vacío)
    *   **`waist_cm`:** `80` (Estaba vacío)
    *   **`hips_cm`:** `100` (Estaba vacío)
    *   **`pants_size`:** `28 - 30` (Estaba vacío)

### 24. Joshua Frank
*   **ID en Base de Datos:** `bfd98921-f30e-4642-a538-c537dc8d3087`
*   **Completitud Inicial:** `81%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `32 - 30` (Estaba vacío)
    *   **`shoe_size_us`:** `9.75` (Estaba vacío)

### 25. Andres Melendez
*   **ID en Base de Datos:** `fccb382c-813b-4f55-987e-9c41f4b5bc68`
*   **Completitud Inicial:** `81%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `29 - 34` (Estaba vacío)
    *   **`shoe_size_us`:** `9.5` (Estaba vacío)

### 26. Juan Diego Cruz
*   **ID en Base de Datos:** `398ecc13-bb18-43ba-b90c-05e6ac7aa3e2`
*   **Completitud Inicial:** `81%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`waist_cm`:** `71` (Estaba vacío)

### 27. Juan Pablo Solis 
*   **ID en Base de Datos:** `50fb40cf-a092-4ed1-9235-41acdb34e9d0`
*   **Completitud Inicial:** `81%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `31 - 32` (Estaba vacío)

### 28. Alessandro Cornara
*   **ID en Base de Datos:** `916449c9-6bc2-414e-986e-287c878b37b5`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `29 - 30` (Estaba vacío)
    *   **`shoe_size_us`:** `8.25` (Estaba vacío)

### 29. Amanda Zamora 
*   **ID en Base de Datos:** `09a0c538-0534-4201-8b3b-b1e8357d026b`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `117560506` (Estaba vacío)
    *   **`phone_e164`:** `+50672873965` (Estaba vacío)

### 30. Angel Aguilera 
*   **ID en Base de Datos:** `b38856db-fd04-45d8-97bb-3b631c26d9c7`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `505610604` (Estaba vacío)
    *   **`shoe_size_us`:** `9.75` (Estaba vacío)

### 31. Antonella Vernon
*   **ID en Base de Datos:** `b6587305-5c12-412b-b15c-65c52bac6a1a`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `0 - 2` (Estaba vacío)

### 32. Ariana Ruiz 
*   **ID en Base de Datos:** `538d1115-eb6a-44e1-8be5-4b28bccfb3bd`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `4 - 6` (Estaba vacío)
    *   **`shoe_size_us`:** `7.25` (Estaba vacío)

### 33. Dahniel Rivera
*   **ID en Base de Datos:** `5cc21cd2-79da-4af9-bb23-5bd0bf82c597`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `28 - 29` (Estaba vacío)
    *   **`shoe_size_us`:** `39.5` (Estaba vacío)

### 34. Daniela Botran
*   **ID en Base de Datos:** `29808f6f-8463-446d-ba7d-023b1e4585a8`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`phone_e164`:** `+18073587510` (Estaba vacío)
    *   **`pants_size`:** `2 - 4` (Estaba vacío)

### 35. Emilia Farias 
*   **ID en Base de Datos:** `e0136be7-1f3a-477d-bf5f-14746ebb095f`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `6 - 8` (Estaba vacío)
    *   **`shoe_size_us`:** `8.75` (Estaba vacío)

### 36. Hiromi Kayama
*   **ID en Base de Datos:** `99736097-d81c-43bb-a68e-11b1d9414ae9`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `221096215` (Estaba vacío)
    *   **`pants_size`:** `2 - 3` (Estaba vacío)

### 37. Jazmin Guerrero 
*   **ID en Base de Datos:** `2ac550b4-a7e1-454a-943f-228b9428ecbd`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `0101199700028` (Estaba vacío)
    *   **`pants_size`:** `1 - 2` (Estaba vacío)

### 38. Pablo Aldana
*   **ID en Base de Datos:** `5870d9b0-605a-4523-8958-67c0ad689a23`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `374837228` (Estaba vacío)

### 39. Pablo Campos 
*   **ID en Base de Datos:** `63b00f56-cfc5-4222-968d-fd56caf54e46`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoulders_cm`:** `38` (Estaba vacío)
    *   **`chest_cm`:** `102` (Estaba vacío)
    *   **`waist_cm`:** `83` (Estaba vacío)
    *   **`hips_cm`:** `105` (Estaba vacío)

### 40. Louis Brichaux 
*   **ID en Base de Datos:** `70ef667d-2b08-4beb-b94a-3478518ffc1a`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `29 - 30` (Estaba vacío)
    *   **`shoe_size_us`:** `9.25` (Estaba vacío)

### 41. Luis Woc
*   **ID en Base de Datos:** `38380faf-8807-4aab-bf5c-09252a39d88c`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Teléfono`
*   **Datos Completados:**
    *   **`waist_cm`:** `80` (Estaba vacío)

### 42. Mario Flores
*   **ID en Base de Datos:** `6840d0b8-dfab-4f33-9bb3-276164737794`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `30 - 32` (Estaba vacío)

### 43. Mateo Lara 
*   **ID en Base de Datos:** `03278f85-528a-4112-a6c7-e54d1152c734`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`phone_e164`:** `+19123735452` (Estaba vacío)
    *   **`shoe_size_us`:** `10.25` (Estaba vacío)

### 44. Melannie Tible 
*   **ID en Base de Datos:** `7196a39a-a828-4248-8010-dea7a9ecd41c`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `00 - 0` (Estaba vacío)
    *   **`shoe_size_us`:** `5.75` (Estaba vacío)

### 45. Misael Ospina 
*   **ID en Base de Datos:** `6f81763e-5d17-4cda-bbaa-bcc42ca921c2`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `8.75` (Estaba vacío)

### 46. Nataly David
*   **ID en Base de Datos:** `74fd3826-5d37-459a-9158-0fffccb2094b`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `7 - 8` (Estaba vacío)
    *   **`shoe_size_us`:** `9.5` (Estaba vacío)

### 47. Nicolas Cordon 
*   **ID en Base de Datos:** `929e3a18-01f3-4e0b-a399-fa9c21b96831`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `30 - 32` (Estaba vacío)
    *   **`shoe_size_us`:** `7.5` (Estaba vacío)

### 48. Renata Galdamez 
*   **ID en Base de Datos:** `1fd94def-5e4a-4dfd-be39-c9c6adcd6cb5`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoulders_cm`:** `39` (Estaba vacío)
    *   **`chest_cm`:** `82` (Estaba vacío)
    *   **`bust_cm`:** `82` (Estaba vacío)
    *   **`waist_cm`:** `63` (Estaba vacío)
    *   **`hips_cm`:** `90` (Estaba vacío)

### 49. Oscar Fernandez
*   **ID en Base de Datos:** `6d61cba5-4643-4ebd-925d-af41f82a7816`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `32 - 34` (Estaba vacío)
    *   **`shoe_size_us`:** `11.25` (Estaba vacío)

### 50. Otto Ruano 
*   **ID en Base de Datos:** `b9e73bf7-0afe-4aa5-b134-01229292f9ae`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoulders_cm`:** `34` (Estaba vacío)
    *   **`chest_cm`:** `90` (Estaba vacío)
    *   **`waist_cm`:** `69` (Estaba vacío)
    *   **`hips_cm`:** `93` (Estaba vacío)

### 51. Pablo Giron 
*   **ID en Base de Datos:** `b373417f-1115-4ab4-be74-96489f70cc30`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `29 - 30` (Estaba vacío)
    *   **`shoe_size_us`:** `10.75` (Estaba vacío)

### 52. Pedro Bruni
*   **ID en Base de Datos:** `8350570d-7253-4a44-9054-29f24a93b9b3`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`hips_cm`:** `90` (Estaba vacío)
    *   **`shoe_size_us`:** `10.5` (Estaba vacío)

### 53. Samuel Castillo
*   **ID en Base de Datos:** `aa492dea-9f04-46d9-94b3-ba7d249f1eda`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `31 - 32` (Estaba vacío)
    *   **`shoe_size_us`:** `43` (Estaba vacío)

### 54. Sofia Vidal
*   **ID en Base de Datos:** `c543ae41-cf55-4e46-b33a-1792a2110538`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `6.75` (Estaba vacío)

### 55. Telvia Blanco 
*   **ID en Base de Datos:** `d8e4586d-9add-4e2a-b1fb-ded499dbe6c4`
*   **Completitud Inicial:** `88%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `0011405900038H` (Estaba vacío)
    *   **`pants_size`:** `3 - 4` (Estaba vacío)

### 56. Alan Salazar
*   **ID en Base de Datos:** `5e033576-f62c-4346-a964-37508f0dbb14`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `32 - 34` (Estaba vacío)

### 57. Jimena Arroyo 
*   **ID en Base de Datos:** `5a15d283-8aa1-4a1b-b52a-45821c7d2d3c`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `1 - 2` (Estaba vacío)

### 58. Ana Lucia Soto 
*   **ID en Base de Datos:** `e481b980-dd4f-4341-8364-6a09a49ff49d`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `6.5` (Estaba vacío)

### 59. Sofia Llarena 
*   **ID en Base de Datos:** `8635d744-899e-48a8-a53e-87ee651de827`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `3 - 4` (Estaba vacío)

### 60. Andrea Moscoso
*   **ID en Base de Datos:** `bd3dbeb0-dd89-46a7-ab6d-fb2c27074a4a`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `7.15` (Estaba vacío)

### 61. Andrea Quirin
*   **ID en Base de Datos:** `5e7c4e05-c28c-4764-9b87-d57c25d7f488`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `8.75` (Estaba vacío)

### 62. Andrea Castro
*   **ID en Base de Datos:** `2f55695f-9b44-4015-8a49-48f95ae07304`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `064830344` (Estaba vacío)

### 63. Andrea Navarro
*   **ID en Base de Datos:** `e918e8b6-a387-493c-ba0f-4d2c9da23196`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`phone_e164`:** `+4917677029462` (Estaba vacío)

### 64. Anika Galan 
*   **ID en Base de Datos:** `24a73840-fa5f-49d8-94c0-ee3549d3e113`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `4 - 6` (Estaba vacío)

### 65. Nicole Hernandez 
*   **ID en Base de Datos:** `86a0fde6-df0f-4847-8068-2f64a48f0c35`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `8.75` (Estaba vacío)

### 66. Benjamin Kadoch 
*   **ID en Base de Datos:** `1c5dfc78-b996-4001-b36a-5fe9c6f8ff28`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `32 - 30` (Estaba vacío)

### 67. Bianka Molina 
*   **ID en Base de Datos:** `93d42d81-318e-4c7a-92d9-002ca53dd057`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `6.5` (Estaba vacío)

### 68. Carla Carrera
*   **ID en Base de Datos:** `92fa9891-6919-4779-8770-7b36848bef3c`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `7 - 8` (Estaba vacío)

### 69. Cassiopee Fournier
*   **ID en Base de Datos:** `51f09d88-a604-422b-8ad9-ec2c2112012d`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `AW564871` (Estaba vacío)

### 70. Gassan Andaraus
*   **ID en Base de Datos:** `9257e195-8ef5-4614-8e3d-a2a07fe39926`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `10.25` (Estaba vacío)

### 71. Cintya Albarracin
*   **ID en Base de Datos:** `f73ef65e-b436-41e7-85fe-5cf273f19052`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `AU234793` (Estaba vacío)

### 72. Cristopher Ramirez
*   **ID en Base de Datos:** `b2085b4e-a410-4caa-b130-307de5231830`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `28 - 30` (Estaba vacío)

### 73. Paulina Gallusser
*   **ID en Base de Datos:** `ae2caab0-f063-45ff-8c91-372511f80b79`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `3893498870101` (Estaba vacío)

### 74. Elisa Chacon 
*   **ID en Base de Datos:** `52ace25d-3d94-4968-9403-cfc28cebaf1f`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `5.25` (Estaba vacío)

### 75. Elvia Rodriguez
*   **ID en Base de Datos:** `a3a1a5ba-1331-4af5-8c04-6d883c617cd3`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `3 - 4` (Estaba vacío)

### 76. Emanuel Palacios
*   **ID en Base de Datos:** `9fe32641-189c-4685-91a6-9ef8786d2ea0`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `41.5` (Estaba vacío)

### 77. Emiliano Giron
*   **ID en Base de Datos:** `a4863d2d-271d-4368-b58d-db2187510105`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `3022994080101` (Estaba vacío)

### 78. Esteban Sosa
*   **ID en Base de Datos:** `84d7f00c-e756-4283-8930-dca1ebfc7a1c`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `10.25` (Estaba vacío)

### 79. Genesis Golon
*   **ID en Base de Datos:** `2c3c1215-fedc-4358-8018-f80b9f72b8f4`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Teléfono`
*   **Datos Completados:**
    *   **`email`:** `genesis.golon@gmail.com` (Estaba vacío)

### 80. Gianluca Lanzilli
*   **ID en Base de Datos:** `c96044e0-55b9-4735-9bc5-4872ec1827b4`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `28 - 32` (Estaba vacío)

### 81. Christian Schlaffke
*   **ID en Base de Datos:** `e8d4363c-2972-4521-baa5-f98bf89b0d1d`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `9.75` (Estaba vacío)

### 82. Itza Barillas
*   **ID en Base de Datos:** `9b3c4c86-b72f-44e6-a9e6-49906cab1708`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `8.5` (Estaba vacío)

### 83. Jancarlo Galvez 
*   **ID en Base de Datos:** `646dd26a-8436-42c6-8fab-ca732281aa6f`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `9.5` (Estaba vacío)

### 84. Jennifer Franco 
*   **ID en Base de Datos:** `e79996d5-4875-4907-bd5b-7a2ca5941e4f`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `6.25` (Estaba vacío)

### 85. Joaquin Panedas
*   **ID en Base de Datos:** `339cdda4-928f-4017-8d7f-472aec87d044`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `30 - 32` (Estaba vacío)

### 86. John Perez
*   **ID en Base de Datos:** `cfaf3f65-7c00-4217-8d07-1d8fec498231`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `A03693006` (Estaba vacío)

### 87. Caleb Castañeda 
*   **ID en Base de Datos:** `8bcbf5e5-8458-4a6e-86fe-e32a0d7745e6`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `28 - 29` (Estaba vacío)

### 88. Karla Gamboa 
*   **ID en Base de Datos:** `de09c823-97b4-4500-bbbf-4915e4cfc9e3`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `3352058280901` (Estaba vacío)
    *   **`bust_cm`:** `79` (Estaba vacío)

### 89. Gisselle Davila 
*   **ID en Base de Datos:** `5988baed-3183-4f84-aaab-76d7bde1a22c`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `1 - 2` (Estaba vacío)

### 90. Marcela Mclachlan
*   **ID en Base de Datos:** `c55da973-45ce-4f27-9197-d2728c1dedbf`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `9.25` (Estaba vacío)

### 91. Antonio Mendizabal 
*   **ID en Base de Datos:** `407cd411-b608-4ad4-ace0-baa449ae4e8a`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `29 - 32` (Estaba vacío)

### 92. Andrea Santizo
*   **ID en Base de Datos:** `27585887-05c4-49a8-a658-5b7f20d68422`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`national_id`:** `2990354410101` (Estaba vacío)

### 93. Maria Ines Valle 
*   **ID en Base de Datos:** `5b77bce6-4c7c-4e2f-a964-75e0a13a1890`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `8.25` (Estaba vacío)

### 94. Maria Jose Castañeda
*   **ID en Base de Datos:** `e429634d-624c-4015-8346-c35906b3d1df`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `8.75` (Estaba vacío)

### 95. Raquel Melgar
*   **ID en Base de Datos:** `17bc794c-ef97-4ef9-a129-2a5df9c18978`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `6.25` (Estaba vacío)

### 96. Ximena Monzon 
*   **ID en Base de Datos:** `34d59251-ccb0-431b-b40d-3daf63fc2b55`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `5 - 6` (Estaba vacío)

### 97. Mario Seijas
*   **ID en Base de Datos:** `b7cd6f73-6830-4c2e-97d2-d94e712c47db`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `30 - 32` (Estaba vacío)

### 98. Martin Villatoro 
*   **ID en Base de Datos:** `7540b8af-9366-48df-94f2-7293d9acac52`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `32 - 34` (Estaba vacío)

### 99. Mavya Arredondo 
*   **ID en Base de Datos:** `7399c0b5-13fc-4dc9-8101-4c8f41f3256e`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `1 - 2` (Estaba vacío)

### 100. Melannie Bolaños 
*   **ID en Base de Datos:** `9d7f8639-9733-42ad-ae99-42ef5412787d`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `4 - 6` (Estaba vacío)

### 101. Natalie Archila 
*   **ID en Base de Datos:** `c482c744-0e40-4729-b6bb-a3fbe5b975d0`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `4 - 6` (Estaba vacío)

### 102. Adrian Estrada
*   **ID en Base de Datos:** `ab81a499-8658-4bb6-a183-b3937e9151f1`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `7.5` (Estaba vacío)

### 103. Oliver Hernandez 
*   **ID en Base de Datos:** `e27fa2a8-1460-4068-993c-63a9578fed39`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `39 - 40` (Estaba vacío)

### 104. Pablo Fajardo 
*   **ID en Base de Datos:** `4eb27936-21d7-4ca2-98aa-97b34ae17748`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `31 - 32` (Estaba vacío)

### 105. Pablo Salazar 
*   **ID en Base de Datos:** `f49ef146-9655-4bf7-965e-70c493f74e22`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `8.75` (Estaba vacío)

### 106. Paulina Quirin 
*   **ID en Base de Datos:** `96401950-e3b8-4c52-b89d-eabcf9da936b`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `7.75` (Estaba vacío)

### 107. Sharonn Pinto 
*   **ID en Base de Datos:** `cb2c2451-63cb-40cc-a810-e661f4a52b2c`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `1 - 2` (Estaba vacío)

### 108. Yolany Villafranca 
*   **ID en Base de Datos:** `2c9b5c54-8007-4866-ac78-f0460faa2210`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `3 - 4` (Estaba vacío)

### 109. Stibaly Marin
*   **ID en Base de Datos:** `2c6871cd-bf2c-4b50-a148-347f449ed7f7`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`shoe_size_us`:** `8.5` (Estaba vacío)

### 110. Tabata Dahinten
*   **ID en Base de Datos:** `b698920e-f716-4c8b-a0e6-729f2b4229a4`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `3 o 4` (Estaba vacío)

### 111. Valeria Tejeda 
*   **ID en Base de Datos:** `488f4382-03ea-41e7-9518-afa62f6741c0`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `2 - 3` (Estaba vacío)

### 112. Ximena Gutierrez
*   **ID en Base de Datos:** `5aedbcfa-40d9-4878-a96c-a5dfea8d87f4`
*   **Completitud Inicial:** `94%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`pants_size`:** `0 - 1` (Estaba vacío)

### 113. Janett Rodriguez
*   **ID en Base de Datos:** `9fe263ae-f5ba-4988-8467-828be3aafc85`
*   **Completitud Inicial:** `100%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`chest_cm`:** `82` (Estaba vacío)

### 114. Anika Seibert
*   **ID en Base de Datos:** `5e8269b6-408a-4243-866b-7124c2ca0923`
*   **Completitud Inicial:** `100%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`chest_cm`:** `80` (Estaba vacío)

### 115. Delmy Barrera
*   **ID en Base de Datos:** `ecf4842f-ab01-416c-a911-58b8f7128e43`
*   **Completitud Inicial:** `100%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`chest_cm`:** `87` (Estaba vacío)

### 116. Melisa Juarez
*   **ID en Base de Datos:** `54dd331a-b8ce-4600-9a33-92be73e08111`
*   **Completitud Inicial:** `100%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`chest_cm`:** `86` (Estaba vacío)

### 117. Martina Ruiz
*   **ID en Base de Datos:** `6263de44-7708-4aee-a977-544e545b6fd9`
*   **Completitud Inicial:** `100%`
*   **Método de Coincidencia:** Coincidió por `Email`
*   **Datos Completados:**
    *   **`chest_cm`:** `82` (Estaba vacío)

### 118. Miranda Fernandez
*   **ID en Base de Datos:** `4115a248-d821-4eae-9134-42be845b8585`
*   **Completitud Inicial:** `100%`
*   **Método de Coincidencia:** Coincidió por `DPI`
*   **Datos Completados:**
    *   **`chest_cm`:** `86` (Estaba vacío)

---

## Registros en CSV no Coincidentes (Posibles nuevos ingresos)

Estos registros se encuentran en el archivo CSV pero no se encontró un modelo existente con el mismo correo, teléfono, DPI o alias exacto en Supabase. **No se realizó ninguna acción sobre ellos**.

*   **amed minas** (Nombre: *Jonathan amed minas flores*, Email: *amedxd2013@gmail.com*, Teléfono: *5633 0747*)
*   **ashanty rubio** (Nombre: *Hameli Ashanty Rubio Perez*, Email: *ashantyrubio0@gmail.com*, Teléfono: *5952 2115*)
*   **daniela morris** (Nombre: *Daniela Morris Solorzano*, Email: *danigbvh2@gmail.com*, Teléfono: *3194 2860*)
*   **jansodin zuñiga** (Nombre: *Jansodin Mayra Zuñiga Alvarez*, Email: *zunigajansodin@gmail.com*, Teléfono: *5582 6908*)
*   **mariela aceña** (Nombre: *Mariela Aceña Monzon*, Email: *N/A*, Teléfono: *+49 1522 2869543*)
*   **ximena rivera** (Nombre: *Maria Ximena Rivera Zelaya*, Email: *ximerivera5@gmail.com*, Teléfono: *5201 2050*)
*   **Emiliano Cortes** (Nombre: *Sin Nombre*, Email: *N/A*, Teléfono: *N/A*)
*   **Isaac Aguilar** (Nombre: *Sin Nombre*, Email: *N/A*, Teléfono: *N/A*)
