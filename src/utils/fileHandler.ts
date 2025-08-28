import {Linking, Alert, Platform, Share} from 'react-native';
import {StorageService} from './storage';

// Try to import RNFS, fallback if not available
let RNFS: any;
try {
  RNFS = require('react-native-fs');
} catch (error) {
  console.warn(
    'react-native-fs not available, file download functionality will be limited',
  );
  RNFS = null;
}

// Try to import react-native-file-viewer
let FileViewer: any;
try {
  FileViewer = require('react-native-file-viewer');
} catch (error) {
  console.warn(
    'react-native-file-viewer not available, using fallback methods',
  );
  FileViewer = null;
}

export interface DownloadProgress {
  jobId: number;
  contentLength: number;
  bytesWritten: number;
}

class FileHandler {
  private static instance: FileHandler;
  private downloadInProgress = new Set<string>();

  static getInstance(): FileHandler {
    if (!FileHandler.instance) {
      FileHandler.instance = new FileHandler();
    }
    return FileHandler.instance;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const token = await StorageService.getAccessToken();
      if (token) {
        return {
          Authorization: `Bearer ${token}`,
        };
      }
    } catch (error) {
      console.log('No auth token available, proceeding without authentication');
    }
    return {};
  }

  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  private async getDownloadPath(fileName: string): Promise<string> {
    const downloadDir =
      Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : RNFS.DownloadDirectoryPath;

    // Ensure download directory exists
    try {
      const dirExists = await RNFS.exists(downloadDir);
      if (!dirExists) {
        await RNFS.mkdir(downloadDir);
      }
    } catch (error) {
      console.log('Could not create download directory:', error);
    }

    return `${downloadDir}/${fileName}`;
  }

  private sanitizeFileName(fileName: string): string {
    // Remove invalid characters and limit length
    return fileName.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
  }

  async downloadFile(
    fileUrl: string,
    fileName: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    if (!RNFS) {
      Alert.alert(
        'Функция недоступна',
        'Загрузка файлов недоступна на этом устройстве. Попробуйте открыть файл в браузере.',
        [
          {text: 'Отмена', style: 'cancel'},
          {
            text: 'Открыть в браузере',
            onPress: () =>
              Linking.openURL(fileUrl).catch(err =>
                console.error('Failed to open URL:', err),
              ),
          },
        ],
      );
      throw new Error('RNFS not available');
    }

    const fileId = `${fileUrl}_${fileName}`;

    if (this.downloadInProgress.has(fileId)) {
      throw new Error('Файл уже загружается');
    }

    this.downloadInProgress.add(fileId);

    try {
      const headers = await this.getAuthHeaders();
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const downloadPath = await this.getDownloadPath(sanitizedFileName);

      // Check if file already exists
      const fileExists = await RNFS.exists(downloadPath);
      if (fileExists) {
        Alert.alert(
          'Файл существует',
          'Файл уже загружен. Хотите открыть его?',
          [
            {text: 'Отмена', style: 'cancel'},
            {
              text: 'Открыть',
              onPress: () => this.openFile(downloadPath),
            },
          ],
        );
        return downloadPath;
      }

      // Start download
      console.log('Debug - Starting RNFS.downloadFile with:', {
        fromUrl: fileUrl,
        toFile: downloadPath,
        headers: Object.keys(headers),
      });

      const downloadResult = RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: downloadPath,
        headers,
        progress: (res: any) => {
          console.log('Debug - Download progress update:', {
            bytesWritten: res.bytesWritten,
            contentLength: res.contentLength,
          });
          if (onProgress && res.contentLength > 0) {
            const progressPercent =
              (res.bytesWritten / res.contentLength) * 100;
            onProgress(Math.round(progressPercent));
          }
        },
      });

      const result = await downloadResult.promise;
      console.log('Debug - Download result:', {
        statusCode: result.statusCode,
        jobId: result.jobId,
        bytesWritten: result.bytesWritten,
      });

      if (result.statusCode === 200) {
        // Verify file actually exists after download
        const fileExists = await RNFS.exists(downloadPath);
        console.log('Debug - File exists after download:', fileExists);

        if (!fileExists) {
          console.error(
            'Debug - File does not exist after successful download',
          );
          throw new Error('Файл не был сохранен');
        }

        // Check file size
        try {
          const fileStats = await RNFS.stat(downloadPath);
          console.log('Debug - Downloaded file stats:', {
            size: fileStats.size,
            isFile: fileStats.isFile(),
            path: downloadPath,
          });
        } catch (statError) {
          console.error('Debug - Error getting file stats:', statError);
        }

        Alert.alert(
          'Загрузка завершена',
          `Файл "${sanitizedFileName}" успешно загружен и сохранен в память устройства`,
          [
            {text: 'OK'},
            {
              text: 'Открыть',
              onPress: async () => {
                console.log('Debug - User clicked "Открыть" button');
                try {
                  await this.openFile(downloadPath);
                } catch (openError) {
                  console.error(
                    'Debug - Error in alert open action:',
                    openError,
                  );
                  Alert.alert('Ошибка', 'Не удалось открыть файл');
                }
              },
            },
          ],
        );
        return downloadPath;
      } else {
        console.error(
          'Debug - Download failed with status code:',
          result.statusCode,
        );
        throw new Error(`Ошибка загрузки: ${result.statusCode}`);
      }
    } catch (error) {
      console.error('Download error details:', {
        error: error.message || error,
        type: typeof error,
        name: error.name,
        stack: error.stack,
        fileUrl,
        downloadPath,
      });
      throw new Error(
        'Не удалось загрузить файл. Проверьте подключение к интернету.',
      );
    } finally {
      this.downloadInProgress.delete(fileId);
    }
  }

  async openFile(filePath: string): Promise<void> {
    if (!RNFS) {
      Alert.alert('Ошибка', 'Функция открытия файлов недоступна');
      return;
    }

    try {
      console.log('Debug - openFile called with path:', filePath);
      console.log('Debug - Platform.OS:', Platform.OS);

      // Validate file path - should not be a server path
      if (filePath.startsWith('/media/') || filePath.startsWith('http')) {
        console.error('Invalid local file path provided:', filePath);
        Alert.alert('Ошибка', 'Неверный путь к файлу');
        return;
      }

      const fileExists = await RNFS.exists(filePath);
      console.log('Debug - File exists check:', fileExists);

      if (!fileExists) {
        console.log('Debug - File not found at path:', filePath);
        // Try to list directory contents to see what's there
        try {
          const dir = filePath.substring(0, filePath.lastIndexOf('/'));
          console.log('Debug - Checking directory:', dir);
          const dirExists = await RNFS.exists(dir);
          console.log('Debug - Directory exists:', dirExists);

          if (dirExists) {
            const dirContents = await RNFS.readDir(dir);
            console.log(
              'Debug - Directory contents:',
              dirContents.length,
              'items',
            );
            dirContents.forEach(item => {
              console.log('Debug - File in dir:', {
                name: item.name,
                isFile: item.isFile(),
                size: item.size,
                path: item.path,
              });
            });

            // Look for files with similar names
            const targetFileName = filePath.substring(
              filePath.lastIndexOf('/') + 1,
            );
            const similarFiles = dirContents.filter(
              item =>
                item.name
                  .toLowerCase()
                  .includes(targetFileName.toLowerCase()) ||
                targetFileName.toLowerCase().includes(item.name.toLowerCase()),
            );

            if (similarFiles.length > 0) {
              console.log(
                'Debug - Found similar files:',
                similarFiles.map(f => f.name),
              );
            }
          }
        } catch (dirError) {
          console.log('Debug - Could not read directory:', dirError);
        }

        Alert.alert(
          'Файл не найден',
          'Файл не найден в ожидаемом расположении. Возможно, произошла ошибка при сохранении.',
          [{text: 'OK', style: 'default'}],
        );
        return;
      }

      // Additional file validation
      try {
        const fileStats = await RNFS.stat(filePath);
        console.log('Debug - File stats before opening:', {
          size: fileStats.size,
          isFile: fileStats.isFile(),
          isDirectory: fileStats.isDirectory(),
          mtime: fileStats.mtime,
          path: filePath,
        });

        if (fileStats.size === 0) {
          console.log('Debug - File exists but is empty');
          Alert.alert('Ошибка', 'Файл поврежден или пуст');
          return;
        }
      } catch (statError) {
        console.log('Debug - Could not get file stats:', statError);
      }

      // Try to open the file
      const fileUrl = Platform.OS === 'ios' ? filePath : `file://${filePath}`;
      console.log('Debug - Constructed file URL for opening:', fileUrl);

      const canOpen = await Linking.canOpenURL(fileUrl);
      console.log('Debug - Can open URL:', canOpen);

      // Try different methods to open the file
      if (Platform.OS === 'ios') {
        // On iOS, try react-native-file-viewer first
        if (FileViewer) {
          try {
            console.log(
              'Debug - Attempting to open with FileViewer:',
              filePath,
            );
            await FileViewer.open(filePath);
            console.log('Debug - Successfully opened file with FileViewer');
            return;
          } catch (fileViewerError) {
            console.log('Debug - FileViewer failed:', fileViewerError);
            // Fall through to other methods
          }
        }

        // Try sharing the file as a fallback on iOS
        try {
          console.log('Debug - Attempting to share file:', filePath);
          await Share.share({
            url: `file://${filePath}`,
            title: 'Открыть файл',
          });
          console.log('Debug - Successfully shared file');
          return;
        } catch (shareError) {
          console.log('Debug - Share failed:', shareError);
          // Fall through to Linking method
        }
      }

      // Original Linking method as final fallback
      // On iOS Simulator, Linking.openURL with local files often fails
      // Provide user with better options
      if (Platform.OS === 'ios') {
        Alert.alert(
          'Файл загружен',
          `Файл сохранен в:\n${filePath}\n\nВыберите действие:`,
          [
            {text: 'Закрыть', style: 'cancel'},
            {
              text: 'Поделиться',
              onPress: async () => {
                try {
                  await Share.share({
                    url: `file://${filePath}`,
                    title: 'Файл из приложения',
                  });
                } catch (shareError) {
                  console.error('Share failed:', shareError);
                  Alert.alert('Ошибка', 'Не удалось поделиться файлом');
                }
              },
            },
            {
              text: 'Попытаться открыть',
              onPress: async () => {
                try {
                  console.log(
                    'Debug - Attempting to open URL with Linking:',
                    fileUrl,
                  );
                  await Linking.openURL(fileUrl);
                  console.log('Debug - Successfully opened file with Linking');
                } catch (linkingError) {
                  console.error('Linking failed:', linkingError);
                  Alert.alert(
                    'Ошибка открытия',
                    'Не удалось открыть файл напрямую. Используйте функцию "Поделиться" для открытия файла в другом приложении.',
                  );
                }
              },
            },
          ],
        );
      } else {
        // Android - try direct opening
        if (canOpen) {
          console.log('Debug - Attempting to open URL with Linking:', fileUrl);
          await Linking.openURL(fileUrl);
          console.log('Debug - Successfully opened file with Linking');
        } else {
          console.log('Debug - Cannot open URL, no suitable app found');
          Alert.alert(
            'Не удается открыть файл',
            'На устройстве нет подходящего приложения для открытия этого файла',
          );
        }
      }
    } catch (error) {
      console.error('Error opening file details:', {
        error: error.message || error,
        type: typeof error,
        name: error.name,
        stack: error.stack,
        filePath,
      });
      Alert.alert('Ошибка', 'Не удалось открыть файл');
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    if (!RNFS) {
      return false;
    }

    try {
      const fileExists = await RNFS.exists(filePath);
      if (fileExists) {
        await RNFS.unlink(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  getFileType(fileName: string): 'image' | 'pdf' | 'document' | 'unknown' {
    const extension = this.getFileExtension(fileName);

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return 'document';
    }

    return 'unknown';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileHandler = FileHandler.getInstance();
export default fileHandler;
