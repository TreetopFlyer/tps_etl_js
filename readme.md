### Interaction Details

* Maintain source definitions
    * List all sources
    * change existing
    * create new (with optional sample data to pre-poluate)
    * option to step into regex config

* Regex Instructions (Maint/Inquire)
    * select source
    * list all targets for that source
    * either edit existing target or make a new one
    * target editing
        * for each component of the instruction
            * be able to run ad-hoc regex
            * add additional components

* Cross Reference List (Maint/Inquire)
    
    * for a given regex target
    * list all output values (or only not yet mapped) and give oportunity to assign alternate value under a different key

* Run Import

    * insert new data

### source definition
```
 srce |                   jsonb_pretty
------+---------------------------------------------------
 hunt | {                                                +
      |     "name": "hunt",                              +
      |     "source": "client_file",                     +
      |     "schemas": {                                 +
      |         "default": [                             +
      |             {                                    +
      |                 "path": "{Date}",                +
      |                 "type": "date",                  +
      |                 "column_name": "Date"            +
      |             },                                   +
      |             {                                    +
      |                 "path": "{Reference Number}",    +
      |                 "type": "numeric",               +
      |                 "column_name": "Reference Number"+
      |             },                                   +
      |             {                                    +
      |                 "path": "{Payee Name}",          +
      |                 "type": "text",                  +
      |                 "column_name": "Payee Name"      +
      |             },                                   +
      |             {                                    +
      |                 "path": "{Memo}",                +
      |                 "type": "text",                  +
      |                 "column_name": "Memo"            +
      |             },                                   +
      |             {                                    +
      |                 "path": "{Amount}",              +
      |                 "type": "numeric",               +
      |                 "column_name": "Amount"          +
      |             },                                   +
      |             {                                    +
      |                 "path": "{Category Name}",       +
      |                 "type": "text",                  +
      |                 "column_name": "Cateogry Name"   +
      |             }                                    +
      |         ]                                        +
      |     },                                           +
      |     "constraint": [                              +
      |         "{Date}"                                 +
      |     ],                                           +
      |     "loading_function": "csv"                    +
      | }
```

### regex definitions

```
srce  |  target  |                                     regex                                      | seq
-------+----------+--------------------------------------------------------------------------------+-----
 dcard | First 20 | {                                                                             +|   2
       |          |     "name": "First 20",                                                       +|
       |          |     "srce": "dcard",                                                          +|
       |          |     "regex": {                                                                +|
       |          |         "defn": [                                                             +|
       |          |             {                                                                 +|
       |          |                 "key": "{Description}",                                       +|
       |          |                 "map": "y",                                                   +|
       |          |                 "flag": "",                                                   +|
       |          |                 "field": "f20",                                               +|
       |          |                 "regex": ".{1,20}",                                           +|
       |          |                 "retain": "y"                                                 +|
       |          |             }                                                                 +|
       |          |         ],                                                                    +|
       |          |         "name": "First 20",                                                   +|
       |          |         "where": [                                                            +|
       |          |             {                                                                 +|
       |          |             }                                                                 +|
       |          |         ],                                                                    +|
       |          |         "function": "extract",                                                +|
       |          |         "description": "pull first 20 characters from description for mapping"+|
       |          |     },                                                                        +|
       |          |     "sequence": 2                                                             +|
       |          | }                                                                              |
 hunt  | First 20 | {                                                                             +|   1
       |          |     "name": "First 20",                                                       +|
       |          |     "srce": "hunt",                                                           +|
       |          |     "regex": {                                                                +|
       |          |         "defn": [                                                             +|
       |          |             {                                                                 +|
       |          |                 "key": "{Memo}",                                              +|
       |          |                 "map": "y",                                                   +|
       |          |                 "flag": "",                                                   +|
       |          |                 "field": "f20",                                               +|
       |          |                 "regex": ".{1,20}",                                           +|
       |          |                 "retain": "y"                                                 +|
       |          |             }                                                                 +|
       |          |         ],                                                                    +|
       |          |         "name": "First 20",                                                   +|
       |          |         "where": [                                                            +|
       |          |             {                                                                 +|
       |          |             }                                                                 +|
       |          |         ],                                                                    +|
       |          |         "function": "extract",                                                +|
       |          |         "description": "pull first 20 characters from description for mapping"+|
       |          |     },                                                                        +|
       |          |     "sequence": 1                                                             +|
       |          | }                                                                              |
```