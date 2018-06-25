
## workflow overview
* initial setup
    1. create a source
    2. run import
    3. setup regex
    4. map all regex
* on-going usage
    1. run import
    2. address any new unmapped items

## source maintenance

```
 source maintenance
+----------------------------------------------------------------------------------------------------------------+
|  +-------------+                                                                                               |
|  |MAKE NEW     |                                                                                               |
|  +-------------+                                                                                               |
|                                                                                                                |
|  existing sources         source name                                                                          |
|  +-------------+          +---------------+                                                                    |
|  |dcard        |          |tb:dcard       |                                                                    |
|  |hunt         |          +---------------+                                                                    |
|  |pncc         |          data source                                                                          |
|  |paycom       |          +---------------+                                                                    |
|  |adp          |          |client file    |                                                                    |
|  |             |          +---------------+                                                                    |
|  |             |          loading function                                                                     |
|  |             |          +---------------+                                                                    |
|  |             |          |csv parser     |                                                                    |
|  |             |          +---------------+                                                                    |
|  |             |          schema                                                                               |
|  |             |          +----------------+ +------------+                                                    |
|  |             |          |default         | |b: add new  |                                                    |
|  |             |          +----------------+ +------------+                                                    |
|  |             |          +-------------------------------------------------------------+                      |
|  |             |          |path           |data type        |column name      |constrain|                      |
|  |             |          +-------------------------------------------------------------+                      |
|  |             |          |{Post. Date}   |date             |post_date        |X        |                      |
|  |             |          |{Amount}       |numeric          |amount           |X        |                      |
|  |             |          |{Trans. Date}  |date             |trans_date       |X        |                      |
|  |             |          |{Category}     |text             |category         |         |                      |
|  |             |          |{Description}  |text             |descr            |         |                      |
|  |             |          |               |                 |                 |         |                      |
|  |             |          |               |                 |                 |         |                      |
|  |             |          |               |                 |                 |         |                      |
|  |             |          |               |                 |                 |         |                      |
|  |             |          |               |                 |                 |         |                      |
|  |             |          |               |                 |                 |         |                      |
|  |             |          |               |                 |                 |         |                      |
|  +-------------+          +-------------------------------------------------------------+                      |
+----------------------------------------------------------------------------------------------------------------+
```