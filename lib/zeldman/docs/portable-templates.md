# Portable templates

A Zeldman template is rendered by at least two engines: Nunjucks in the
browser and on a Node server, and whatever Jinja-family engine the server
runs — Jinja2 for Python, Twig for PHP, gonja for Go, minijinja for Rust. The engines
share a syntax, not an implementation, and they disagree in a few dozen
places, some of them silently (a `{% if %}` that is never true, a hardness
scale one cell short). The portable dialect is the subset they agree on,
found by rendering 173 probe templates and the minerals example through
Nunjucks 3.2.4 and Jinja2 3.1.6 and diffing the bytes. Write in it and the
same file renders identically everywhere; `test/parity.test.js` checks.

## The rules, in one paragraph

Use `| length`, never `.length`. Quote dict keys: `{'a': x}`. Never print a
list; `| join` or `| dump` it. Never compare to `null`; write `not x`,
`x is defined` or `x is none`. Never rely on `[]` or `{}` being truthy;
test `| length`. Concatenate with `~`. Comment with `{#- -#}`. Round with
`(x + 0.5) | int`, not `| round`. Iterate dicts with `| dictsort`, or pass
a list. No `===`. Keep `{% extends %}` first in the file. Compare like
types, and do arithmetic on values the server has already checked. One
rule ahead of its column: use `or` and `and` only in conditions, because
Twig's `or` yields a boolean (`docs/roadmap.md`).

## Must avoid

Same syntax, different result (or an error) in one of the engines.

| construct | Nunjucks | Jinja2 | write this instead |
|---|---|---|---|
| `x.length` | length | `''` — silent | `x \| length` |
| `{ key: v }` | key is a string | key is an expression; error | `{'key': v}` |
| `x === y`, `x !== y` | works | syntax error | `==`, `!=` |
| `{% if list %}` on `[]` or `{}` | true | false | `{% if list \| length %}` |
| `7 == '7'` | true | false | compare like types (attribute values are already coerced) |
| `x == null`, `x == none` | true for undefined and null | `null` is a variable; `== none` is false for undefined | `not x`, `x is defined`, `x is none` |
| `{% for k, v in dict %}` | entries | unpack error | `{% for k, v in dict \| dictsort %}`, or pass a list |
| `{% for k in dict %}` | nothing | keys | as above |
| `dict.items()` | error | method, or key collision | never call methods |
| `s.startsWith(x)`, `s.indexOf(x)`, `s.slice(n)` | works | error | a filter the app registers on every environment, as `choices` is |
| `list[-1]` | `''` | last item | `list \| last`, `list \| first` |
| `{{ list }}`, `{{ range(3) }}` | `1,2` | `[1, 2]`, `range(0, 3)` | `\| join(',')` or `\| dump` |
| `'a' + 1` | `a1` | TypeError | `'a' ~ 1` |
| `missing + 1`, `missing <= 1`, `'10' < 9` | NaN, false, false | raises | guard with `is defined`; compute in the server |
| `n + 1` where `n` is an integer past 2^53 | a double: `9007199254740991 + 2` is `9007199254740992` | exact: `9007199254740993`; PHP, Go and Rust integers too | keep integers that reach a template within ±2^53 (`Number.MAX_SAFE_INTEGER`); past it, pass a string |
| `{% set x %}` in a loop, `x` defined outside | updates the outer `x` | loop-local copy | don't reassign outer variables in loops |
| `{# comment #}` on its own line | line kept, blank | line removed | `{#- comment -#}` |
| text before `{% extends %}` | dropped | printed | `{% extends %}` first |
| `\"` inside `{{ }}` | tolerated | lexer error | `'…'` strings inside double-quoted attributes |
| `\| round` | half away from zero | half to even | `(x + 0.5) \| int`, or `\| round(0, 'floor')` / `'ceil'` |
| `\| truncate(n)` | hard cut | word boundary, 5-char leeway | truncate in the server |
| `\| striptags` on text with entities | keeps `&amp;`, then re-escapes | decodes entities first | only on entity-free text |
| `\| upper` and friends on `none` | `''` | `NONE` | `\| default('', true)` first, or don't pass `None` |
| `x \| int` where `x` is `null` | `''` | `0` | `x is none` first |
| `\| groupby` | object | `(grouper, list)` pairs | group in the server |
| `\| nl2br` | works | missing | avoid |
| `\| tojson`, `\| format`, `\| map`, `\| selectattr`, `\| max`, `\| min`, `is sequence` | missing | work | avoid; `\| dump` for JSON |
| `\| join` on undefined | TypeError | `''` | guard |
| `x is defined if c else y` | works | syntax error (`is` takes the `if` as a test argument); gonja and minijinja too | `(x is defined) if c else y` |

## Confirmed portable

Identical output in both engines, including on undefined values.

- Structure: `extends`, `block`, `include` (a component inside an included
  template inside a loop works), `macro`, `{% set %}` and its block form,
  `if` / `elif` / `else`, `for … else`, `for` over a list, a string, `range`
  or an undefined value (no iterations).
- Expressions: inline `x if c` and `x if c else y`, `and` / `or` / `not`,
  `in` / `not in` on list, string and dict keys, chained `1 < n < 10`, `~`,
  `+ - * / // % **` on numbers (`8 / 2` prints `4`), unary minus,
  `{{ 'say "hi"' }}`.
- Tests: `is defined`, `none`, `odd`, `even`, `number`, `string`, `lower`,
  `upper`, `divisibleby`, `equalto`, `sameas`, `iterable`, `mapping`.
