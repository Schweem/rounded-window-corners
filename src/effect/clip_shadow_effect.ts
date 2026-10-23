/**
 * @file Clips shadows for windows.
 *
 * Needed because of this issue:
 * https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/4474
 */

import GObject from 'gi://GObject';

import {readShader} from '../utils/file.js';
import {snippetEffect} from './snippet_effect.js';

const [declarations, code] = await readShader(
    import.meta.url,
    'shader/clip_shadow.frag',
);

export const ClipShadowEffect = GObject.registerClass(
    {},
    class extends snippetEffect(
        'RwcSnippetEffectClipShadow',
        declarations,
        code,
    ) {},
);
