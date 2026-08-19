import {
  LANGUAGE_BY_EXTENSION,
  TEXT_TRANSFORMS,
  VARIABLE_BY_FRIENDLY_NAME,
  createVariableTransform,
} from '../constants/snippet';
import type {
  FileDetails,
  PreviewPart,
  SnippetLanguage,
  VariableValues,
} from '../types/snippet';

const PLAIN_TEXT_LANGUAGE: SnippetLanguage = {
  id: 'plaintext',
  label: 'Plain text',
  hint: 'Plain text',
};

export function getFileDetails(filename: string): FileDetails {
  const cleanName = filename.trim() || 'component.jsx';
  const parts = cleanName.split('.');
  const extension =
    parts.length > 1 ? (parts.pop()?.toLowerCase() ?? 'txt') : 'txt';
  const base = parts.join('.') || cleanName;

  return {
    filename: cleanName,
    base,
    extension,
    language: LANGUAGE_BY_EXTENSION[extension] || PLAIN_TEXT_LANGUAGE,
  };
}

export function getVariableValues(
  file: FileDetails,
  selectedText: string,
  folderName: string,
): VariableValues {
  const now = new Date();
  const padWithZero = (number: number) => String(number).padStart(2, '0');
  const commentTokens = getCommentTokens(file.language.id);
  const timezoneOffset = -now.getTimezoneOffset();
  const offsetSign = timezoneOffset >= 0 ? '+' : '-';
  const offsetHours = padWithZero(Math.floor(Math.abs(timezoneOffset) / 60));
  const offsetMinutes = padWithZero(Math.abs(timezoneOffset) % 60);

  return {
    TM_SELECTED_TEXT: selectedText,
    TM_FILENAME: file.filename,
    TM_FILENAME_BASE: file.base,
    TM_DIRECTORY: folderName.trim() || 'components',
    TM_FILEPATH: `/${folderName.trim() || 'components'}/${file.filename}`,
    RELATIVE_FILEPATH: `${folderName.trim() || 'components'}/${file.filename}`,
    TM_CURRENT_LINE: '',
    TM_CURRENT_WORD: '',
    TM_LINE_INDEX: '0',
    TM_LINE_NUMBER: '1',
    CURRENT_YEAR: String(now.getFullYear()),
    CURRENT_YEAR_SHORT: String(now.getFullYear()).slice(-2),
    CURRENT_MONTH: padWithZero(now.getMonth() + 1),
    CURRENT_MONTH_NAME: now.toLocaleString('en', { month: 'long' }),
    CURRENT_MONTH_NAME_SHORT: now.toLocaleString('en', { month: 'short' }),
    CURRENT_DATE: padWithZero(now.getDate()),
    CURRENT_DAY_NAME: now.toLocaleString('en', { weekday: 'long' }),
    CURRENT_DAY_NAME_SHORT: now.toLocaleString('en', { weekday: 'short' }),
    CURRENT_HOUR: padWithZero(now.getHours()),
    CURRENT_MINUTE: padWithZero(now.getMinutes()),
    CURRENT_SECOND: padWithZero(now.getSeconds()),
    CURRENT_MILLISECOND: String(now.getMilliseconds()).padStart(3, '0'),
    CURRENT_SECONDS_UNIX: String(Math.floor(now.getTime() / 1000)),
    CURRENT_MILLISECONDS_UNIX: String(now.getTime()),
    CURRENT_TIMEZONE_OFFSET: `${offsetSign}${offsetHours}:${offsetMinutes}`,
    CURRENT_TIMEZONE_NAME: Intl.DateTimeFormat().resolvedOptions().timeZone,
    RANDOM: '123456',
    RANDOM_HEX: 'a1b2c3',
    UUID: '00000000-0000-4000-8000-000000000000',
    CLIPBOARD: '',
    WORKSPACE_NAME: 'workspace',
    WORKSPACE_FOLDER: '/workspace',
    CURSOR_INDEX: '0',
    CURSOR_NUMBER: '1',
    BLOCK_COMMENT_START: commentTokens.start,
    BLOCK_COMMENT_END: commentTokens.end,
    LINE_COMMENT: commentTokens.line,
  };
}

export function createPreviewParts(
  body: string,
  values: VariableValues,
): PreviewPart[] {
  const compiledBody = compileSnippetBody(body);
  const parts: PreviewPart[] = [];
  let lastIndex = 0;
  let token = getNextSnippetToken(compiledBody, lastIndex);

  while (token) {
    if (token.start > lastIndex) {
      parts.push({
        type: 'text',
        value: compiledBody.slice(lastIndex, token.start),
      });
    }

    const raw = token.raw;
    const choice = raw.match(/^(\d+)\|(.+)\|$/);
    const placeholder = raw.match(/^(\d+):(.*)$/);
    const tabstop = raw.match(/^\d+$/);
    const variableDefault = raw.match(/^([A-Z][A-Z0-9_]*):(.*)$/);
    const variableTransform = raw.match(
      /^([A-Z][A-Z0-9_]*)\/(.*?)\/(.*)\/([a-z]*)$/,
    );

    if (choice) {
      parts.push({
        type: 'placeholder',
        label: `tab ${choice[1]}`,
        value: choice[2].split(',')[0],
      });
    } else if (placeholder) {
      parts.push({
        type: 'placeholder',
        label: `tab ${placeholder[1]}`,
        value: placeholder[2] || `tab ${placeholder[1]}`,
      });
    } else if (tabstop) {
      parts.push({
        type: 'cursor',
        label: raw,
        value: raw === '0' ? 'final cursor' : `tab ${raw}`,
      });
    } else {
      parts.push(
        createVariablePart(raw, values, variableDefault, variableTransform),
      );
    }

    lastIndex = token.end;
    token = getNextSnippetToken(compiledBody, lastIndex);
  }

  if (lastIndex < compiledBody.length) {
    parts.push({ type: 'text', value: compiledBody.slice(lastIndex) });
  }

  return parts;
}

