/**
 * Italian Word Dictionary & Anagram / Word Builder Helpers
 * Supporta nomi, aggettivi, verbi all'infinito, articoli, preposizioni e pronomi.
 */

// Dizionario curato ed esteso della lingua italiana per la sfida "Più Parole"
export const ITALIAN_WORD_LIST = new Set([
  // 1. Articoli (determinativi e indeterminativi)
  'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una',

  // 2. Preposizioni semplici
  'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',

  // 3. Preposizioni articolate
  'del', 'dello', 'della', 'dei', 'degli', 'delle',
  'al', 'allo', 'alla', 'ai', 'agli', 'alle',
  'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
  'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
  'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
  'col', 'coi',

  // 4. Pronomi personali, relativi, possessivi e dimostrativi
  'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro', 'esso', 'essa', 'essi', 'esse',
  'me', 'te', 'se', 'ci', 'vi', 'ne', 'mi', 'ti', 'si', 'li', 'cui', 'chi', 'che',
  'mio', 'tuo', 'suo', 'nostro', 'vostro', 'miei', 'tuoi', 'suoi', 'nostri', 'vostri',
  'mia', 'tua', 'sua', 'nostra', 'vostra', 'mie', 'tue', 'sue', 'nostre', 'vostre',
  'questo', 'questa', 'questi', 'queste', 'quello', 'quella', 'quelli', 'quelle',
  'quale', 'quali', 'quanto', 'quanti', 'quanta', 'quante', 'tale', 'tali',

  // 5. Congiunzioni e avverbi comuni
  'e', 'ed', 'o', 'od', 'ma', 'anche', 'ancora', 'bene', 'male', 'meglio', 'peggio',
  'non', 'si', 'no', 'forse', 'quasi', 'solo', 'sempre', 'mai', 'spesso', 'subito',
  'prima', 'dopo', 'poi', 'ora', 'adesso', 'ieri', 'oggi', 'domani', 'qui', 'qua',
  'li', 'la', 'giu', 'su', 'sopra', 'sotto', 'dentro', 'fuori', 'davanti', 'dietro',
  'vicino', 'lontano', 'molto', 'poco', 'tanto', 'troppo', 'meno', 'piu', 'gia', 'via',

  // 6. Verbi all'infinito comuni
  'essere', 'avere', 'fare', 'andare', 'dire', 'dare', 'stare', 'potere', 'volere', 'dovere',
  'sapere', 'vedere', 'venire', 'sentire', 'parlare', 'trovare', 'lasciare', 'prendere',
  'capire', 'mettere', 'pensare', 'credere', 'chiedere', 'vivere', 'morire', 'nascere',
  'crescere', 'ridere', 'piangere', 'cantare', 'ballare', 'saltare', 'correre', 'nuotare',
  'dormire', 'mangiare', 'bere', 'leggere', 'scrivere', 'dipingere', 'giocare', 'vincere',
  'perdere', 'aprire', 'chiudere', 'portare', 'comprare', 'vendere', 'pagare', 'amare',
  'odiare', 'temere', 'sperare', 'toccare', 'guardare', 'osservare', 'fermare', 'partire',
  'tornare', 'entrare', 'uscire', 'cadere', 'salire', 'scendere', 'finire', 'iniziare',
  'cominciare', 'continuare', 'riuscire', 'tentare', 'cercare', 'usare', 'aiutare',
  'imparare', 'insegnare', 'studiare', 'ascoltare', 'costruire', 'creare', 'guidare',
  'spedire', 'ricevere', 'incontrare', 'scegliere', 'decidere', 'risolvere', 'scoprire',

  // 7. Nomi e sostantivi comuni
  'mare', 'sole', 'roma', 'cane', 'gatto', 'casa', 'pane', 'vino', 'mela', 'pera',
  'pesce', 'luce', 'notte', 'fiore', 'libro', 'penna', 'foglio', 'cuore', 'vento',
  'porto', 'pista', 'festa', 'terra', 'monte', 'fiume', 'bosco', 'parco', 'tempo',
  'prato', 'cielo', 'stella', 'sedia', 'tavolo', 'porta', 'vetro', 'muro', 'treno',
  'auto', 'nave', 'aereo', 'bici', 'palla', 'gioco', 'rete', 'salto', 'corsa',
  'nuoto', 'passo', 'mano', 'piede', 'testa', 'occhi', 'naso', 'bocca', 'dente',
  'voce', 'suono', 'canto', 'musica', 'nota', 'ritmo', 'scuola', 'classe', 'banco',
  'zaino', 'maestro', 'amico', 'fratello', 'sorella', 'madre', 'padre', 'nonno',
  'nonna', 'figlio', 'figlia', 'anno', 'mese', 'giorno', 'ora', 'minuto', 'secondo',
  'sera', 'alba', 'tramonto', 'estate', 'inverno', 'autunno', 'primavera', 'caldo',
  'freddo', 'neve', 'pioggia', 'nuvola', 'tuono', 'lampo', 'ombra', 'spazio',
  'mondo', 'italia', 'europa', 'isola', 'costa', 'golfo', 'lago', 'valle', 'collina',
  'oro', 'argento', 'ferro', 'rame', 'legno', 'pietra', 'sabbia', 'acqua', 'fuoco',
  'aria', 'fumo', 'onda', 'scoglio', 'spiaggia', 'viaggio', 'strada', 'ponte',
  'piazza', 'chiesa', 'torre', 'palazzo', 'museo', 'teatro', 'cinema', 'foto',
  'quadro', 'statua', 'storia', 'scienza', 'natura', 'vita', 'sogno', 'pace',
  'gioia', 'amore', 'forza', 'coraggio', 'mente', 'pensiero', 'idea', 'parola',
  'frase', 'favola', 'mito', 'poesia', 'verso', 'ritratto', 'faro', 'porto',
  'bosco', 'ramo', 'foglia', 'albero', 'pianta', 'erba', 'radice', 'frutto',
  'semi', 'grano', 'latte', 'burro', 'formaggio', 'pasta', 'riso', 'carne',
  'uovo', 'dolce', 'torta', 'sale', 'pepe', 'olio', 'zucchero', 'caffe', 'te',
  'acqua', 'succo', 'arancia', 'limone', 'uva', 'fragola', 'pesca', 'ciliegia',
  'tazza', 'piatto', 'bicchiere', 'forchetta', 'coltello', 'cucchiaio', 'pentola',
  'letto', 'cuscino', 'coperta', 'armadio', 'specchio', 'lampada', 'finestra',
  'tetto', 'giardino', 'cortile', 'garage', 'cancello', 'strada', 'marciapiede',
  'citta', 'paese', 'villaggio', 'quartiere', 'stazione', 'fermata', 'negozio',
  'mercato', 'ospedale', 'banca', 'posta', 'ufficio', 'fabbrica', 'stadio',
  'parco', 'bosco', 'fiume', 'lago', 'cascata', 'vulcano', 'deserto', 'pianura',
  'foresta', 'giungla', 'grotta', 'spiaggia', 'roccia', 'sassolino', 'polvere',
  'fango', 'ghiaccio', 'brina', 'nebbia', 'rugiada', 'temporale', 'arcobaleno',
  'leone', 'tigre', 'orso', 'lupo', 'volpe', 'lepre', 'coniglio', 'topo',
  'cavallo', 'asino', 'mucca', 'toro', 'pecora', 'capra', 'maiale', 'cervo',
  'elefante', 'giraffa', 'zebra', 'scimmia', 'aquila', 'falco', 'gufo', 'civetta',
  'passero', 'rondine', 'colomba', 'piccione', 'cigno', 'anatra', 'oca', 'gallo',
  'gallina', 'pulcino', 'delfino', 'balena', 'squalo', 'polpo', 'tartaruga',
  'rana', 'serpente', 'lucertola', 'coccodrillo', 'ape', 'vespa', 'formica',
  'farfalla', 'ragno', 'mosca', 'zanzara', 'grillo', 'cavalletta', 'coccinella',

  // 8. Aggettivi comuni
  'bello', 'bella', 'belli', 'belle', 'brutto', 'brutta', 'brutti', 'brutte',
  'buono', 'buona', 'buoni', 'buone', 'cattivo', 'cattiva', 'cattivi', 'cattive',
  'grande', 'grandi', 'piccolo', 'piccola', 'piccoli', 'piccole',
  'alto', 'alta', 'alti', 'alte', 'basso', 'bassa', 'bassi', 'basse',
  'lungo', 'lunga', 'lunghi', 'lunghe', 'corto', 'corta', 'corti', 'corte',
  'largo', 'larga', 'larghi', 'larghe', 'stretto', 'stretta', 'stretti', 'strette',
  'nuovo', 'nuova', 'nuovi', 'nuove', 'vecchio', 'vecchia', 'vecchi', 'vecchie',
  'giovane', 'giovani', 'antico', 'antica', 'antichi', 'antiche',
  'facile', 'facili', 'difficile', 'difficili', 'chiaro', 'chiara', 'chiari', 'chiare',
  'scuro', 'scura', 'scuri', 'scure', 'forte', 'forti', 'debole', 'deboli',
  'dolce', 'dolci', 'amaro', 'amara', 'amari', 'amare', 'salato', 'salata',
  'caldo', 'calda', 'caldi', 'calde', 'freddo', 'fredda', 'freddi', 'fredde',
  'rosso', 'rossa', 'rossi', 'rosse', 'verde', 'verdi', 'giallo', 'gialla',
  'gialli', 'gialle', 'blu', 'bianco', 'bianca', 'bianchi', 'bianche',
  'nero', 'nera', 'neri', 'nere', 'grigio', 'grigia', 'grigi', 'grigie',
  'rosa', 'viola', 'marrone', 'marroni', 'arancione', 'arancioni',
  'felice', 'felici', 'triste', 'tristi', 'allegro', 'allegra', 'allegri', 'allegre',
  'veloce', 'veloci', 'lento', 'lenta', 'lenti', 'lente',
  'ricco', 'ricca', 'ricchi', 'ricche', 'povero', 'povera', 'poveri', 'povere',
  'pulito', 'pulita', 'puliti', 'pulite', 'sporco', 'sporca', 'sporchi', 'sporche',

  // 9. Numeri in lettere
  'zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove',
  'dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici',
  'diciassette', 'diciotto', 'diciannove', 'venti', 'trenta', 'quaranta', 'cinquanta',
  'sessanta', 'settanta', 'ottanta', 'novanta', 'cento', 'mille'
]);

