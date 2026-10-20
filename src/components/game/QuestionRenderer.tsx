import React from 'react';
import {
  Question,
  MultipleChoiceContent,
  TrueFalseContent,
  OpenShortContent,
  FillBlanksContent,
  MemoryMatchContent,
  DrawVoteContent,
  CellIdentifyContent,
  OrderCellsContent,
  AnagramContent,
  PuzzleContent,
  WordSearchContent,
  MathChallengeContent,
  WordBuilderContent,
  MoleWhackContent,
  LongestWordContent,
  DrawingSubmission
} from '../../types/quiz';
import { MultipleChoicePlayer } from './MultipleChoicePlayer';
import { TrueFalsePlayer } from './TrueFalsePlayer';
import { OpenShortPlayer } from './OpenShortPlayer';
import { FillBlanksPlayer } from './FillBlanksPlayer';
import { MemoryMatchPlayer } from './MemoryMatchPlayer';
import { DrawVotePlayer } from './DrawVotePlayer';
import { CellIdentifyPlayer } from './CellIdentifyPlayer';
import { OrderCellsPlayer } from './OrderCellsPlayer';
import { AnagramPlayer } from './AnagramPlayer';
import { PuzzlePlayer } from './PuzzlePlayer';
import { WordSearchPlayer } from './WordSearchPlayer';
import { MathChallengePlayer } from './MathChallengePlayer';
import { WordBuilderPlayer } from './WordBuilderPlayer';
import { WhackMolePlayer } from './WhackMolePlayer';
import { LongestWordPlayer } from './LongestWordPlayer';

interface QuestionRendererProps {
  question: Question;
  onAnswer: (isCorrect: boolean, payload?: any) => void;
  disabled?: boolean;
  myPlayerId?: string;
  drawings?: Record<string, DrawingSubmission>;
  isGalleryMode?: boolean;
  onSaveDrawing?: (dataUrl: string) => void;
  onVoteDrawing?: (targetPlayerId: string) => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  onAnswer,
  disabled = false,
  myPlayerId = '',
  drawings = {},
  isGalleryMode = false,
  onSaveDrawing = () => {},
  onVoteDrawing = () => {}
}) => {
  switch (question.type) {
    case 'multiple_choice':
      return (
        <MultipleChoicePlayer
          key={question.id}
          content={question.content as MultipleChoiceContent}
          imageUrl={question.imageUrl}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );

    case 'true_false':
      return (
        <TrueFalsePlayer
          key={question.id}
          content={question.content as TrueFalseContent}
          imageUrl={question.imageUrl}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );

    case 'open_short':
      return (
        <OpenShortPlayer
          key={question.id}
          content={question.content as OpenShortContent}
          imageUrl={question.imageUrl}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );

    case 'fill_blanks':
      return (
        <FillBlanksPlayer
          key={question.id}
          content={question.content as FillBlanksContent}
          imageUrl={question.imageUrl}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );

    case 'memory_match':
      return (
        <MemoryMatchPlayer
          key={question.id}
          content={question.content as MemoryMatchContent}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );

    case 'draw_vote':
      return (
        <DrawVotePlayer
          key={`${question.id}-${isGalleryMode ? 'gallery' : 'draw'}`}
          content={question.content as DrawVoteContent}
          myPlayerId={myPlayerId}
          drawings={drawings}
          isGalleryMode={isGalleryMode}
          onSaveDrawing={onSaveDrawing}
          onVoteDrawing={onVoteDrawing}
          disabled={disabled}
        />
      );

    case 'cell_identify':
      return (
        <CellIdentifyPlayer
          key={question.id}
          content={question.content as CellIdentifyContent}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );

    case 'order_cells':
      return (
        <OrderCellsPlayer
          key={question.id}
          content={question.content as OrderCellsContent}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );

    case 'anagram':
      return (
        <AnagramPlayer
          key={question.id}
          content={question.content as AnagramContent}
          imageUrl={question.imageUrl}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );

    case 'puzzle':
      return (
        <PuzzlePlayer
          key={question.id}
          content={question.content as PuzzleContent}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );

    case 'word_search':
      return (
        <WordSearchPlayer
          key={question.id}
          content={question.content as WordSearchContent}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );

    case 'math_challenge':
      return (
        <MathChallengePlayer
          key={question.id}
          content={question.content as MathChallengeContent}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );

    case 'word_builder':
      return (
        <WordBuilderPlayer
          key={question.id}
          content={question.content as WordBuilderContent}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );

    case 'mole_whack':
      return (
        <WhackMolePlayer
          key={question.id}
          content={question.content as MoleWhackContent}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );

    case 'longest_word':
      return (
        <LongestWordPlayer
          key={question.id}
          content={question.content as LongestWordContent}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );

    default:
      return (
        <div className="p-6 text-center text-slate-400">
          Tipologia di domanda non riconosciuta.
        </div>
      );
  }
};