export function makeSnippet(
  name: string,
  prefix: string,
  description: string,
  body: string,
  isFileTemplate: boolean,
): string {
  const definition = {
    prefix: prefix || name.toLowerCase().replace(/\s+/g, '-'),
    body: compileSnippetBody(body).split('\n'),
    ...(description ? { description } : {}),
    ...(isFileTemplate ? { isFileTemplate: true } : {}),
  };

  return JSON.stringify({ [name || 'My Snippet']: definition }, null, 2);
}

/** Converts readable variables and transformation chains to VS Code syntax. */
export function compileSnippetBody(body: string): string {
  const compileVariable = (
    fullMatch: string,
    friendlyName: string,
    transformNames: string[] = [],
    useBraces = false,
  ) => {
    const variable = VARIABLE_BY_FRIENDLY_NAME[friendlyName];
    if (!variable) return fullMatch;

    if (!transformNames.length) {
      return useBraces ? `\${${variable.token}}` : `$${variable.token}`;
    }
    const transform = getExportTransform(transformNames);
    return transform
      ? createVariableTransform(variable.token, transform.format)
      : fullMatch;
  };

  const bracedBody = body.replace(
    /\$\{([a-z][a-zA-Z0-9]*)((?:\.[a-zA-Z][a-zA-Z0-9]*)*)\}/g,
    (fullMatch, friendlyName: string, transformPath: string) =>
      compileVariable(
        fullMatch,
        friendlyName,
        transformPath.split('.').filter(Boolean),
        true,
      ),
  );

  return bracedBody.replace(
    /\$([a-z][a-zA-Z0-9]*)(?:\.(upperCase|lowerCase|capitalize|camelCase|pascalCase))?(?![a-zA-Z0-9.])/g,
    (fullMatch, friendlyName: string, transformName?: string) => {
      return compileVariable(
        fullMatch,
        friendlyName,
        transformName ? [transformName] : [],
      );
    },
  );
}

function getExportTransform(transformNames: string[]) {
  const transforms = transformNames.map((name) =>
    TEXT_TRANSFORMS.find((transform) => transform.name === name),
  );
  if (transforms.some((transform) => !transform)) return undefined;

  if (transformNames.join('.') === 'camelCase.capitalize') {
    return TEXT_TRANSFORMS.find(({ name }) => name === 'pascalCase');
  }

  return transforms[transforms.length - 1];
}

function getCommentTokens(language: string): {
  start: string;
  end: string;
  line: string;
} {
  if (language === 'html' || language === 'xml') {
    return { start: '<!--', end: '-->', line: '' };
  }

  if (language === 'css' || language === 'scss') {
    return { start: '/*', end: '*/', line: '' };
  }

  return { start: '/*', end: '*/', line: '//' };
}

function createVariablePart(
  raw: string,
  values: VariableValues,
  variableDefault: RegExpMatchArray | null,
  variableTransform: RegExpMatchArray | null,
): PreviewPart {
  const name = variableTransform
    ? variableTransform[1]
    : variableDefault
      ? variableDefault[1]
      : raw;
  const fallback = variableDefault ? variableDefault[2] : '';

  if (!Object.prototype.hasOwnProperty.call(values, name)) {
    return { type: 'placeholder', label: name, value: fallback || name };
  }

  let value = values[name] || fallback || '∅';
  if (variableTransform) {
    try {
      value = transformVariableValue(value, variableTransform);
    } catch {
      value = values[name] || fallback || '∅';
    }
  }

  return { type: 'variable', label: name, value };
}

function getNextSnippetToken(
  body: string,
  startAt: number,
): { start: number; end: number; raw: string } | null {
  let start = body.indexOf('$', startAt);

  while (start !== -1) {
    if (body[start + 1] === '{') {
      const end = findClosingBrace(body, start + 1);
      if (end !== -1) {
        return { start, end: end + 1, raw: body.slice(start + 2, end) };
      }
    } else {
      const match = body.slice(start + 1).match(/^([A-Z][A-Z0-9_]*|\d+)/);
      if (match) {
        return { start, end: start + 1 + match[1].length, raw: match[1] };
      }
    }

    start = body.indexOf('$', start + 1);
  }

  return null;
}

function findClosingBrace(body: string, openingBrace: number) {
  let depth = 0;

  for (let index = openingBrace; index < body.length; index += 1) {
    if (body[index] === '{') depth += 1;
    if (body[index] === '}') depth -= 1;
    if (depth === 0) return index;
  }

  return -1;
}

function transformVariableValue(value: string, transform: RegExpMatchArray) {
  const expression = new RegExp(transform[2], transform[4]);
  return value.replace(expression, (...match) =>
    transformReplacement(transform[3], match),
  );
}

function transformReplacement(replacement: string, match: string[]) {
  return replacement
    .replace(
      /\$\{(\d+):\/(upcase|downcase|capitalize|camelcase|pascalcase)\}/g,
      (_, index, format) => applyTextFormat(match[Number(index)] || '', format),
    )
    .replace(/\$(\d+)/g, (_, index) => match[Number(index)] || '');
}

function applyTextFormat(value: string, format: string) {
  if (format === 'upcase') return value.toUpperCase();
  if (format === 'downcase') return value.toLowerCase();
  if (format === 'capitalize') {
    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
  }

  const words = value.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const camelCase = words
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`,
    )
    .join('');

  return format === 'pascalcase'
    ? `${camelCase.charAt(0).toUpperCase()}${camelCase.slice(1)}`
    : camelCase;
}
