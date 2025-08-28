import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';

export type Language = 'uz' | 'ru' | 'kk';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

interface LanguageProviderProps {
  children: ReactNode;
}

const translations = {
  uz: {
    // Common
    'common.save': 'Saqlash',
    'common.cancel': 'Bekor qilish',
    'common.edit': 'Tahrirlash',
    'common.delete': "O'chirish",
    'common.confirm': 'Tasdiqlash',
    'common.back': 'Orqaga',
    'common.file': 'Fayl qosish',
    'common.next': 'Keyingi',
    'common.done': 'Tayyor',
    'common.loading': 'Yuklanmoqda...',
    'common.error': 'Xatolik',
    'common.success': 'Muvaffaqiyat',
    'common.changed': "O'zgartirildi",
    'common.yes': 'Ha',
    'common.files': 'Fayllar',
    'common.no_files': 'Fayllar yõq',
    'common.no': "Yo'q",
    'common.see_2': 'Javobni kõrish',
    'common.see': 'Kõrish',
    'common.send_appeal': 'Murojat yuborish',
    'common.file_opened_browser': 'Fayl brauzerda ochildi',
    'common.file_open_error':
      "Faylni ochib bo'lmadi. Internet aloqasini tekshiring.",
    'common.unknown_file': "Noma'lum fayl",
    'common.no_response': 'Javob olinmagan',
    'common.no_response_yet': 'Javob hali olinmagan',

    // Response Modal
    'modal.response_title': 'Murojatga javob',
    'modal.attached_files': 'Biriktirilgan fayllar',
    'modal.click_to_download': 'Yuklab olish uchun bosing',
    'modal.rating_title': 'Javobni baholash',
    'modal.your_rating': 'Sizning bahoyingiz:',
    'modal.rating_saved': '✓ Sizning bahoyingiz saqlandi',
    'modal.rate': 'Baholash',
    'modal.update_rating': 'Bahoni yangilash',
    'modal.submitting_rating': 'Baholanmoqda...',

    // Rating
    'rating.poor': 'Yomon',
    'rating.satisfactory': 'Qoniqarli',
    'rating.good': 'Yaxshi',
    'rating.excellent': 'Ajoyib',

    // Modal
    'modal.cancel': 'Bekor qilish',
    'modal.save': 'Saqlash',
    'modal.enterField': 'kiriting',
    'modal.fieldEmpty': "Maydon bo'sh bo'lishi mumkin emas",
    'modal.saveError': "O'zgarishlarni saqlab bo'lmadi",
    'modal.selectCategory': 'Murojat kategoriyasini tanlang',
    'modal.selectRegion': 'Viloyatni tanlang',

    // Validation
    'validation.emailInvalid': "To'g'ri email manzilini kiriting",
    'validation.phoneInvalid': "To'g'ri telefon raqamini kiriting",
    'validation.nameMinLength': 'Ism kamida 2 ta belgidan iborat bolishi kerak',
    'validation.regionMinLength':
      'Viloyat kamida 2 ta belgidan iborat bolishi kerak',
    'validation.correctValue': "To'g'ri qiymat kiriting",
    'validation.phoneFormat': 'Format: +998 XX XXX-XX-XX',
    'validation.emailExample': 'Misol: example@mail.com',

    // Profile Types
    'profile.userType': 'Jismoniy shaxs',
    'profile.confirmLogout': 'Siz haqiqatan ham akkauntdan chiqmoqchimisiz?',
    'profile.confirmDelete':
      "Siz haqiqatan ham akkauntingizni o'chirmoqchimisiz? Bu harakatni bekor qilib bo'lmaydi.",
    'profile.confirmDeleteDetails':
      "Sizning barcha ma'lumotlaringiz qaytarib bo'lmas tarzda o'chirib tashlanadi. Davom etasizmi?",
    'profile.accountDeleted': "Akkount muvaffaqiyatli o'chirildi",
    'profile.deleteError': "Akkauntni o'chirib bo'lmadi",
    'profile.updated': 'Profil muvaffaqiyatli yangilandi',
    'profile.regionUpdated': 'Viloyat muvaffaqiyatli yangilandi',
    'profile.logoutError': "Akkauntdan chiqib bo'lmadi",
    'profile.loadError': "Foydalanuvchi profilini yuklab bo'lmadi",

    // Auth
    'auth.login': 'Kirish',
    'auth.register': "Ro'yxatdan o'tish",
    'auth.logout': 'Chiqish',
    'auth.email': 'Elektron pochta',
    'auth.password': 'Parol',
    'auth.confirmPassword': 'Parolni tasdiqlash',
    'auth.name': 'Ism',
    'auth.phone': 'Telefon raqami',
    'auth.region': 'Viloyat',
    'auth.forgotPassword': 'Parolni unutdingizmi?',
    'auth.notregistered': 'Hisobingiz yõqmi',

    // Profile
    'profile.title': 'Profil',
    'profile.personalInfo': "Shaxsiy ma'lumotlar",
    'profile.editProfile': 'Profilni tahrirlash',
    'profile.settings': 'Sozlamalar',
    'profile.language': 'Til',
    'profile.theme': 'Mavzu',
    'profile.notifications': 'Bildirishnomalar',
    'profile.darkMode': 'Tungi rejim',
    'profile.lightMode': 'Kunduzgi rejim',
    'profile.systemMode': 'Tizim rejimi',
    'profile.selectLanguageHint': 'Tilni tanlash uchun bosing',

    // Appeals
    'appeals.title': 'Управление казначейской службы Республики Каракалпакстан',
    'appeals.myAppeals': 'Mening murojaatlarim',
    'appeals.submitAppeal': 'Murojaat yuborish',
    'appeals.status': 'Holati',
    'appeals.date': 'Sana',
    'appeals.category': 'Kategoriya',
    'appeals.description': 'Tavsif',
    'appeals.pending': 'Kutilmoqda',
    'appeals.inProgress': "Ko'rib chiqilmoqda",
    'appeals.completed': 'Yakunlangan',
    'appeals.rejected': 'Rad etilgan',
    'appeals.status_under_review': "Ko'rib chiqilmoqda",
    'appeals.status_accepted': 'Qabul qilindi',
    'appeals.status_sent': 'Yuborildi',
    'appeals.status_rejected': 'Rad etildi',
    'appeals.sended': 'Ariza yuborildi',
    'appeals.number': 'Ariza raqami',
    'appeals.id_not_found': 'Murojaat ID topilmadi',
    'appeals.load_error':
      "Murojaat tafsilotlarini yuklab bo'lmadi. Internet aloqasini tekshiring.",
    'appeals.under_review': "Sizning murojaatingiz ko'rib chiqilmoqda",
    'appeals.appeal_rejected': 'Sizning murojaatingiz rad etildi',
    'appeals.appeal_accepted': 'Sizning murojaatingiz qabul qilindi',
    'appeals.final_decision': 'Yakuniy qaror',
    'appeals.step_done': 'Yakunlangan',
    'appeals.step_in_progress': 'Bajarilmoqda',
    'appeals.step_pending': 'Kutilmoqda',
    'appeals.step_rejected': 'Rad etildi',
    'appeals.step_completed': 'Muvaffaqiyatli yakunlandi',
    'appeals.steps_completed': 'bosqich yakunlandi',
    'appeals.see': 'Murojat',
    // Languages
    'languages.uzbek': "O'zbek",
    'languages.russian': 'Rus',
    'languages.karakalpak': 'Qoraqalpoq',

    // Regions
    'regions.nukus': 'Nukus',
    'regions.khodjeyli': 'Xoʻjayoli',
    'regions.chimbay': 'Chimbay',
    'regions.kungrad': "Qo'ng'irot",
    'regions.takhtakupyr': 'Taxiatosh',
    'regions.karauziak': 'Qoraoʻzak',
    'regions.kegeyli': 'Kegeyli',
    'regions.shumanay': 'Shumanay',
    'regions.amudarya': 'Amudaryo',
    'regions.beruniy': 'Beruniy',
    'regions.ellikkala': "Ellikqal'a",
    'regions.moynak': "Mo'ynoq",

    'regions.turtkul': 'Tortkul',
    'regions.nukus_rayon': 'Nukus rayoni',
    'regions.qanlikul': 'Qanli kõl',
    // Additional
    'common.address': 'Manzil',
    'common.fullName': "To'liq ism",
    'common.alreadyHaveAccount': 'Hisobingiz bormi?',
    'common.dontHaveAccount': "Hisobingiz yo'qmi?",
    'validation.phoneRequired': 'Telefon raqami talab qilinadi',
    'validation.emailRequired': 'Elektron pochta talab qilinadi',
    'validation.nameRequired': 'Ism talab qilinadi',
    'validation.regionRequired': 'Viloyat talab qilinadi',
    'validation.passwordRequired': 'Parol talab qilinadi',
  },

  ru: {
    // Common
    'common.save': 'Сохранить',
    'common.send_appeal': 'Отправить обращение',
    'common.cancel': 'Отменить',
    'common.see': 'Подробнее',
    'common.see_2': 'Посмотреть ответ ',
    'common.edit': 'Редактировать',
    'common.delete': 'Удалить',
    'common.confirm': 'Подтвердить',
    'common.back': 'Назад',
    'common.next': 'Далее',
    'common.done': 'Готово',
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.success': 'Успех',
    'common.changed': 'Изменено',
    'common.yes': 'Да',
    'common.no': 'Нет',
    'common.no_files': 'Нет прикрепленных файлов',
    'common.files': 'Прикрепленные файлы',
    'common.file': 'Прикрепить файлы',
    'common.file_opened_browser': 'Файл открыт в браузере',
    'common.file_open_error':
      'Не удалось открыть файл. Проверьте подключение к интернету.',
    'common.unknown_file': 'Неизвестный файл',
    'common.no_response': 'Ответ не получен',
    'common.no_response_yet': 'Ответ пока не получен',

    // Response Modal
    'modal.response_title': 'Ответ на обращение',
    'modal.attached_files': 'Прикрепленные файлы',
    'modal.click_to_download': 'Нажмите для загрузки',
    'modal.rating_title': 'Оценка ответа',
    'modal.your_rating': 'Ваша оценка:',
    'modal.rating_saved': '✓ Ваша оценка сохранена',
    'modal.rate': 'Оценить',
    'modal.update_rating': 'Обновить оценку',
    'modal.submitting_rating': 'Отправка оценки...',

    // Rating
    'rating.poor': 'Плохо',
    'rating.satisfactory': 'Удовлетворительно',
    'rating.good': 'Хорошо',
    'rating.excellent': 'Отлично',

    // Modal
    'modal.cancel': 'Отмена',
    'modal.save': 'Сохранить',
    'modal.enterField': 'Введите',
    'modal.fieldEmpty': 'Поле не может быть пустым',
    'modal.saveError': 'Не удалось сохранить изменения',
    'modal.selectCategory': 'Выберите категорию обращения',
    'modal.selectRegion': 'Выберите регион',

    // Validation
    'validation.emailInvalid': 'Введите корректный email адрес',
    'validation.phoneInvalid': 'Введите корректный номер телефона',
    'validation.nameMinLength': 'Имя должно содержать минимум 2 символа',
    'validation.regionMinLength': 'Регион должен содержать минимум 2 символа',
    'validation.correctValue': 'Введите корректное значение',
    'validation.phoneFormat': 'Формат: +998 XX XXX-XX-XX',
    'validation.emailExample': 'Пример: example@mail.com',

    // Profile Types
    'profile.userType': 'Физическое лицо',
    'profile.confirmLogout': 'Вы действительно хотите выйти из аккаунта?',
    'profile.confirmDelete':
      'Вы действительно хотите удалить свой аккаунт? Это действие нельзя отменить.',
    'profile.confirmDeleteDetails':
      'Все ваши данные будут безвозвратно удалены. Продолжить?',
    'profile.accountDeleted': 'Аккаунт успешно удален',
    'profile.deleteError': 'Не удалось удалить аккаунт',
    'profile.updated': 'Профиль успешно обновлен',
    'profile.regionUpdated': 'Регион успешно обновлен',
    'profile.logoutError': 'Не удалось выйти из аккаунта',
    'profile.loadError': 'Не удалось загрузить профиль пользователя',

    // Auth
    'auth.login': 'Войти',
    'auth.register': 'Зарегистрироваться',
    'auth.logout': 'Выйти',
    'auth.email': 'Электронная почта',
    'auth.password': 'Пароль',
    'auth.confirmPassword': 'Подтвердить пароль',
    'auth.name': 'Имя',
    'auth.phone': 'Номер телефона',
    'auth.region': 'Регион',
    'auth.forgotPassword': 'Забыли пароль?',
    'auth.notregistered': 'Нет аккаунта',

    // Profile
    'profile.title': 'Профиль',
    'profile.personalInfo': 'Личная информация',
    'profile.editProfile': 'Редактировать профиль',
    'profile.settings': 'Настройки',
    'profile.language': 'Язык',
    'profile.theme': 'Тема',
    'profile.notifications': 'Уведомления',
    'profile.darkMode': 'Темная тема',
    'profile.lightMode': 'Светлая тема',
    'profile.systemMode': 'Системная тема',
    'profile.selectLanguageHint': 'Нажмите для выбора языка',

    // Appeals
    'appeals.title': 'Управление казначейской службы Республики Каракалпакстан',
    'appeals.myAppeals': 'Мои обращения',

    'appeals.number': 'Номер обращения',
    'appeals.sended': 'Ваше обращение отправлена',
    'appeals.submitAppeal': 'Подать обращение',
    'appeals.status': 'Статус',
    'appeals.date': 'Дата',
    'appeals.category': 'Категория',
    'appeals.description': 'Текст обращения',
    'appeals.pending': 'Ожидает',
    'appeals.inProgress': 'Рассматривается',
    'appeals.completed': 'Завершено',
    'appeals.rejected': 'Отклонено',
    'appeals.status_under_review': 'Рассматривается',
    'appeals.status_accepted': 'Принято',
    'appeals.status_sent': 'Отправлено',
    'appeals.status_rejected': 'Отказано',
    'appeals.id_not_found': 'ID обращения не найден',
    'appeals.load_error':
      'Не удалось загрузить детали обращения. Проверьте подключение к интернету.',
    'appeals.under_review': 'Ваше обращение на рассмотрении',
    'appeals.appeal_rejected': 'Ваше обращение отклонено',
    'appeals.appeal_accepted': 'Ваше обращение принято',
    'appeals.final_decision': 'Окончательное решение',
    'appeals.step_done': 'Завершено',
    'appeals.step_in_progress': 'В процессе',
    'appeals.step_pending': 'Ожидание',
    'appeals.step_rejected': 'Отклонено',
    'appeals.step_completed': 'Успешно завершено',
    'appeals.steps_completed': 'этапов завершено',
    'appeals.see': 'Обращение',
    // Languages
    'languages.uzbek': 'Узбекский',
    'languages.russian': 'Русский',
    'languages.karakalpak': 'Каракалпакский',

    // Regions
    'regions.nukus': 'Нукус',
    'regions.khodjeyli': 'Ходжейли',
    'regions.chimbay': 'Чимбай',
    'regions.kungrad': 'Кунград',
    'regions.takhtakupyr': 'Тахтакупыр',
    'regions.karauziak': 'Караузяк',
    'regions.kegeyli': 'Кегейли',
    'regions.shumanay': 'Шуманай',
    'regions.amudarya': 'Амударья',
    'regions.beruniy': 'Берунии',
    'regions.ellikkala': 'Элликкала',
    'regions.moynak': 'Мойнак',
    'regions.turtkul': 'Торткул',
    'regions.nukus_rayon': 'Нукус Районы',
    'regions.qanlikul': 'Канлы кол',

    // Additional
    'common.address': 'Адрес',
    'common.fullName': 'Полное имя',
    'common.alreadyHaveAccount': 'Уже есть аккаунт?',
    'common.dontHaveAccount': 'Нет аккаунта?',
    'validation.phoneRequired': 'Номер телефона обязателен',
    'validation.emailRequired': 'Email обязателен',
    'validation.nameRequired': 'Имя обязательно',
    'validation.regionRequired': 'Регион обязателен',
    'validation.passwordRequired': 'Пароль обязателен',
  },

  kk: {
    // Common (Karakalpak)
    'common.save': 'Saqlaw',
    'common.cancel': 'Biykar etıw',
    'common.edit': 'Óńdew',
    'common.delete': 'Óshiriw',
    'common.confirm': 'Tastıyıqlaw',
    'common.back': 'Artqa',
    'common.next': 'Kelesi',
    'common.done': 'Tayar',
    'common.loading': 'Júklenbekte...',
    'common.error': 'Qátelık',
    'common.success': 'Tabıslılıq',
    'common.changed': 'Ózgergen',
    'common.yes': 'Hawa',
    'common.no': 'Yaq',
    'common.see_2': 'Juwaptı kóriw',
    'common.see': 'Kóriw',
    'common.send_appeal': 'Murajaat jiberiw',
    'common.files': 'Fayllar',
    'common.no_files': 'Fayllar joq',
    'common.file': 'Fayl qosıw',
    'common.file_opened_browser': 'Fayl brauzerde ashıldı',
    'common.file_open_error':
      'Fayldi ashıp bolmadı. Internet baylanısın tekseriń.',
    'common.unknown_file': 'Belgisiz fayl',
    'common.no_response': 'Juwap alınmadı',
    'common.no_response_yet': 'Juwap áli alınmadı',

    // Response Modal
    'modal.response_title': 'Murajaat bóyınsha juwap',
    'modal.attached_files': 'Qosılǵan fayllar',
    'modal.click_to_download': 'Júklew ushın basıń',
    'modal.rating_title': 'Juwaptı bahalaw',
    'modal.your_rating': 'Sizniń bahańız:',
    'modal.rating_saved': '✓ Sizniń bahańız saqlandı',
    'modal.rate': 'Bahalaw',
    'modal.update_rating': 'Bahanı jańılaw',
    'modal.submitting_rating': 'Bahalanıp atır...',

    // Rating
    'rating.poor': 'Jaman',
    'rating.satisfactory': 'Qanaǵatlı',
    'rating.good': 'Jaqsı',
    'rating.excellent': 'Óte jaqsı',

    // Modal
    'modal.cancel': 'Bet etıw',
    'modal.save': 'Saqlaw',
    'modal.enterField': 'kiritiń',
    'modal.fieldEmpty': 'Maydan bos bolıp qala almaydı',
    'modal.saveError': 'Ózgerisleri saqlap bolmadı',
    'modal.selectCategory': 'Murajaat kategoriyasın tanlań',
    'modal.selectRegion': 'Aymaqtı tanlań',

    // Validation
    'validation.emailInvalid': 'Durıs email manzilın kiritiń',
    'validation.phoneInvalid': 'Durıs telefon nómerin kiritiń',
    'validation.nameMinLength': 'Atı kemine 2 belgiden ibarat bolıwı kerek',
    'validation.regionMinLength': 'Aymaq kemine 2 belgiden ibarat bolıwı kerek',
    'validation.correctValue': 'Durıs qıymat kiritiń',
    'validation.phoneFormat': 'Format: +998 XX XXX-XX-XX',
    'validation.emailExample': 'Misal: example@mail.com',

    // Profile Types
    'profile.userType': 'Jeke adam',
    'profile.confirmLogout': 'Siz shınında da akkaunttan shıǵıwdı qálewsiz be?',
    'profile.confirmDelete':
      'Siz shınında da akkauntıńızdı óshiriwdi qálewsiz be? Bul hareketti bet etip bolmaydı.',
    'profile.confirmDeleteDetails':
      'Sizniń barlıq mağlıwmatlarıńız qaytarıp bolmas túrde óshirilip tashlanadı. Dawam etesiz be?',
    'profile.accountDeleted': 'Akkaunt tabıslı óshirildi',
    'profile.deleteError': 'Akkauntı óshirip bolmadı',
    'profile.updated': 'Profil tabıslı jańılandı',
    'profile.regionUpdated': 'Aymaq tabıslı jańılandı',
    'profile.logoutError': 'Akkaunttan shıǵıp bolmadı',
    'profile.loadError': 'Paydalanıwshı profilin júklep bolmadı',

    // Auth
    'auth.login': 'Kiriw',
    'auth.register': 'Dizimnen ótiw',
    'auth.logout': 'Shıǵıw',
    'auth.email': 'Elektron pochta',
    'auth.password': 'Parol',
    'auth.confirmPassword': 'Paroldi tastıyıqlaw',
    'auth.name': 'Atı',
    'auth.phone': 'Telefon nómeri',
    'auth.region': 'Aymaq',
    'auth.forgotPassword': 'Paroldi umıttıńızba?',
    'auth.notregistered': 'Akkauntińiz joqpa',

    // Profile
    'profile.title': 'Profil',
    'profile.personalInfo': 'Jeke mağlıwmatlar',
    'profile.editProfile': 'Profildi ózgertiw',
    'profile.settings': 'Sazlawlar',
    'profile.language': 'Til',
    'profile.theme': 'Tema',
    'profile.notifications': 'Xabarlar',
    'profile.darkMode': 'Tún rejimi',
    'profile.lightMode': 'Kúndiz rejimi',
    'profile.systemMode': 'Sistema rejimi',
    'profile.selectLanguageHint': 'Tildi tańlaw ushın basıń',

    // Appeals
    'appeals.title':
      'Qaraqalpaqstan Respublikası Xazinadarlik qızmetiniń basqarması',
    'appeals.myAppeals': 'Mening murajaatlarım',
    'appeals.submitAppeal': 'Murajaat jiberiw',
    'appeals.status': 'Háleti',
    'appeals.date': 'Sánesi',
    'appeals.category': 'Kategoriya',
    'appeals.description': 'Sıpatlama',
    'appeals.pending': 'Kútilbekte',
    'appeals.inProgress': 'Qaralıp atır',
    'appeals.completed': 'Tamamlandı',
    'appeals.rejected': 'Qabıl etilmedi',
    'appeals.status_under_review': 'Qaralıp atır',
    'appeals.status_accepted': 'Qabıl etildi',
    'appeals.status_sent': 'Jiberildi',
    'appeals.status_rejected': 'Ret etildi',
    'appeals.sended': 'Sizniń murajaatıńız jiberildi',
    'appeals.number': 'Murajaat nómeri',
    'appeals.id_not_found': 'Murajaat ID tabılmadı',
    'appeals.load_error':
      'Murajaat tapsılıqların júklep bolmadı. Internet baylanısın tekseriń.',
    'appeals.under_review': 'Sizniń murajaatıńız qaralıp atır',
    'appeals.appeal_rejected': 'Sizniń murajaatıńız ret etildi',
    'appeals.appeal_accepted': 'Sizniń murajaatıńız qabıl etildi',
    'appeals.final_decision': 'Aqırǵı sheshim',
    'appeals.step_done': 'Tamamlandı',
    'appeals.step_in_progress': 'Orınlanıp atır',
    'appeals.step_pending': 'Kútilip atır',
    'appeals.step_rejected': 'Ret etildi',
    'appeals.step_completed': 'Tabıslı tamamlandı',
    'appeals.steps_completed': 'basqısh tamamlandı',
    'appeals.see': 'Murajaat',

    // Languages
    'languages.uzbek': 'Ózbek',
    'languages.russian': 'Orıs',
    'languages.karakalpak': 'Qaraqalpaq',

    // Regions
    'regions.nukus': 'Nókis',
    'regions.khodjeyli': 'Xojeli',
    'regions.chimbay': 'Shımbay',
    'regions.kungrad': 'Qońırat',
    'regions.takhtakupyr': 'Taxtakópir',
    'regions.karauziak': 'Qarawzaq',
    'regions.kegeyli': 'Kegeyli',
    'regions.shumanay': 'Shumanay',
    'regions.amudarya': 'Amiwdarya',
    'regions.beruniy': 'Biruniy',
    'regions.ellikkala': 'Elliqqala',
    'regions.moynak': 'Moynaq',
    'regions.turtkul': 'Tórtkul',
    'regions.nukus_rayon': 'Nókis rayoni',
    'regions.qanlikul': 'Qanli kól',

    // Additional
    'common.address': 'Mánzil',
    'common.fullName': 'Tolıq atı',
    'common.alreadyHaveAccount': 'Akkauntıńız barma?',
    'common.dontHaveAccount': 'Akkauntıńız joqpa?',
    'validation.phoneRequired': 'Telefon nómeri talap etiledi',
    'validation.emailRequired': 'Email talap etiledi',
    'validation.nameRequired': 'Atı talap etiledi',
    'validation.regionRequired': 'Aymaq talap etiledi',
    'validation.passwordRequired': 'Parol talap etiledi',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>('uz');

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useMemo(
    () =>
      (key: string): string => {
        return (translations[language] as any)[key] || key;
      },
    [language],
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