export function canFormWord(word: string, availableLetters: string[]): boolean {
  const normWord = word.trim().toLowerCase();
  if (normWord.length < 2) return false;

  const letterPool = [...availableLetters.map((c) => c.toLowerCase())];

  for (const char of normWord) {
    const idx = letterPool.indexOf(char);
    if (idx === -1) {
      return false;
    }
    letterPool.splice(idx, 1);
  }
  return true;
}

export function isValidItalianWord(word: string): boolean {
  const norm = word.trim().toLowerCase();
  return ITALIAN_WORD_LIST.has(norm);
}

export const ITALIAN_ARTICLES = [
  'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una'
];

export const ITALIAN_VERBS = [
  'amare', 'andare', 'aprire', 'ascoltare', 'avere', 'ballare', 'bere', 'cadere',
  'cantare', 'capire', 'cercare', 'chiudere', 'comprare', 'correre', 'credere',
  'crescere', 'dare', 'decidere', 'dipingere', 'dire', 'dormire', 'dovere',
  'entrare', 'essere', 'fare', 'fermare', 'finire', 'giocare', 'guardare',
  'guidare', 'imparare', 'incontrare', 'insegnare', 'lasciare', 'leggere',
  'mangiare', 'mettere', 'morire', 'nascere', 'nuotare', 'osservare', 'pagare',
  'parlare', 'partire', 'pensare', 'perdere', 'piangere', 'potere', 'prendere',
  'ricevere', 'ridere', 'riuscire', 'salire', 'saltare', 'sapere', 'scendere',
  'scrivere', 'sentire', 'sperare', 'stare', 'studiare', 'temere', 'toccare',
  'tornare', 'trovare', 'uscire', 'vedere', 'vendere', 'venire', 'vincere', 'vivere', 'volere'
];

