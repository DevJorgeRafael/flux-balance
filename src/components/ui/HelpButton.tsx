import React from 'react';
import Info from 'lucide-react-native/icons/info';
import { appAlert } from '@/components/ui/alert/appAlert';
import { IconButton } from '@/components/ui/atoms/IconButton';
import { useColors } from '@/components/ui/theme';
import { useTranslation } from '@/core/i18n/useTranslation';

interface HelpButtonProps {
  title: string;
  message: string;
}

export function HelpButton({ title, message }: HelpButtonProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <IconButton
      size={16}
      icon={<Info size={16} color={colors.textLight} strokeWidth={2.2} />}
      accessibilityLabel={`${t('help')}: ${title}`}
      onPress={() => {
        void appAlert({
          type: 'info',
          title,
          message,
          buttons: [{ text: t('accept') }],
        });
      }}
    />
  );
}
