import {
  compileSnippetBody,
  createPreviewParts,
  getFileDetails,
  getVariableValues,
  makeSnippet,
} from './snippet';
import { createVariableTransform } from '../constants/snippet';

describe('snippet variable transformations', () => {
  it('creates a valid VS Code transformation token', () => {
    expect(createVariableTransform('TM_DIRECTORY', 'upcase')).toBe(
      '${TM_DIRECTORY/(.*)/${1:/upcase}/}',
    );
  });

  it('resolves an uppercase directory transformation in the preview', () => {
    const values = getVariableValues(
      getFileDetails('Button.tsx'),
      '',
      'feature widgets',
    );

    expect(
      createPreviewParts(
        createVariableTransform('TM_DIRECTORY', 'upcase'),
        values,
      ),
    ).toEqual([
      {
        type: 'variable',
        label: 'TM_DIRECTORY',
        value: 'FEATURE WIDGETS',
      },
    ]);
  });

  it('compiles readable variable syntax to VS Code variable syntax', () => {
    expect(compileSnippetBody('${directory.capitalize}/${filenameBase}')).toBe(
      '${TM_DIRECTORY/(.*)/${1:/capitalize}/}/${TM_FILENAME_BASE}',
    );
  });

  it('keeps suffix text outside a compiled variable', () => {
    expect(compileSnippetBody('${filenameBase}Props')).toBe(
      '${TM_FILENAME_BASE}Props',
    );
  });

  it('accepts chained transformations and normalizes camel case plus capitalize', () => {
    expect(compileSnippetBody('${filenameBase.camelCase.capitalize}')).toBe(
      '${TM_FILENAME_BASE/(.*)/${1:/pascalcase}/}',
    );
  });

  it('leaves incomplete or unsupported friendly syntax untouched', () => {
    expect(compileSnippetBody('${directory.unsupported}')).toBe(
      '${directory.unsupported}',
    );
  });

  it('uses readable variable syntax in the preview and exported snippet', () => {
    const values = getVariableValues(
      getFileDetails('button.tsx'),
      '',
      'feature widgets',
    );

    expect(createPreviewParts('${directory.upperCase}', values)).toEqual([
      {
        type: 'variable',
        label: 'TM_DIRECTORY',
        value: 'FEATURE WIDGETS',
      },
    ]);
    expect(
      makeSnippet('Example', 'example', '', '${filename}', false),
    ).toContain('"${TM_FILENAME}"');
  });
});