- Loop variables: `loop.index`, `index0`, `revindex`, `revindex0`, `first`,
  `last`, `length`.
- Filters: `length`, `first`, `last`, `join`, `sort`, `reverse`, `int`,
  `float`, `string`, `upper`, `lower`, `title`, `capitalize`, `trim`,
  `replace`, `abs`, `urlencode`, `batch`, `list`, `indent`, `wordcount`,
  `sum`, `default` (both forms), `dictsort`, `safe`, `e`, `escape`,
  `dump` of nested dicts, lists, unicode, floats, `none` and booleans,
  `| dump | e` in an attribute, `| dump | safe` in a JSON `<script>`.
- Whitespace: `{%- -%}`, `trim_blocks`, `lstrip_blocks`, the trailing
  newline of a file. Attributes one per line (`AGENTS.md`, Templates): a
  start tag's newlines, a `{% if x %} attr{% endif %}` alone on a line,
  true or false, two of them in a row, `{{ 'flag' if x }}` alone on a
  line, and `{% if x %}` and `{% endif %}` each alone on a line around
  several attribute lines, in a plain element and in a component tag,
  hold in all five engines (the controls' templates and the `multiline`
  forms, `test/parity.test.js`).
- Components: every attribute form in the expander's golden tests (bare
  booleans, `{{ 'flag' if x }}`, `{% if %}` around an attribute, kebab-case
  to camelCase, `data-*`, multi-line tags, content, the `choices` scan), and
  the scope rule: a component sees its tag, `content` and the globals;
  nothing of the page, not even a top-level `{% set %}` — pass those as
  attributes.

## Handled by the adapter, not by you

No template can express these; each server adapter makes its engine match
Nunjucks (for Python, see `server/python/zeldman.py`).

- Escaping: `"` becomes `&quot;` and `\` becomes `&#92;`, as in Nunjucks,
  rather than markupsafe's `&#34;` and bare backslash.
- `None` and undefined print as `''`, not `None`.
- Booleans print as `true` / `false`; integral floats print as `7`, not `7.0`.
- `| dump` is `JSON.stringify`: insertion order, no spaces, non-ASCII raw.
  Not `tojson`, which sorts keys and escapes `<`.
- The trailing newline of every file is kept (Jinja2 drops one by default),
  so component boundaries line up.
- `a.b` on a dict reads the key `b` first, so data keys like `items` or
  `values` are safe to use.
- Still yours to keep in mind: templates are LF, dict keys are not numeric
  strings (JS orders those first), and `1e16`-scale numbers are formatted
  in the server.

## Ahead of their columns: Twig (PHP), gonja (Go) and minijinja (Rust)

All three render the example and the forms table byte-identical with Node
(`test/parity.test.js`), and their adapters are in `server/`. Beyond the
rules above, Twig forces out:

| construct | why | write this instead |
|---|---|---|
| `{{ title or 'Untitled' }}` | Twig's `or` yields a boolean | `{{ title if title else 'Untitled' }}` |
| `x \| default(v)` on `null`; `default(v, true)` | Twig's `default` also covers null; ignores the flag | `default` only on possibly-undefined values, one argument |
| a macro defined and called in the same file | Twig needs `_self` | macros in their own file, `{% import %}`ed |
| `'a' in dict` | value test in Twig | `dict['a'] is defined` |
| `1 < n < 10` | `(1 < n) < 10` in Twig | split with `and` |
| `missing == 0`, `x == ''` where `x` may be undefined | PHP loose equality: `null == 0` | `not x`, `is defined` |
| `'01' == '1'`, `'1.0' == '1'`, `'1e1' == '10'` | PHP compares two numeric strings as numbers, so an option valued `01` is selected by `value="1"` | option values that are not two spellings of one number |
| `{% if x %}` where `x` is the string `'0'` (an option's `value`, a `data-*` value) | PHP's `'0'` is false; the other engines' is true | `x is defined`, or compare to a string: `x != ''`, `x == '0'` |
| `{% set x %}…{% endset %}` printed bare | escaped in Nunjucks, raw in Twig and Jinja2 | print captures with `\| safe` |
| `\| replace('a', 'o')`, `\| slice`, `\| trim('x')`, `\| urlencode`, `\| indent`, `\| list`, `\| sum`, `\| wordcount` | missing or different in Twig | do it in the server |
| `{}` in server data you dump | PHP cannot tell an empty object from an empty list (an attribute's JSON and a declared default are `ArrayObject`s, which print as `{}`) | pass an `ArrayObject` for an empty object in server data |

`elif` and inline `if` are fine: the Twig adapter rewrites them, since Twig
has `elseif` and `?:` but neither of ours. gonja forces out three things:

| construct | why | write this instead |
|---|---|---|
| `{{ nothing.a }}` where `nothing` is `null` | hard error | `{% if nothing %}{{ nothing.a }}{% endif %}`, or don't pass `null` |
| `{{ obj.missing.deeper }}` | second miss dereferences nil | one missing level at most |
| an inline `if` inside a larger expression | parse error | one ternary per `{{ }}`; nest with `{% if %}` |

minijinja (Rust) forces out one thing, found by rendering the list
controls through all five engines:

| construct | why | write this instead |
|---|---|---|
| `missing \| length` on a variable that is not a prop | `cannot calculate length of value of type undefined`; the other four give `0` | declare it (`options: []`), so an absent attribute is `[]` on every server; for a state field, `{% set x = x \| default([]) %}` first |

HM Land Registry and Crown Commercial Service first walked the Nunjucks to
Jinja path for GOV.UK Frontend in 2019–2020; this dialect stands on that work.
