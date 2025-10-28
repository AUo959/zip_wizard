import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Globe,
  Languages,
  FileText,
  Clock,
  MapPin,
  Users,
  Type,
  Calendar,
  Compass,
} from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
  coverage: number;
}

interface CulturalContext {
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  fileNamingConvention: string;
  archiveStructure: string;
}

interface MultilingualSupportProps {
  onLanguageChange: (language: string) => void;
  currentLanguage: string;
}

export function MultilingualSupport({
  onLanguageChange,
  currentLanguage,
}: MultilingualSupportProps) {
  const [detectedEncoding, setDetectedEncoding] = useState('UTF-8');
  const [culturalPreferences, setCulturalPreferences] = useState<CulturalContext>({
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour',
    numberFormat: 'US',
    fileNamingConvention: 'Western',
    archiveStructure: 'Hierarchical',
  });

  const supportedLanguages: Language[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      coverage: 100,
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      flag: '🇪🇸',
      coverage: 95,
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
      coverage: 90,
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      coverage: 88,
    },
    {
      code: 'ja',
      name: 'Japanese',
      nativeName: '日本語',
      flag: '🇯🇵',
      coverage: 85,
    },
    {
      code: 'zh',
      name: 'Chinese',
      nativeName: '中文',
      flag: '🇨🇳',
      coverage: 82,
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      flag: '🇸🇦',
      coverage: 75,
      rtl: true,
    },
    {
      code: 'ru',
      name: 'Russian',
      nativeName: 'Русский',
      flag: '🇷🇺',
      coverage: 80,
    },
  ];

  const culturalContexts: Record<string, CulturalContext> = {
    en: {
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12-hour',
      numberFormat: 'US (1,234.56)',
      fileNamingConvention: 'CamelCase, spaces allowed',
      archiveStructure: 'Hierarchical folders',
    },
    de: {
      dateFormat: 'DD.MM.YYYY',
      timeFormat: '24-hour',
      numberFormat: 'German (1.234,56)',
      fileNamingConvention: 'Compound words, no spaces',
      archiveStructure: 'Deep categorization',
    },
    ja: {
      dateFormat: 'YYYY/MM/DD',
      timeFormat: '24-hour',
      numberFormat: 'Japanese (1,234.56)',
      fileNamingConvention: 'Mixed scripts, date prefixes',
      archiveStructure: 'Categorical grouping',
    },
    ar: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12-hour',
      numberFormat: 'Arabic (١٬٢٣٤٫٥٦)',
      fileNamingConvention: 'Right-to-left naming',
      archiveStructure: 'Topic-based organization',
    },
    zh: {
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24-hour',
      numberFormat: 'Chinese (1,234.56)',
      fileNamingConvention: 'Pinyin with characters',
      archiveStructure: 'Thematic grouping',
    },
  };

  const translations = {
    en: {
      title: 'Multilingual Support',
      language: 'Language',
      encoding: 'Character Encoding',
      cultural: 'Cultural Context',
      fileNaming: 'File Naming Suggestions',
      archiveOrg: 'Archive Organization',
      timezone: 'Timezone Settings',
    },
    es: {
      title: 'Soporte Multiidioma',
      language: 'Idioma',
      encoding: 'Codificación de Caracteres',
      cultural: 'Contexto Cultural',
      fileNaming: 'Sugerencias de Nomenclatura',
      archiveOrg: 'Organización de Archivos',
      timezone: 'Configuración de Zona Horaria',
    },
    fr: {
      title: 'Support Multilingue',
      language: 'Langue',
      encoding: 'Encodage des Caractères',
      cultural: 'Contexte Culturel',
      fileNaming: 'Suggestions de Nommage',
      archiveOrg: 'Organisation des Archives',
      timezone: 'Paramètres de Fuseau Horaire',
    },
    de: {
      title: 'Mehrsprachige Unterstützung',
      language: 'Sprache',
      encoding: 'Zeichenkodierung',
      cultural: 'Kultureller Kontext',
      fileNaming: 'Dateibenennungsvorschläge',
      archiveOrg: 'Archivorganisation',
      timezone: 'Zeitzoneneinstellungen',
    },
    ja: {
      title: '多言語サポート',
      language: '言語',
      encoding: '文字エンコーディング',
      cultural: '文化的コンテキスト',
      fileNaming: 'ファイル命名提案',
      archiveOrg: 'アーカイブ整理',
      timezone: 'タイムゾーン設定',
    },
  };

  const currentTranslations =
    translations[currentLanguage as keyof typeof translations] || translations.en;

  useEffect(() => {
    if (culturalContexts[currentLanguage]) {
      setCulturalPreferences(culturalContexts[currentLanguage]);
    }
  }, [currentLanguage]);

  const handleLanguageSelect = (langCode: string) => {
    onLanguageChange(langCode);
  };

  const getLanguageProgress = (coverage: number) => {
    if (coverage >= 95) return 'text-green-600';
    if (coverage >= 80) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const generateFileNameSuggestion = (originalName: string): string => {
    const context = culturalContexts[currentLanguage];
    const now = new Date();

    switch (currentLanguage) {
      case 'ja':
        return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${originalName}`;
      case 'de':
        return originalName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9äöüß]/g, '_');
      case 'zh':
        return `${originalName}_${now.getFullYear()}年${now.getMonth() + 1}月`;
      case 'ar':
        return `${originalName}_${now.toLocaleDateString('ar')}`;
      default:
        return originalName;
    }
  };

  return (
    <div className={`space-y-6 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-primary" />
            <span>{currentTranslations.title}</span>
            <Badge variant="secondary" className="ml-auto">
              {supportedLanguages.length} Languages
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Languages className="w-4 h-4" />
            <AlertDescription>
              ZipWiz supports global file processing with cultural context awareness and localized
              user interfaces.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentTranslations.language}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Interface Language</label>
              <Select value={currentLanguage} onValueChange={handleLanguageSelect}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center space-x-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                        <Badge variant="outline" className={getLanguageProgress(lang.coverage)}>
                          {lang.coverage}%
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {currentTranslations.encoding}
              </label>
              <Select value={detectedEncoding} onValueChange={setDetectedEncoding}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTF-8">UTF-8 (Unicode)</SelectItem>
                  <SelectItem value="UTF-16">UTF-16</SelectItem>
                  <SelectItem value="ISO-8859-1">ISO-8859-1 (Latin-1)</SelectItem>
                  <SelectItem value="Windows-1252">Windows-1252</SelectItem>
                  <SelectItem value="Shift_JIS">Shift_JIS (Japanese)</SelectItem>
                  <SelectItem value="GB2312">GB2312 (Chinese)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* RTL Support Indicator */}
            {supportedLanguages.find(l => l.code === currentLanguage)?.rtl && (
              <Alert>
                <Compass className="w-4 h-4" />
                <AlertDescription>
                  Right-to-left text direction is active for this language.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Cultural Context */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentTranslations.cultural}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Date Format</span>
                </div>
                <Badge variant="outline">{culturalPreferences.dateFormat}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Time Format</span>
                </div>
                <Badge variant="outline">{culturalPreferences.timeFormat}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Type className="w-4 h-4" />
                  <span className="text-sm">Number Format</span>
                </div>
                <Badge variant="outline">{culturalPreferences.numberFormat}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">File Naming</span>
                </div>
                <Badge variant="outline">{culturalPreferences.fileNamingConvention}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Naming Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>{currentTranslations.fileNaming}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Original Filename</label>
                <div className="mt-1 p-2 bg-muted rounded text-sm">project_documentation.zip</div>
              </div>
              <div>
                <label className="text-sm font-medium">Cultural Suggestion</label>
                <div className="mt-1 p-2 bg-primary/10 rounded text-sm font-medium">
                  {generateFileNameSuggestion('project_documentation.zip')}
                </div>
              </div>
            </div>

            <Alert>
              <MapPin className="w-4 h-4" />
              <AlertDescription>
                File naming follows {culturalPreferences.fileNamingConvention.toLowerCase()}{' '}
                conventions and {culturalPreferences.archiveStructure.toLowerCase()} for better
                organization.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Archive Organization Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>{currentTranslations.archiveOrg}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(culturalContexts)
              .slice(0, 3)
              .map(([code, context]) => (
                <Card
                  key={code}
                  className={`border ${currentLanguage === code ? 'border-primary' : 'border-border'}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span>{supportedLanguages.find(l => l.code === code)?.flag}</span>
                      <span className="font-medium">
                        {supportedLanguages.find(l => l.code === code)?.name}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{context.archiveStructure}</p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
