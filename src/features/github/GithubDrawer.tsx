import React from 'react';
import { IDEDrawer } from '@/features/ide/IDEDrawer';
import { OpenFile } from '@/types/ide';

interface GithubDrawerProps {
  onClose: () => void;
  onSelectFile: (path: string) => void;
  openFiles: OpenFile[];
  language?: 'ar' | 'en';
}

export function GithubDrawer({ onClose, onSelectFile, openFiles, language = 'ar' }: GithubDrawerProps) {
  return (
    <IDEDrawer
      onClose={onClose}
      onSelectFile={onSelectFile}
      openFiles={openFiles}
      language={language}
    />
  );
}
