Themes are 'tag containers' which emulate track's tags, to be used with 
'search_bydistance' buttons and tools instead of evaluating with a selected 
track.

Recipes are 'variables containers' which emulate the input of 
'search_bydistance' buttons and tools instead of using hardcoded variables 
or properties. Recipes may also contain a forced theme, either the entire 
object or a link to a theme file (path or filename).

Both may be used in buttons, tools or with Playlist Tools's Pools (pools' 
themes and recipes arguments may link to these files).

Recipes and filter files may be set to 'Hidden' (file attribute) to not show 
them on Foobar scripts. 

Any file named like 'test_*' or 'int_*' will be set to hidden on startup, 
as they are only meant as examples. Create a copy and rename to use them.

Filters are pre-defined queries meant to be used as forced queries to filter 
the library, independently of the recipe, theme or other config set. 
Currently used on the customizable 'search_bydistance' button.