export const ITALIAN_NOUNS = [
  'cane', 'gatto', 'casa', 'pane', 'mela', 'pesce', 'luce', 'notte', 'fiore',
  'libro', 'penna', 'foglio', 'cuore', 'vento', 'porto', 'festa', 'terra',
  'monte', 'fiume', 'bosco', 'parco', 'tempo', 'prato', 'cielo', 'stella',
  'sedia', 'tavolo', 'porta', 'muro', 'treno', 'auto', 'nave', 'aereo',
  'palla', 'gioco', 'mano', 'piede', 'testa', 'occhi', 'naso', 'bocca',
  'scuola', 'classe', 'banco', 'zaino', 'maestro', 'amico', 'fratello',
  'sorella', 'madre', 'padre', 'nonno', 'nonna', 'mare', 'sole', 'estate',
  'inverno', 'acqua', 'fuoco', 'storia', 'quadro', 'leone', 'tigre', 'orso',
  'delfino', 'rondine', 'farfalla', 'luna', 'nuvola', 'musica', 'pioggia'
];

export const ITALIAN_ADJECTIVES = [
  'bello', 'bella', 'belli', 'belle', 'buono', 'buona', 'grande', 'grandi',
  'piccolo', 'piccola', 'alto', 'alta', 'basso', 'bassa', 'lungo', 'lunga',
  'corto', 'corta', 'nuovo', 'nuova', 'vecchio', 'vecchia', 'giovane', 'antico',
  'facile', 'difficile', 'chiaro', 'chiara', 'scuro', 'scura', 'forte', 'debole',
  'dolce', 'amaro', 'caldo', 'calda', 'freddo', 'fredda', 'rosso', 'rossa',
  'verde', 'giallo', 'gialla', 'blu', 'bianco', 'bianca', 'nero', 'nera',
  'felice', 'triste', 'allegro', 'allegra', 'veloce', 'lento', 'lenta',
  'ricco', 'povero', 'pulito', 'sporco', 'luminoso', 'simpatico'
];

export function getWordsByGrammarCategory(category: 'nomi' | 'aggettivi' | 'verbi' | 'articoli'): string[] {
  switch (category) {
    case 'nomi':
      return ITALIAN_NOUNS;
    case 'aggettivi':
      return ITALIAN_ADJECTIVES;
    case 'verbi':
      return ITALIAN_VERBS;
    case 'articoli':
      return ITALIAN_ARTICLES;
    default:
      return ITALIAN_NOUNS;
  }
}

export function getRandomDistractor(targetCategory: 'nomi' | 'aggettivi' | 'verbi' | 'articoli'): { word: string; category: string } {
  const otherCategories: ('nomi' | 'aggettivi' | 'verbi' | 'articoli')[] = (['nomi', 'aggettivi', 'verbi', 'articoli'] as const).filter(
    (c) => c !== targetCategory
  );
  const randomCat = otherCategories[Math.floor(Math.random() * otherCategories.length)];
  const pool = getWordsByGrammarCategory(randomCat);
  const word = pool[Math.floor(Math.random() * pool.length)];
  return { word, category: randomCat };
}

