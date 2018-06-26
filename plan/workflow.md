
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
+-------------------------------------------------------------------------------------------------+
|  +-------------+                                                                                |
|  |MAKE NEW     |                                                                                |
|  +-------------+                                                                                |
|                                                                                                 |
|  existing sources         source name                                                           |
|  +--------------+         +---------------+                                                     |
|  |dcard         |         |dcard          |                                                     |
|  |hunt          |         +---------------+                                                     |
|  |pncc          |         data source                                                           |
|  |paycom        |         +---------------+                                                     |
|  |adp           |         |client file    |  enum based on api functions                        |
|  |              |         +---------------+                                                     |
|  |              |         loading function                                                      |
|  |              |         +---------------+                                                     |
|  |              |         |cs^ parser     |  enum based on api functions                        |
|  |              |         +---------------+                                                     |
|  |              |         schema                                                                |
|  |              |         +----------------+ +------------+                                     |
|  |              |         |default         | |b: add new  |                                     |
|  |              |         +----------------+ +------------+                                     |
|  |              |         +------------------------------------------------------------+        |
|  |              |         |path           |data type        |column name      |constrai|        |
|  |              |         +------------------------------------------------------------+        |
|  |              |         |{Post. Date}   |date             |post_date        |X       |delete  |
|  |              |         |{Amount}       |numeric          |amount           |X       |delete  |
|  |              |         |{Trans. Date}  |date             |trans_date       |X       |delete  |
|  |              |         |{Category}     |text             |category         |        |delete  |
|  |              |         |{Description}  |text             |descr            |        |delete  |
|  |              |         |               |                 |                 |        |add     |
|  +--------------+         +------------------------------------------------------------+        |
|                                                                                                 |
|                                                                                                 |
|                                                                                                 |
|                                                                                                 |
+-------------------------------------------------------------------------------------------------+
||Trans. Date|Post Date|Description                                   |Amount|Category        |   |
|---------------------------------------------------------------------------------------------+   |
||1/2/2018   |1/2/2018 |GOOGLE *YOUTUBE VIDEOS G.CO/HELPPAY#CAP0H07TXV|4.26  |Services        |   |
||1/2/2018   |1/2/2018 |MICROSOFT *ONEDRIVE 800-642-7676 WA           |4.26  |Services        |   |
||1/3/2018   |1/3/2018 |CLE CLINIC PT PMTS 216-445-6249 OHAK2C57F2F0B3|200   |Medical Services|   |
+|1/4/2018   +1/4/2018 +AT&T *PAYMENT 800-288-2020 TX                 +57.14 +Services        |   |
|                                                                                                 |
+-------------------------------------------------------------------------------------------------+
```
## regex maintenance

