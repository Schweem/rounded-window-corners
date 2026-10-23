/**
 * @file Base class for effects that apply a GLSL fragment snippet.
 *
 * GNOME 51 removed `Shell.GLSLEffect` in favor of `Clutter.ShaderEffect`,
 * which takes a `Cogl.Snippet` and sets uniforms by name instead of by
 * location. This picks whichever one is available and exposes a common API.
 */

import Clutter from 'gi://Clutter';
import Cogl from 'gi://Cogl';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';

type SnippetEffect = Clutter.OffscreenEffect & {
    setUniformFloat: (
        name: string,
        nComponents: number,
        value: number[],
    ) => void;
};

type SnippetEffectClass = new () => SnippetEffect;

type ShaderEffect51 = {
    // biome-ignore lint/style/useNamingConvention: GObject method name
    set_uniform_float: (
        name: string,
        nComponents: number,
        value: number[],
    ) => void;
};

/**
 * Create an effect class that applies a fragment shader snippet.
 *
 * @param name - Unique name for the GType, since GJS would otherwise derive the
 *               same name from this module for every class.
 * @param declarations - GLSL declarations (uniforms, functions).
 * @param code - GLSL code to run after the default fragment shader.
 * @returns An effect class that can be further subclassed.
 */
export function snippetEffect(
    name: string,
    declarations: string,
    code: string,
): SnippetEffectClass {
    // `Shell.GLSLEffect` is undefined on GNOME 51 and later
    if (Shell.GLSLEffect) {
        /**
         * Looking up uniform locations is expensive, so they are cached.
         * Locations are global to the Cogl context, so the cache can be shared
         * between all instances.
         */
        const locations = new Map<string, number>();

        return GObject.registerClass(
            {GTypeName: name},
            class extends Shell.GLSLEffect {
                vfunc_build_pipeline() {
                    this.add_glsl_snippet(
                        Cogl.SnippetHook.FRAGMENT,
                        declarations,
                        code,
                        false,
                    );
                }

                setUniformFloat(
                    name: string,
                    nComponents: number,
                    value: number[],
                ) {
                    let location = locations.get(name);
                    if (location === undefined) {
                        location = this.get_uniform_location(name);
                        locations.set(name, location);
                    }
                    this.set_uniform_float(location, nComponents, value);
                }
            },
        );
    }

    return GObject.registerClass(
        {GTypeName: name},
        class extends Clutter.ShaderEffect {
            vfunc_get_static_snippet() {
                return Cogl.Snippet.new(
                    Cogl.SnippetHook.FRAGMENT,
                    declarations,
                    code,
                );
            }

            setUniformFloat(
                name: string,
                nComponents: number,
                value: number[],
            ) {
                // Not in the GNOME 50 typings yet
                (this as unknown as ShaderEffect51).set_uniform_float(
                    name,
                    nComponents,
                    value,
                );
            }
        },
    ) as unknown as SnippetEffectClass;
}
