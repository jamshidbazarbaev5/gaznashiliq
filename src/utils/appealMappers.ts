import {Appeal as ApiAppeal} from '../api/appeals';

// Screen interfaces
export interface ScreenAppealFile {
  id: number;
  file: string;
}

export interface ScreenAppeal {
  id: string;
  appealNumber: string;
  category: string;
  text: string;
  region: string;
  date: string;
  status: 'under_review' | 'rejected' | 'completed';
  appealFiles: Array<{
    id: number;
    file: string;
  }>;
  response?: {
    id: number;
    text: string;
    files: Array<{
      id: number;
      file: string;
    }>;
  };
}

export interface ScreenAppealFile {
  name: string;
  size: string;
  type: 'image' | 'pdf';
}

// Status mapping from API to screen
export const mapApiStatusToScreenStatus = (
  apiStatus: string,
): 'under_review' | 'rejected' | 'completed' => {
  switch (apiStatus.toLowerCase()) {
    case 'отправлено':
    case 'на рассмотрении':
    case 'в обработке':
      return 'under_review';
    case 'отклонено':
    case 'отклонён':
    case 'отказано':
    case 'rejected':
      return 'rejected';
    case 'принято':
    case 'выполнено':
    case 'завершено':
    case 'completed':
    case 'accepted':
      return 'completed';
    default:
      return 'under_review';
  }
};

// Region mapping from API code to display name
export const mapApiRegionToDisplayName = (apiRegion: string): string => {
  const regionMap: Record<string, string> = {
    nukus: 'г. Нукус',
    karakalpakstan: 'Республика Каракалпакстан',
    tashkent: 'г. Ташкент',
    tashkent_region: 'Ташкентская область',
    samarkand: 'Самаркандская область',
    bukhara: 'Бухарская область',
    khorezm: 'Хорезмская область',
    navoi: 'Навоийская область',
    kashkadarya: 'Кашкадарьинская область',
    surkhandarya: 'Сурхандарьинская область',
    syrdarya: 'Сырдарьинская область',
    jizzakh: 'Джизакская область',
    fergana: 'Ферганская область',
    namangan: 'Наманганская область',
    andijan: 'Андижанская область',
  };

  return regionMap[apiRegion.toLowerCase()] || apiRegion;
};

// Format date from API to display format
export const formatApiDateToDisplay = (apiDate: string): string => {
  try {
    // API returns date in format "20/08/2025 13:05"
    const [datePart] = apiDate.split(' ');
    return datePart; // Return just the date part "20/08/2025"
  } catch (error) {
    console.error('Error formatting date:', error);
    return apiDate;
  }
};

// Determine file size unit and format
export const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
};

// Map API file to screen file format

// Main mapping function from API Appeal to Screen Appeal
export const mapApiAppealToScreenAppeal = (
  apiAppeal: ApiAppeal,
): ScreenAppeal => {
  // Safe category extraction
  const getCategoryName = (category: any): string => {
    if (typeof category === 'string') {
      return category;
    }
    if (category && typeof category === 'object' && category.name) {
      return category.name;
    }
    return 'Категория не указана';
  };

  // Safe string extraction
  const safeString = (value: any, defaultValue: string = ''): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (value && typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value || defaultValue);
  };

  // Get files from either files or appeal_files property
  const files = apiAppeal.files || apiAppeal.appeal_files || [];
  console.log('Raw files from API:', files);

  const mappedFiles = Array.isArray(files)
    ? files.map(file => {
        console.log('Mapping file:', file);
        return {
          id: typeof file.id === 'number' ? file.id : 0,
          file: file.file || '',
        };
      })
    : [];
  console.log('Mapped files:', mappedFiles);

  // Handle response data
  const response =
    apiAppeal.appeal_response && typeof apiAppeal.appeal_response === 'object'
      ? {
          id:
            typeof apiAppeal.appeal_response.id === 'number'
              ? apiAppeal.appeal_response.id
              : 0,
          text: safeString(apiAppeal.appeal_response.text, 'Ответ не получен'),
          files: Array.isArray(apiAppeal.appeal_response.response_files)
            ? apiAppeal.appeal_response.response_files.map((file: any) => ({
                id: typeof file.id === 'number' ? file.id : 0,
                file: file.file || '',
              }))
            : [],
        }
      : undefined;

  const result = {
    id: safeString(apiAppeal.id, '0'),
    appealNumber: `N°${safeString(apiAppeal.reference_number, 'Unknown')}`,
    category: getCategoryName(apiAppeal.category),
    text: safeString(apiAppeal.text, 'Текст обращения не указан'),
    region: mapApiRegionToDisplayName(
      safeString(apiAppeal.region || apiAppeal.sender?.region || ''),
    ),
    date: formatApiDateToDisplay(safeString(apiAppeal.created_at, '')),
    status: mapApiStatusToScreenStatus(
      safeString(apiAppeal.status, 'under_review'),
    ),
    appealFiles: mappedFiles,
    response: response,
  };

  console.log('Mapping appeal:', {
    id: apiAppeal.id,
    files: apiAppeal.appeal_files,
    mappedFiles: result.appealFiles,
  });

  return result;
};

// Map array of API appeals to screen appeals
export const mapApiAppealsToScreenAppeals = (
  apiAppeals: ApiAppeal[],
): ScreenAppeal[] => {
  console.log(
    'Debug - Starting to map appeals:',
    JSON.stringify(apiAppeals, null, 2),
  );

  const mappedAppeals = apiAppeals.map(apiAppeal => {
    // First, handle the files
    const files = apiAppeal.files || apiAppeal.appeal_files || [];
    console.log(
      `Debug - Files for appeal ${apiAppeal.id}:`,
      JSON.stringify(files, null, 2),
    );

    // Handle response data for list view
    const response =
      apiAppeal.appeal_response && typeof apiAppeal.appeal_response === 'object'
        ? {
            id:
              typeof apiAppeal.appeal_response.id === 'number'
                ? apiAppeal.appeal_response.id
                : 0,
            text: apiAppeal.appeal_response.text || 'Ответ не получен',
            files: Array.isArray(apiAppeal.appeal_response.response_files)
              ? apiAppeal.appeal_response.response_files.map((file: any) => ({
                  id: typeof file.id === 'number' ? file.id : 0,
                  file: file.file || '',
                }))
              : [],
          }
        : undefined;

    const mappedAppeal = {
      id: apiAppeal.id.toString(),
      appealNumber: `N°${apiAppeal.reference_number}`,
      category: apiAppeal.category.name,
      text: apiAppeal.text || 'Текст обращения не указан',
      region: apiAppeal.region || apiAppeal.sender?.region || '',
      date: apiAppeal.created_at,
      status: mapApiStatusToScreenStatus(apiAppeal.status),
      appealFiles: files.map(file => ({
        id: typeof file.id === 'number' ? file.id : 0,
        file: file.file || '',
      })),
      response: response,
    };

    console.log(
      `Debug - Mapped appeal ${apiAppeal.id}:`,
      JSON.stringify(mappedAppeal, null, 2),
    );
    return mappedAppeal;
  });

  console.log(
    'Debug - Final mapped appeals:',
    JSON.stringify(mappedAppeals, null, 2),
  );
  return mappedAppeals;
};

// Get status text using translations
export const getStatusDisplayText = (
  status: 'under_review' | 'rejected' | 'completed',
  t: (key: string) => string,
): string => {
  switch (status) {
    case 'under_review':
      return t('appeals.status_under_review');
    case 'rejected':
      return t('appeals.status_rejected');
    case 'completed':
      return t('appeals.status_accepted');
    default:
      return t('appeals.status_under_review');
  }
};
