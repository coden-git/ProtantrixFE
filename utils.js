export const formatDateTime = (val) => {
        try {
            const d = new Date(val);
            if (isNaN(d)) return '';
            const date = d.toLocaleDateString();
            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `${date} ${time}`;
        } catch {
            return '';
        }
    };

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const mimeTypes =  [
  'application/pdf',
  // Word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // AutoCAD DWG (common variants)
  'application/dwg',
  'application/acad',
  'application/x-acad',
  'application/x-dwg',
  'image/*'
];
